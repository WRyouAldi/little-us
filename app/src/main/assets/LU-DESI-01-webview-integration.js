/**
 * LU-DESI-01 WebView integration helper
 * Place beside story-world.html and load after Three.js + GLTFLoader.
 *
 * IMPORTANT:
 * The supplied LU-DESI-01.glb is a STATIC, separately named mesh assembly.
 * This helper gives it lightweight articulated object animation (arm/leg pivots),
 * not a true glTF skin/skeleton. A skinned rig must be authored separately.
 */
export async function mountDesiCharacter({
  THREE, GLTFLoader, scene, avatar,
  url = './assets/LU-DESI-01.glb',
  targetHeight = 1.62
}) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  root.name = 'LU-DESI-01';
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if ('roughness' in m) m.roughness = Math.max(m.roughness ?? 0.7, 0.55);
      }
    }
  });

  root.updateWorldMatrix(true, true);
  let bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  if (!size.y) throw new Error('LU-DESI-01.glb has empty bounds');
  root.scale.setScalar(targetHeight / size.y);
  root.updateWorldMatrix(true, true);
  bounds = new THREE.Box3().setFromObject(root);
  root.position.y -= bounds.min.y;

  const parent = avatar || scene;
  parent.add(root);

  const find = name => root.getObjectByName(name);
  function makePivot(meshName, pivotName, pivotPosition) {
    const mesh = find(meshName);
    if (!mesh || !mesh.parent) return null;
    mesh.updateWorldMatrix(true, false);
    const pivot = new THREE.Group();
    pivot.name = pivotName;
    const parentNode = mesh.parent;
    parentNode.add(pivot);
    pivot.position.set(...pivotPosition);
    pivot.updateWorldMatrix(true, false);
    pivot.attach(mesh);
    return pivot;
  }

  const joints = {
    leftArm: makePivot('Jacket_L_upper_sleeve', 'LU_joint_arm_L', [-0.225, 1.16, 0]),
    rightArm: makePivot('Jacket_R_upper_sleeve', 'LU_joint_arm_R', [0.225, 1.16, 0]),
    leftLeg: makePivot('Trouser_L_leg', 'LU_joint_leg_L', [-0.105, 0.58, 0]),
    rightLeg: makePivot('Trouser_R_leg', 'LU_joint_leg_R', [0.105, 0.58, 0])
  };

  const state = { root, joints, mode: 'idle', time: 0, clips: gltf.animations || [] };
  root.userData.luDesi = state;
  function setMode(mode) { state.mode = mode === 'walk' ? 'walk' : 'idle'; }
  function update(deltaSeconds) {
    const dt = Math.min(Math.max(deltaSeconds || 0, 0), 0.05);
    state.time += dt;
    const t = state.time;
    const walking = state.mode === 'walk';
    const gait = walking ? Math.sin(t * 8.5) * 0.42 : 0;
    if (joints.leftArm) joints.leftArm.rotation.x = walking ? -gait * 0.65 : Math.sin(t * 1.2) * 0.025;
    if (joints.rightArm) joints.rightArm.rotation.x = walking ? gait * 0.65 : -Math.sin(t * 1.2) * 0.025;
    if (joints.leftLeg) joints.leftLeg.rotation.x = gait;
    if (joints.rightLeg) joints.rightLeg.rotation.x = -gait;
    root.position.y = walking ? Math.abs(Math.sin(t * 8.5)) * 0.018 : Math.sin(t * 1.5) * 0.006;
    root.rotation.z = walking ? Math.sin(t * 4.25) * 0.025 : Math.sin(t * 0.7) * 0.006;
  }
  return { root, state, setMode, update };
}
