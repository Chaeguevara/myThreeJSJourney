import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * =====================================================================
 * Three.js Official Manual: Creating a Scene
 * https://threejs.org/manual/#creating-a-scene
 * =====================================================================
 */

// ---------------------------------------------------------------------
// 1. Scene (장면 생성)
// ---------------------------------------------------------------------
const scene = new THREE.Scene();

// ---------------------------------------------------------------------
// 2. Camera (원근 카메라 생성)
// PerspectiveCamera( fov, aspect, near, far )
// - fov: 화각(Field of View, 도 단위), 75도
// - aspect: 종횡비(가로/세로 비율)
// - near / far: 절두체(Clipping plane), 렌더링 범위 (0.1 ~ 1000)
// ---------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// 기본 위치(0, 0, 0)에서 큐브와 카메라가 겹치지 않도록 Z축으로 뒤로 이동
camera.position.z = 5;

// ---------------------------------------------------------------------
// 3. Renderer (렌더러 생성)
// WebGLRenderer는 WebGL을 사용하여 장면에 3D 그래픽을 그립니다.
// ---------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// HTML 문서 <body>에 생성된 <canvas> 엘리먼트를 추가
document.body.appendChild(renderer.domElement);

// ---------------------------------------------------------------------
// 4. Cube (정육면체 메쉬 생성)
// - BoxGeometry(width, height, depth): 정점(vertices)과 면(faces) 정의
// - MeshBasicMaterial({ color }): 조명 영향을 받지 않는 기본 단색 재질
// - Mesh: 형상(Geometry)과 재질(Material)을 결합하여 장면에 배치
// ---------------------------------------------------------------------
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// ---------------------------------------------------------------------
// Optional: OrbitControls (마우스 드래그로 시점 이동)
// ---------------------------------------------------------------------
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = false; // 기본값은 수동 제어 비활성화 (튜토리얼 원형 유지)

// ---------------------------------------------------------------------
// 5. Interactive State & Variables (학습용 인터랙티브 상태)
// ---------------------------------------------------------------------
const state = {
  isAnimating: true,
  speedMultiplier: 1.0,
  effectiveTime: 0,
  lastTimestamp: 0,
  isOrbitEnabled: false,
};

// ---------------------------------------------------------------------
// 6. Animation Loop (렌더링 루프)
// renderer.setAnimationLoop는 내부적으로 requestAnimationFrame을 사용합니다.
// 탭 비활성화 시 자동 중지되어 CPU/배터리를 절약합니다.
// ---------------------------------------------------------------------
function animate(time) {
  // 시간 증분 계산 (일시정지 및 속도 조절 지원)
  if (state.lastTimestamp === 0) {
    state.lastTimestamp = time;
  }
  const delta = time - state.lastTimestamp;
  state.lastTimestamp = time;

  if (state.isAnimating) {
    state.effectiveTime += delta * state.speedMultiplier;
  }

  // 공식 튜토리얼의 회전 공식:
  // cube.rotation.x = time / 2000;
  // cube.rotation.y = time / 1000;
  cube.rotation.x = state.effectiveTime / 2000;
  cube.rotation.y = state.effectiveTime / 1000;

  if (state.isOrbitEnabled) {
    controls.update();
  }

  // 장면을 카메라 시점에서 렌더링
  renderer.render(scene, camera);

  // HUD 실시간 데이터 갱신
  updateStats(time);
}

// 애니메이션 루프 시작
renderer.setAnimationLoop(animate);

// ---------------------------------------------------------------------
// 7. Window Resize Handling (반응형 뷰포트 대응)
// 창 크기가 변경될 때 카메라 종횡비와 렌더러 해상도를 갱신
// ---------------------------------------------------------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const elViewport = document.getElementById('stat-viewport');
  if (elViewport) {
    elViewport.textContent = `${window.innerWidth} × ${window.innerHeight}`;
  }
}
window.addEventListener('resize', onWindowResize);

// ---------------------------------------------------------------------
// 8. HUD & UI Interaction Logic
// ---------------------------------------------------------------------
const statTime = document.getElementById('stat-time');
const statRotX = document.getElementById('stat-rot-x');
const statRotY = document.getElementById('stat-rot-y');
const statViewport = document.getElementById('stat-viewport');
const valCamZ = document.getElementById('val-cam-z');

const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const camZSlider = document.getElementById('cam-z-slider');
const camZVal = document.getElementById('cam-z-val');
const colorPicker = document.getElementById('color-picker');

const toggleAnimBtn = document.getElementById('toggle-anim-btn');
const animIcon = document.getElementById('anim-icon');
const animText = document.getElementById('anim-text');
const toggleWireframeBtn = document.getElementById('toggle-wireframe-btn');
const toggleOrbitBtn = document.getElementById('toggle-orbit-btn');
const resetDefaultBtn = document.getElementById('reset-default-btn');

const hudContainer = document.getElementById('hud-container');
const togglePanelBtn = document.getElementById('toggle-panel-btn');
const showHudFloatingBtn = document.getElementById('show-hud-floating-btn');
const toggleCodeView = document.getElementById('toggle-code-view');
const codeSnippetBox = document.getElementById('code-snippet-box');

// 초기 뷰포트 상태 표시
if (statViewport) {
  statViewport.textContent = `${window.innerWidth} × ${window.innerHeight}`;
}

// 매 프레임 UI 업데이트
let frameCounter = 0;
function updateStats(time) {
  frameCounter++;
  // 매 3프레임마다 UI 업데이트 (DOM 조작 부하 방지)
  if (frameCounter % 3 !== 0) return;

  if (statTime) statTime.textContent = Math.floor(state.effectiveTime).toLocaleString();
  if (statRotX) statRotX.textContent = `${cube.rotation.x.toFixed(2)} rad`;
  if (statRotY) statRotY.textContent = `${cube.rotation.y.toFixed(2)} rad`;
  if (valCamZ) valCamZ.textContent = camera.position.z.toFixed(1);
}

// 속도 조절 슬라이더
if (speedSlider) {
  speedSlider.addEventListener('input', (e) => {
    state.speedMultiplier = parseFloat(e.target.value);
    if (speedVal) speedVal.textContent = `${state.speedMultiplier.toFixed(1)}x`;
  });
}

// 카메라 Z 거리 슬라이더
if (camZSlider) {
  camZSlider.addEventListener('input', (e) => {
    const z = parseFloat(e.target.value);
    camera.position.z = z;
    if (camZVal) camZVal.textContent = z.toFixed(1);
    if (valCamZ) valCamZ.textContent = z.toFixed(1);
  });
}

// 색상 변경 피커
if (colorPicker) {
  colorPicker.addEventListener('input', (e) => {
    material.color.set(e.target.value);
  });
}

// 애니메이션 재생/정지
function toggleAnimation() {
  state.isAnimating = !state.isAnimating;
  if (animIcon && animText) {
    if (state.isAnimating) {
      animIcon.textContent = '⏸';
      animText.textContent = '회전 일시정지';
      toggleAnimBtn.classList.remove('btn-secondary');
      toggleAnimBtn.classList.add('btn-primary');
    } else {
      animIcon.textContent = '▶';
      animText.textContent = '회전 다시시작';
      toggleAnimBtn.classList.remove('btn-primary');
      toggleAnimBtn.classList.add('btn-secondary');
    }
  }
}
if (toggleAnimBtn) {
  toggleAnimBtn.addEventListener('click', toggleAnimation);
}

// 와이어프레임 토글
function toggleWireframe() {
  material.wireframe = !material.wireframe;
  if (toggleWireframeBtn) {
    toggleWireframeBtn.classList.toggle('active', material.wireframe);
    toggleWireframeBtn.textContent = material.wireframe
      ? '와이어프레임 끄기 (솔리드)'
      : '와이어프레임 켜기';
  }
}
if (toggleWireframeBtn) {
  toggleWireframeBtn.addEventListener('click', toggleWireframe);
}

// 마우스 회전 제어 (OrbitControls) 토글
if (toggleOrbitBtn) {
  toggleOrbitBtn.addEventListener('click', () => {
    state.isOrbitEnabled = !state.isOrbitEnabled;
    controls.enabled = state.isOrbitEnabled;
    toggleOrbitBtn.classList.toggle('active', state.isOrbitEnabled);
    toggleOrbitBtn.textContent = state.isOrbitEnabled
      ? '마우스 드래그 끄기'
      : '마우스 드래그(Orbit) 활성화';
  });
}

// 기본값 복원
if (resetDefaultBtn) {
  resetDefaultBtn.addEventListener('click', () => {
    state.isAnimating = true;
    state.speedMultiplier = 1.0;
    if (speedSlider) speedSlider.value = '1.0';
    if (speedVal) speedVal.textContent = '1.0x';

    camera.position.set(0, 0, 5);
    camera.rotation.set(0, 0, 0);
    if (camZSlider) camZSlider.value = '5.0';
    if (camZVal) camZVal.textContent = '5.0';
    if (valCamZ) valCamZ.textContent = '5.0';

    material.color.setHex(0x00ff00);
    if (colorPicker) colorPicker.value = '#00ff00';

    material.wireframe = false;
    if (toggleWireframeBtn) {
      toggleWireframeBtn.classList.remove('active');
      toggleWireframeBtn.textContent = '와이어프레임 켜기';
    }

    state.isOrbitEnabled = false;
    controls.enabled = false;
    controls.reset();
    if (toggleOrbitBtn) {
      toggleOrbitBtn.classList.remove('active');
      toggleOrbitBtn.textContent = '마우스 드래그(Orbit) 활성화';
    }

    if (animIcon && animText) {
      animIcon.textContent = '⏸';
      animText.textContent = '회전 일시정지';
      toggleAnimBtn.classList.add('btn-primary');
      toggleAnimBtn.classList.remove('btn-secondary');
    }
  });
}

// 패널 접기/펼치기
if (togglePanelBtn && hudContainer) {
  togglePanelBtn.addEventListener('click', () => {
    hudContainer.classList.toggle('minimized');
    const isMinimized = hudContainer.classList.contains('minimized');
    togglePanelBtn.querySelector('svg').style.transform = isMinimized
      ? 'rotate(180deg)'
      : 'rotate(0deg)';
  });
}

// HUD 완전 숨기기 / 보이기
function toggleHudVisibility() {
  if (!hudContainer) return;
  const isHidden = hudContainer.classList.toggle('hidden');
  if (showHudFloatingBtn) {
    showHudFloatingBtn.classList.toggle('hidden', !isHidden);
  }
}
if (showHudFloatingBtn) {
  showHudFloatingBtn.addEventListener('click', toggleHudVisibility);
}

// 코드 스니펫 아코디언 토글
if (toggleCodeView && codeSnippetBox) {
  toggleCodeView.addEventListener('click', () => {
    codeSnippetBox.classList.toggle('collapsed');
    toggleCodeView.classList.toggle('open');
  });
}

// 키보드 단축키
window.addEventListener('keydown', (e) => {
  // input/textarea 등에 포커스되어 있는 경우 무시
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    toggleAnimation();
  } else if (e.key === 'h' || e.key === 'H' || e.key === 'ㅗ') {
    toggleHudVisibility();
  } else if (e.key === 'w' || e.key === 'W' || e.key === 'ㅈ') {
    toggleWireframe();
  }
});
