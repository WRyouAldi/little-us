import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const out='artifacts';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const errors=[];
try {
  const context=await browser.newContext({
    viewport:{width:393,height:873},
    screen:{width:393,height:873},
    deviceScaleFactor:3,
    isMobile:true,
    hasTouch:true,
    userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error') errors.push('console: '+m.text())});
  await page.goto('http://127.0.0.1:4173/story-world.html',{waitUntil:'networkidle',timeout:60000});
  await page.waitForFunction(()=>window.__LITTLE_US_TEST__ && window.__LITTLE_US_TEST__.renderer.info.render.calls>0,{timeout:30000});
  await page.waitForTimeout(1800);

  const diagnostics=await page.evaluate(()=>{
    const t=window.__LITTLE_US_TEST__,canvas=document.querySelector('#world');
    const r=canvas.getBoundingClientRect();
    return {
      viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
      canvas:{cssWidth:r.width,cssHeight:r.height,pixelWidth:canvas.width,pixelHeight:canvas.height},
      scene:{beacons:t.beaconCount,memories:t.memoryCount,fireflies:t.fireflyCount,renderCalls:t.renderer.info.render.calls,triangles:t.renderer.info.render.triangles,geometries:t.renderer.info.memory.geometries},
      quality:{tier:t.quality.tier,maxDpr:t.quality.maxDpr,currentDpr:t.quality.currentDpr,maxTexture:t.quality.maxTexture,cores:t.quality.cores,memory:t.quality.memory,powerPreference:t.renderer.getContext().getContextAttributes()?.powerPreference},
      realism:t.realism,
      controls:[...document.querySelectorAll('.top button,.actions button')].map(b=>{const x=b.getBoundingClientRect();return {id:b.id||b.textContent.trim(),left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height,visible:x.width>0&&x.height>0&&x.left>=0&&x.right<=innerWidth&&x.top>=0&&x.bottom<=innerHeight}})
    }
  });
  await page.screenshot({path:path.join(out,'story-world-393x873.png'),fullPage:true});
  if(diagnostics.canvas.pixelWidth<393 || diagnostics.canvas.pixelHeight<873) throw new Error('Canvas render resolution smaller than Android-sized viewport: '+JSON.stringify(diagnostics.canvas));
  if(!diagnostics.quality || diagnostics.quality.currentDpr<=0 || diagnostics.quality.currentDpr>diagnostics.quality.maxDpr+0.01) throw new Error('Device-adaptive quality profile invalid: '+JSON.stringify(diagnostics.quality));
  if(!['ultra','high','balanced','efficient'].includes(diagnostics.quality.tier)) throw new Error('Unknown device quality tier: '+JSON.stringify(diagnostics.quality));
  if(diagnostics.scene.beacons!==7 || diagnostics.scene.memories!==7) throw new Error('Expected seven interactive beacons and memories: '+JSON.stringify(diagnostics.scene));
  if(diagnostics.scene.renderCalls<1 || diagnostics.scene.triangles<100) throw new Error('3D scene appears not to be rendering: '+JSON.stringify(diagnostics.scene));
  if(!diagnostics.realism || !diagnostics.realism.proceduralTextures || !diagnostics.realism.bumpMaps || !diagnostics.realism.organicPetals || !diagnostics.realism.trees || !diagnostics.realism.path || diagnostics.realism.petals<10) throw new Error('3D realism assets missing: '+JSON.stringify(diagnostics.realism));
  const hidden=diagnostics.controls.filter(x=>!x.visible);
  if(hidden.length) throw new Error('Mobile controls overflow/off-screen: '+JSON.stringify(hidden));

  await page.getByRole('button',{name:/Perjalanan/}).tap();
  await page.locator('#memory.show').waitFor({state:'visible',timeout:5000});
  const first=await page.locator('#counter').textContent();
  for(let i=0;i<6;i++) await page.locator('#next').tap();
  const last=await page.locator('#counter').textContent();
  if(!first?.includes('01 / 07') || !last?.includes('07 / 07')) throw new Error('Memory journey navigation failed: '+first+' -> '+last);
  await page.screenshot({path:path.join(out,'memory-panel-393x873.png'),fullPage:true});
  await page.locator('#close').tap();
  await page.getByRole('button',{name:/Kangen/}).tap();
  const hint=await page.locator('#hint').textContent();
  if(!hint?.includes('Kangen')) throw new Error('Kangen action did not update feedback text');
  await page.screenshot({path:path.join(out,'world-after-interaction-393x873.png'),fullPage:true});

  fs.writeFileSync(path.join(out,'diagnostics.json'),JSON.stringify({status:'PASS',diagnostics,journey:{first,last},errors},null,2));
  console.log(JSON.stringify({status:'PASS',diagnostics,journey:{first,last},errors},null,2));
  if(errors.length) throw new Error('Browser reported errors: '+errors.join(' | '));
} catch(e) {
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({status:'FAIL',message:e.message,errors},null,2));
  throw e;
} finally { await browser.close(); }
