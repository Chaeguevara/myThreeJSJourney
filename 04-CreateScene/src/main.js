import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

/**
 * =====================================================================
 * Three.js 04 - Creating a Scene
 * Reference: https://threejs.org/manual/#creating-a-scene
 * =====================================================================
 */

// 1. Scene (3D 공간 컨테이너)
const scene = new THREE.Scene();

// 2. Camera (원근 투영 카메라)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// 3. Renderer (WebGL 렌더러)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // HiDPI/Retina GPU 과부하 방지
document.body.appendChild(renderer.domElement);

// 4. Mesh (형상 Geometry + 외관 Material)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. Controls (카메라 인터랙션)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = true;

// 6. Runtime State & Animation Parameters
const params = {
  isAnimating: true,
  speed: 1.0,
  wireframe: false,
  enableOrbit: true,
  reset() {
    params.isAnimating = true;
    params.speed = 1.0;
    params.wireframe = false;
    material.wireframe = false;
    material.color.setHex(0x00ff00);
    camera.position.set(0, 0, 5);
    controls.target.set(0, 0, 0);
    controls.update();
    gui.controllers.forEach((c) => c.update());
  },
};

// 7. Debug UI (Three.js 표준 lil-gui 활용 - 수백 줄의 바닐라 DOM 대체)
const gui = new GUI({ title: 'Scene Controls' });

const animFolder = gui.addFolder('Animation');
animFolder.add(params, 'isAnimating').name('회전 재생/일시정지');
animFolder.add(params, 'speed', 0, 3, 0.1).name('회전 속도 배율');

const meshFolder = gui.addFolder('Mesh (Cube)');
meshFolder.addColor(material, 'color').name('색상');
meshFolder
  .add(params, 'wireframe')
  .name('와이어프레임')
  .onChange((v) => {
    material.wireframe = v;
  });

const cameraFolder = gui.addFolder('Camera & Controls');
cameraFolder.add(camera.position, 'z', 2, 12, 0.1).name('카메라 Z 위치').listen();
cameraFolder
  .add(params, 'enableOrbit')
  .name('OrbitControls')
  .onChange((v) => {
    controls.enabled = v;
  });

gui.add(params, 'reset').name('기본값 복원');

// 8. Animation & Render Loop (Delta Time 기반 적분으로 속도 변경 시 각도 튐 방지)
const clock = new THREE.Clock();
let effectiveTime = 0;

function animate() {
  const delta = clock.getDelta();

  if (params.isAnimating) {
    effectiveTime += delta * params.speed;
    cube.rotation.x = effectiveTime * 0.5; // (effectiveTime / 2000ms 와 동일 비율)
    cube.rotation.y = effectiveTime * 1.0; // (effectiveTime / 1000ms 와 동일 비율)
  }

  if (controls.enabled) {
    controls.update();
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// 9. Responsive Resize Handling
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onResize);

// 10. Lifecycle Cleanup (SPA 전환 또는 모듈 언마운트 시 GPU 리소스 누수 방지)
export function dispose() {
  renderer.setAnimationLoop(null);
  window.removeEventListener('resize', onResize);
  gui.destroy();
  controls.dispose();
  geometry.dispose();
  material.dispose();
  renderer.dispose();
  if (renderer.domElement.parentElement) {
    renderer.domElement.parentElement.removeChild(renderer.domElement);
  }
}
