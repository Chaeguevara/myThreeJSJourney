# Three.js Creating a Scene Reference

Source: [Three.js Manual - Creating a Scene](https://threejs.org/manual/#creating-a-scene)

---

## 1. 개요 (Overview)

Three.js를 사용하여 브라우저 화면에 3D 그래픽을 렌더링하기 위해서는 기본적으로 세 가지 핵심 구성 요소가 필요합니다:
1. **Scene (장면)**: 객체, 조명, 카메라를 담는 가상 3D 공간
2. **Camera (카메라)**: 장면을 어떤 위치와 각도, 화각으로 바라볼 것인지 정의
3. **Renderer (렌더러)**: Scene과 Camera를 전달받아 HTML `<canvas>` 엘리먼트에 실제로 그리는 엔진

---

## 2. 기본 구성 요소 상세

### ① Scene (장면)
```javascript
import * as THREE from 'three';

const scene = new THREE.Scene();
```
- 모든 3D 객체의 최상위 컨테이너 역할을 합니다.
- `scene.add(object)`를 통해 메쉬, 조명, 그룹 등을 장면에 배치합니다.

### ② PerspectiveCamera (원근 투영 카메라)
```javascript
const fov = 75; // 화각 (Field of View, 도 단위)
const aspect = window.innerWidth / window.innerHeight; // 종횡비 (가로 / 세로)
const near = 0.1; // 전방 절두체 클리핑 평면
const far = 1000; // 후방 절두체 클리핑 평면

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;
```
- **FOV (시야각)**: 화면에 한 번에 표시되는 시야 범위(도 단위)입니다.
- **Aspect (종횡비)**: 요소의 너비를 높이로 나눈 값입니다. 왜곡 없이 출력하기 위해 뷰포트 비율과 일치시킵니다.
- **Near / Far (절두체 평면)**: `near`보다 가깝거나 `far`보다 먼 물체는 렌더링에서 제외됩니다.
- **카메라 위치**: 기본값은 `(0, 0, 0)`입니다. 생성한 물체도 `(0, 0, 0)`에 생성되므로 서로 겹치지 않게 카메라를 Z축으로 뒤로 이동(`camera.position.z = 5`)시킵니다.

### ③ WebGLRenderer (웹GL 렌더러)
```javascript
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
```
- WebGL을 사용해 화면을 그리는 렌더러입니다.
- `setSize(width, height)`로 렌더링 해상도를 지정합니다.
- `renderer.domElement`는 렌더러가 생성한 `<canvas>` 엘리먼트이며, 이를 DOM(`document.body`)에 마운트합니다.

---

## 3. 메쉬(Mesh) 생성: 형상(Geometry) + 재질(Material)

3D 객체는 기하학적 형태를 정의하는 **Geometry**와 표면 모양/색상을 정의하는 **Material**의 결합체인 **Mesh**로 생성됩니다.

```javascript
// 1. 가로, 세로, 깊이가 1인 정육면체 지오메트리
const geometry = new THREE.BoxGeometry(1, 1, 1);

// 2. 조명 계산 없이 고유 색상만 출력하는 기본 재질 (녹색)
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// 3. 지오메트리와 머티리얼을 결합하여 메쉬 생성
const cube = new THREE.Mesh(geometry, material);

// 4. 장면에 메쉬 추가
scene.add(cube);
```

---

## 4. 애니메이션 루프 (Animation Loop)

화면을 지속적으로 다시 그려야 3D 객체의 움직임이 부드럽게 표현됩니다.

```javascript
function animate(time) {
  // 프레임마다 큐브를 지속 회전 (time은 밀리초 단위 타임스탬프)
  cube.rotation.x = time / 2000;
  cube.rotation.y = time / 1000;

  // 장면을 카메라 시점에서 렌더링
  renderer.render(scene, camera);
}

// Three.js 권장 렌더링 루프 (내부적으로 requestAnimationFrame 사용)
renderer.setAnimationLoop(animate);
```

> **왜 `setInterval` 대신 `setAnimationLoop` / `requestAnimationFrame`을 사용하는가?**  
> 사용자가 다른 브라우저 탭으로 이동했을 때 자동으로 실행이 일시 중지되어 불필요한 GPU/CPU 연산 및 배터리 소모를 방지하며, 디스플레이의 화면 주사율(일반적으로 60Hz~144Hz)에 맞춰 가장 부드러운 타이밍에 화면을 갱신합니다.

---

## 5. 실무 필수: 반응형 리사이즈 대응

브라우저 창 크기가 조절될 때 3D 장면의 비율 왜곡을 방지하고 해상도를 맞추기 위해 resize 이벤트를 처리합니다.

```javascript
window.addEventListener('resize', () => {
  // 1. 카메라의 종횡비 갱신
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // 2. 렌더러의 크기 갱신
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## 6. 전체 최소 코드 (Minimal Standalone Code)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>My first three.js app</title>
    <style>
      body { margin: 0; overflow: hidden; }
      canvas { display: block; }
    </style>
  </head>
  <body>
    <script type="module">
      import * as THREE from 'three';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      function animate(time) {
        cube.rotation.x = time / 2000;
        cube.rotation.y = time / 1000;
        renderer.render(scene, camera);
      }
      renderer.setAnimationLoop(animate);

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    </script>
  </body>
</html>
```
