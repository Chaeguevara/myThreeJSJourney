import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'lil-gui';

/**
 * =====================================================================
 * Three.js Animation System Architecture
 * 
 * 4 Core Abstractions (Mental Model):
 * 1. AnimationClip   : 불변의 순수 데이터 (트랙, 키프레임, 타임스탬프)
 * 2. AnimationMixer  : 특정 3D 객체에 바인딩된 재생 엔진 (런타임 평가기)
 * 3. AnimationAction : 개별 클립의 재생 제어기 (play, fade, loop, weight)
 * 4. Delta Update    : 렌더 루프에서 시간 전진 (mixer.update(delta))
 * =====================================================================
 */

// 1. Scene & Lighting Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0e14');
scene.fog = new THREE.Fog('#0b0e14', 10, 30);

// 2. Camera & Renderer
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2.5, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 3. OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.0, 0); // 모델 가슴/허리 높이 주시
controls.maxPolarAngle = Math.PI / 2 - 0.05; // 바닥 밑으로 카메라 내려가지 않도록 제한

// 4. Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
dirLight.position.set(5, 8, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

// 5. Ground Floor & Shadow Receiver
const floorGeo = new THREE.PlaneGeometry(30, 30);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x141822,
  roughness: 0.8,
  metalness: 0.2,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const gridHelper = new THREE.GridHelper(30, 30, 0x00d2ff, 0x222a38);
gridHelper.position.y = 0.001;
scene.add(gridHelper);

// 6. Animation System State
let mixer = null;
const actions = {};
let activeAction = null;
let skeletonHelper = null;

// UI & Control Parameters
const animParams = {
  currentAction: 'Idle',
  crossFadeDuration: 0.4,
  timeScale: 1.0,
  paused: false,
  showSkeleton: false,
  wireframe: false,
};

// 7. Load GLTF Model & Initialize Animation System
const loader = new GLTFLoader();

loader.load(
  '/models/Soldier.glb',
  (gltf) => {
    const model = gltf.scene;

    // 그림자 설정 & 메쉬 최적화
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(model);

    // ==============================================================
    // [핵심] Three.js 애니메이션 시스템 초기화 파이프라인
    // ==============================================================
    // (1) Mixer 생성: 모델 루트 노드를 타겟으로 바인딩
    mixer = new THREE.AnimationMixer(model);

    // (2) AnimationClip 리스트 순회 & 각 클립별 AnimationAction 등록
    gltf.animations.forEach((clip) => {
      // clipAction은 특정 클립에 대한 제어 핸들(AnimationAction)을 생성/반환
      const action = mixer.clipAction(clip);
      actions[clip.name] = action;
    });

    // (3) 기본 액션 활성화 (Idle 상태로 시작)
    activeAction = actions['Idle'];
    activeAction.play();

    // 8. 스켈레톤(본 구조) 시각화 헬퍼 (본이 실제로 움직이는 원리 시각화)
    skeletonHelper = new THREE.SkeletonHelper(model);
    skeletonHelper.visible = animParams.showSkeleton;
    scene.add(skeletonHelper);

    // 9. lil-gui 빌드
    setupGUI(model, gltf.animations.map((c) => c.name));

    // 로딩 화면 숨김
    const loadingElem = document.getElementById('loading-overlay');
    if (loadingElem) {
      loadingElem.classList.add('hidden');
      setTimeout(() => loadingElem.remove(), 500);
    }
  },
  undefined,
  (error) => {
    console.error('Failed to load model:', error);
  }
);

/**
 * ==============================================================
 * [핵심 패턴] 크로스페이드(Cross-Fade) 전환 함수
 * 이전 액션을 점진적으로 페이드아웃(weight 1->0)하고
 * 다음 액션을 점진적으로 페이드인(weight 0->1)하여 자연스럽게 블렌딩
 * ==============================================================
 */
function switchAnimation(newActionName) {
  const newAction = actions[newActionName];
  if (!newAction || newAction === activeAction) return;

  const duration = animParams.crossFadeDuration;

  // 새 액션을 처음 시간부터 재생 준비
  newAction.reset();
  newAction.setEffectiveTimeScale(animParams.timeScale);
  newAction.setEffectiveWeight(1.0);
  newAction.crossFadeFrom(activeAction, duration, true);
  newAction.play();

  activeAction = newAction;
  animParams.currentAction = newActionName;
}

// 10. lil-gui 설정
function setupGUI(model, clipNames) {
  const gui = new GUI({ title: 'Animation Controller' });

  // 1) Animation Selection & Blending
  const animFolder = gui.addFolder('Clips & State');
  animFolder
    .add(animParams, 'currentAction', clipNames)
    .name('Active Clip')
    .onChange((name) => switchAnimation(name))
    .listen();

  animFolder
    .add(animParams, 'crossFadeDuration', 0.0, 1.5, 0.05)
    .name('Crossfade (s)');

  animFolder
    .add(animParams, 'timeScale', -2.0, 3.0, 0.1)
    .name('Playback Speed')
    .onChange((speed) => {
      if (mixer) mixer.timeScale = speed;
    });

  animFolder
    .add(animParams, 'paused')
    .name('Pause')
    .onChange((isPaused) => {
      if (activeAction) activeAction.paused = isPaused;
    });

  // 2) Visual Debug Helpers
  const debugFolder = gui.addFolder('Debug & Bones');
  debugFolder
    .add(animParams, 'showSkeleton')
    .name('Show Bones (Rig)')
    .onChange((val) => {
      if (skeletonHelper) skeletonHelper.visible = val;
    });

  debugFolder
    .add(animParams, 'wireframe')
    .name('Wireframe')
    .onChange((val) => {
      model.traverse((child) => {
        if (child.isMesh) child.material.wireframe = val;
      });
    });

  // 3) Camera Reset
  gui.add({
    resetCamera: () => {
      camera.position.set(0, 2.5, 5);
      controls.target.set(0, 1.0, 0);
      controls.update();
    }
  }, 'resetCamera').name('Reset Camera');
}

// 11. Responsive Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 12. Render & Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // [핵심] 믹서 업데이트: 매 프레임 경과 시간(delta)만큼 타임라인 전진 및 뼈대/메쉬 갱신
  if (mixer) {
    mixer.update(delta);
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
