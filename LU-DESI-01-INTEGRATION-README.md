# LU-DESI-01 WebView integration

## Files
- `LU-DESI-01.glb`: static 3D mesh assembly with PBR materials (not yet committed to this repository).
- `LU-DESI-01-webview-integration.js`: Three.js loader and lightweight articulated object animation.

## Important limitation
The current GLB is **not a true skinned/rigged character**. It contains separately named mesh parts. The helper adds pivot-based articulation and idle/walk motion, but it does not provide skin weights, a glTF skeleton, or smooth deformation at joints. This is a prototype integration layer, not a finished realistic rig.

## Integration outline
1. Add `LU-DESI-01.glb` at `assets/LU-DESI-01.glb` in the web deployment and at `app/src/main/assets/assets/LU-DESI-01.glb` for Android assets.
2. Load the helper as an ES module after Three.js and GLTFLoader:
   ```js
   import { mountDesiCharacter } from './LU-DESI-01-webview-integration.js';
   const desi = await mountDesiCharacter({ THREE, GLTFLoader, scene, avatar });
   ```
3. In the existing walk target update, call `desi.setMode(isWalking ? 'walk' : 'idle')` and `desi.update(delta)`.
4. Hide/remove the old `characterRig` only after the GLB successfully loads; keep it as fallback if loading fails.
5. Do not change scene, memory points, navigation or Daisy interactions.

## Validation status
- Source audit found duplicated module-level declarations in the original `story-world.html`; this draft PR removes the duplicate block.
- Source declaration counts were checked after the patch.
- GLB has not yet been committed to the repository.
- Browser and Android WebView runtime tests have not been run.

## Testing checklist
- GLB request returns HTTP 200 / local asset loads.
- Model feet touch ground; height about 1.62 world units.
- No duplicate avatar remains visible.
- Idle and walk modes switch as expected.
- Existing seven memory points, Daisy and navigation still work.
- Test in Android WebView, including offline behavior.
