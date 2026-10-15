import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import GUI from 'lil-gui';

/**
 * =========================================================================================
 * [Principal Engineer's Guide to WebGL Capability & Pre-flight Validation]
 * =========================================================================================
 * 
 * "주니어 개발자 시절에는 'Three.js 코드가 내 맥북/PC에서 잘 돌아가니까 배포해도 되겠지'라고 생각하기 쉽습니다.
 *  하지만 프로덕션 환경은 정글입니다. 사용자의 기기는 저가형 안드로이드, 사내 가상화(VDI/RDP),
 *  하드웨어 가속이 꺼진 크롬, 혹은 카카오톡/인스타그램의 인앱 웹뷰(In-App Browser)일 수 있습니다.
 * 
 *  이 파일은 단순한 if/else 예제가 아닙니다:
 *  1. 왜 WebGL 사전 검증(Pre-flight Check)이 필수적인지
 *  2. WebGL.isWebGL2Available() 내부에서 실제로 어떤 검증이 일어나는지
 *  3. 실패 시 '침묵의 백화 현상(White Screen of Death)'을 막고 어떻게 우아하게 격하(Graceful Degradation)하는지
 *  를 프로덕션 레벨의 아키텍처로 구현합니다."
 * =========================================================================================
 */

// DOM 컨테이너 참조 (Three.js 렌더러 또는 Fallback 배너가 장착될 마운트 지점)
const container = document.getElementById('container');

// UI 진단 패널 DOM 참조
const diagStatusDot = document.getElementById('status-dot');
const diagWebGL2 = document.getElementById('diag-webgl2');
const diagGPU = document.getElementById('diag-gpu');
const diagGuard = document.getElementById('diag-guard');

/**
 * -----------------------------------------------------------------------------------------
 * 1. Hardware & Context Probe (하드웨어 및 드라이버 정보 진단 유틸리티)
 * -----------------------------------------------------------------------------------------
 * WebGL.isWebGL2Available()이 true일 때, 실제 GPU 벤더와 드라이버 렌더러 이름을 추출합니다.
 * 디버깅, 모니터링(Sentry/Datadog), 성능 티어링(LOD 결정)의 핵심 데이터입니다.
 */
function getGPUHardwareInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { vendor: 'Unknown', renderer: 'Context creation failed' };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown Vendor',
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Generic GPU',
      };
    }
    return {
      vendor: gl.getParameter(gl.VENDOR) || 'Standard Vendor',
      renderer: gl.getParameter(gl.RENDERER) || 'Standard Renderer',
    };
  } catch (err) {
    return { vendor: 'Error', renderer: err.message };
  }
}

/**
 * -----------------------------------------------------------------------------------------
 * 2. Pre-flight Guard Clause (사전 기능 검증 가드)
 * -----------------------------------------------------------------------------------------
 * [Principal's Core Advice]:
 * "가장 나쁜 버그는 '아무것도 모른 채 터지는 버그'입니다.
 *  WebGL2를 지원하지 않는 환경에서 new THREE.WebGLRenderer()를 호출하면
 *  WebGL 컨텍스트 획득에 실패하여 TypeError가 발생하고, JS 메인 스레드가 정지됩니다.
 *  무거운 3D 모델(GLTF), 오디오, 텍스처를 다운로드하기 '전에' 무조건 가드를 통과해야 합니다."
 */
function checkWebGLSupport() {
  // Three.js 내부 WebGL.isWebGL2Available()의 실제 구현:
  // try {
  //   const canvas = document.createElement('canvas');
  //   return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  // } catch (e) {
  //   return false;
  // }
  return WebGL.isWebGL2Available();
}

/**
 * -----------------------------------------------------------------------------------------
 * 3. Graceful Fallback Handler (우아한 실패 처리 & 대체 UI)
 * -----------------------------------------------------------------------------------------
 * WebGL 2를 사용할 수 없는 경우 호출되는 핸들러입니다.
 * Three.js 공식 제공 에러 메시지(getWebGL2ErrorMessage())를 렌더링하고,
 * 프로덕션 수준의 친절한 가이드(하드웨어 가속 설정 확인 등)를 사용자에게 제공합니다.
 */
function handleUnsupportedWebGL(targetContainer) {
  console.warn('[WebGL Guard] WebGL 2 is NOT available on this device/browser.');

  // UI 진단 패널 업데이트 (Error State)
  if (diagStatusDot) diagStatusDot.classList.add('error');
  if (diagWebGL2) {
    diagWebGL2.textContent = 'UNSUPPORTED (Fail)';
    diagWebGL2.className = 'diag-value text-error';
  }
  if (diagGPU) diagGPU.textContent = 'GPU Hardware Accelerated Disabled or Blacklisted';
  if (diagGuard) {
    diagGuard.textContent = 'BLOCKED (Graceful Fallback)';
    diagGuard.className = 'diag-value text-error';
  }

  // 1. Three.js 기본 제공 공식 에러 엘리먼트 생성
  const warning = WebGL.getWebGL2ErrorMessage();

  // 2. 프로덕션 UX 강화를 위한 추가 조치 가이드 부착
  const troubleshootGuide = document.createElement('div');
  troubleshootGuide.className = 'fallback-troubleshoot';
  troubleshootGuide.innerHTML = `
    <strong>💡 문제 해결 팁:</strong>
    <ul>
      <li>브라우저 설정에서 <em>'가능한 경우 하드웨어 가속 사용'</em>이 켜져 있는지 확인하세요.</li>
      <li>크롬 주소창에 <code>chrome://gpu</code>를 입력하여 GPU 블랙리스트 여부를 확인하세요.</li>
      <li>최신 버전의 브라우저(Chrome, Safari, Edge, Firefox)로 업데이트하세요.</li>
    </ul>
  `;
  warning.appendChild(troubleshootGuide);

  // 3. 컨테이너에 안전하게 마운트
  targetContainer.innerHTML = '';
  targetContainer.appendChild(warning);
}

/**
 * -----------------------------------------------------------------------------------------
 * 4. 3D Application Bootstrap (Three.js 씬 초기화 및 렌더링 루프)
 * -----------------------------------------------------------------------------------------
 * Pre-flight Check를 안전하게 통과한 경우에만 실행되는 비즈니스 로직입니다.
 */
let appInstance = null;

function start3DApplication(targetContainer) {
  console.info('[WebGL Guard] WebGL 2 capability verified. Initializing 3D engine...');

  // 진단 정보 업데이트 (Success State)
  const gpuInfo = getGPUHardwareInfo();
  if (diagStatusDot) diagStatusDot.classList.remove('error');
  if (diagWebGL2) {
    diagWebGL2.textContent = 'AVAILABLE (Active)';
    diagWebGL2.className = 'diag-value text-accent';
  }
  if (diagGPU) diagGPU.textContent = gpuInfo.renderer;
  if (diagGuard) {
    diagGuard.textContent = 'PASSED (Execution Authorized)';
    diagGuard.className = 'diag-value text-accent';
  }

  targetContainer.innerHTML = '';

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0f14);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.5, 4);

  // Renderer (WebGL2 기반)
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  targetContainer.appendChild(renderer.domElement);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Geometry & Material (Aesthetic Torus Knot)
  const geometry = new THREE.TorusKnotGeometry(1, 0.35, 128, 32);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x00ff88,
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    wireframe: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0x00e1ff, 2.5);
  keyLight.position.set(5, 5, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xff0077, 2.0);
  fillLight.position.set(-5, -3, -2);
  scene.add(fillLight);

  // Animation Loop
  let isRunning = true;
  const clock = new THREE.Clock();

  function animate() {
    if (!isRunning) return;
    const elapsedTime = clock.getElapsedTime();

    mesh.rotation.x = elapsedTime * 0.3;
    mesh.rotation.y = elapsedTime * 0.5;

    controls.update();
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);

  // Window Resize
  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  window.addEventListener('resize', handleResize);

  // Cleanup Function (인스턴스 파괴 및 GPU 메모리 해제)
  function destroy() {
    isRunning = false;
    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', handleResize);
    controls.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  }

  return { scene, material, destroy };
}

/**
 * -----------------------------------------------------------------------------------------
 * 5. Interactive Mentor Sandbox (시뮬레이션 및 교육용 GUI)
 * -----------------------------------------------------------------------------------------
 * "주니어에게 개념을 가르칠 때 최고의 방법은 '실패 상황을 직접 재현'해보는 것입니다.
 *  아래 컨트롤러를 통해 WebGL 2 미지원 상황을 인위적으로 시뮬레이션할 수 있습니다."
 */
const mentorState = {
  simulateUnsupported: false,
  wireframe: false,
  toggleSimulation() {
    if (mentorState.simulateUnsupported) {
      // 강제 실패 모드 시뮬레이션
      if (appInstance) {
        appInstance.destroy();
        appInstance = null;
      }
      handleUnsupportedWebGL(container);
    } else {
      // 정상 검증 모드로 복귀
      if (checkWebGLSupport()) {
        appInstance = start3DApplication(container);
      } else {
        handleUnsupportedWebGL(container);
      }
    }
  },
};

const gui = new GUI({ title: 'Mentor Diagnostic Controls' });
const simFolder = gui.addFolder('🧪 Pre-flight Failure Simulation');

simFolder
  .add(mentorState, 'simulateUnsupported')
  .name('WebGL 2 미지원 강제 시뮬레이션')
  .onChange(() => {
    mentorState.toggleSimulation();
  });

const viewFolder = gui.addFolder('Scene Appearance');
viewFolder
  .add(mentorState, 'wireframe')
  .name('와이어프레임 토글')
  .onChange((v) => {
    if (appInstance && appInstance.material) {
      appInstance.material.wireframe = v;
    }
  });

/**
 * -----------------------------------------------------------------------------------------
 * 6. Main Entry Point (실제 애플리케이션 시작 지점)
 * -----------------------------------------------------------------------------------------
 * 질문 주신 핵심 패턴:
 * if ( WebGL.isWebGL2Available() ) {
 *   animate();
 * } else {
 *   const warning = WebGL.getWebGL2ErrorMessage();
 *   container.appendChild( warning );
 * }
 */
function main() {
  if (checkWebGLSupport()) {
    // 1단계: 가드 통과 -> 3D 애플리케이션 시작
    appInstance = start3DApplication(container);
  } else {
    // 2단계: 가드 탈락 -> 침묵의 크래시 대신 우아한 대체 UI 표시
    handleUnsupportedWebGL(container);
  }
}

// 부트스트랩 실행
main();
