# 🛡️ WebGL 2 Compatibility Guard Architecture Guide

> **Mentor Note (Principal Engineer):**  
> "코드를 한 줄 작성할 때마다 항상 물어야 합니다: *'이 코드가 실패하는 최악의 환경에서 사용자는 무엇을 보게 되는가?'*  
> WebGL 2 호환성 검사는 단순한 if문이 아니라, **시스템의 신뢰성과 사용자 경험을 지키는 1차 방화벽(Guard Clause)**입니다."

---

## 1. 핵심 코드 및 작동 원리 (Anatomy of the Code)

### 공식 Three.js 패턴
```javascript
import WebGL from 'three/addons/capabilities/WebGL.js';

if ( WebGL.isWebGL2Available() ) {
  // WebGL 2가 지원될 때만 무거운 3D 초기화 및 렌더링 루프 실행
  animate();
} else {
  // 미지원 시 에러 DOM 엘리먼트를 생성하여 사용자에게 시각적 안내 제공
  const warning = WebGL.getWebGL2ErrorMessage();
  document.getElementById( 'container' ).appendChild( warning );
}
```

---

## 2. `WebGL.isWebGL2Available()` 내부 동작 심층 분석

Three.js 내부 소스코드(`three/addons/capabilities/WebGL.js`)는 다음과 같이 작성되어 있습니다:

```javascript
static isWebGL2Available() {
  try {
    const canvas = document.createElement( 'canvas' );
    return !! ( window.WebGL2RenderingContext && canvas.getContext( 'webgl2' ) );
  } catch ( e ) {
    return false;
  }
}
```

### 왜 이 두 가지 조건을 모두 검사하는가?
1. **`window.WebGL2RenderingContext` (소프트웨어/플랫폼 레이어 검사)**
   - 브라우저 자바스크립트 런타임에 WebGL 2 인터페이스 사양이 탑재되어 있는가?
2. **`canvas.getContext('webgl2')` (하드웨어/드라이버 레이어 검사)**
   - OS와 GPU 드라이버가 실제로 WebGL 2 컨텍스트를 할당(Allocate)하고 파이프라인을 열 수 있는가?

> 💡 **주니어가 흔히 하는 착각:**  
> *"최신 크롬 브라우저면 당연히 둘 다 true 아닌가요?"*  
> **아닙니다.** 브라우저가 최신 크롬이더라도 하드웨어 가속이 꺼져 있거나 GPU가 드라이버 블랙리스트에 올라가 있다면 `window.WebGL2RenderingContext`는 `true`이지만 `canvas.getContext('webgl2')`는 `null`을 반환합니다!

---

## 3. 이게 왜 중요한가? (Why This Matters)

### ① 침묵의 백화 현상 (White Screen of Death, WSOD) 방지
가드(Guard) 없이 `new THREE.WebGLRenderer()`를 즉시 호출하면, WebGL 2 컨텍스트 생성이 실패할 경우 `null` 참조 에러(`TypeError: Cannot read properties of null`)가 터지면서 **자바스크립트 메인 스레드가 정지**됩니다.  
결과적으로 사용자는 검은 화면이나 새하얀 화면만 보게 되며, 새로고침만 반복하다 사이트를 이탈(Bounce)합니다.

### ② 대역폭 및 자원 낭비 방지 (Fail-Fast 원칙)
프로덕션 3D 웹앱은 수십 MB의 GLTF/GLB 모델, 고해상도 KTX2/PNG 텍스처, 공간 음향 오디오 등을 다운로드합니다.  
화면을 그리지도 못하는 기기에서 50MB짜리 모델을 다운로드받게 만드는 것은 **사용자의 모바일 데이터와 배터리를 낭비하는 치명적인 설계 결함**입니다.

### ③ 2026년 현재에도 WebGL 2가 실패하는 5가지 실무 원인
| 원인 | 설명 |
| :--- | :--- |
| **인앱 웹뷰 (In-App Browsers)** | 카카오톡, 인스타그램, 틱톡 등의 앱 내 브라우저는 보안 및 메모리 절약을 위해 GPU 하드웨어 가속을 제한하는 경우가 많습니다. |
| **GPU 가속 비활성화** | 사용자가 발열, 배터리 절약, 팬 소음, 렉 방지를 위해 브라우저 설정에서 *'가능한 경우 하드웨어 가속 사용'*을 끈 경우. |
| **드라이버 블랙리스트** | 크롬/사파리는 특정 구형 GPU 드라이버(OS 충돌 또는 취약점 유발)를 자동으로 블랙리스트 처리하여 WebGL을 강제 차단합니다. |
| **가상화 환경 (VDI / RDP)** | 금융권/공공기관의 망분리 PC, Citrix, 원격 데스크톱 환경에서는 가상 그래픽 어댑터만 존재하여 WebGL 2가 지원되지 않습니다. |
| **최대 컨텍스트 초과** | 브라우저 탭 하나당 생성 가능한 WebGL 컨텍스트 수는 보통 8~16개로 제한됩니다. 다른 라이브러리나 탭이 슬롯을 소진하면 컨텍스트 생성이 거부됩니다. |

---

## 4. `WebGL.getWebGL2ErrorMessage()`의 똑똑한 분기 처리

Three.js 공식 에러 메시지 생성기는 단순한 문자열을 반환하지 않습니다:

```javascript
if ( contexts[ version ] ) {
  // 브라우저는 지원하지만 하드웨어(GPU)에서 실패한 경우:
  message = "Your graphics card does not seem to support WebGL 2";
} else {
  // 브라우저 자체가 WebGL 2를 지원하지 않는 경우:
  message = "Your browser does not seem to support WebGL 2";
}
```
원인이 **사용자의 그래픽 카드(하드웨어 가속)**인지, **브라우저 버전**인지 구분하여 사용자에게 정확한 해결 방향(링크 포함)을 안내합니다.

---

## 5. 엔터프라이즈 프로덕션 권장 패턴 (Best Practice)

실제 엔터프라이즈 프로덕션에서는 단순히 에러 메시지를 띄우는 것에서 나아가 다음과 같이 구성합니다:

```
[사용자 진입]
      │
      ▼
[Pre-flight Guard: WebGL.isWebGL2Available()]
      ├───────────────────────────────┐
      │ (PASS)                        │ (FAIL)
      ▼                               ▼
[Dynamic Import() 로 번들 로딩]   [1. Telemetry(Sentry) 에러 전송]
      │                               │
      ▼                               ▼
[3D 씬 부트스트랩 & 애니메이션]   [2. 2D Canvas / 정적 이미지 대체 포스터 표시]
                                      │
                                      ▼
                                  [3. 친절한 하드웨어 가속 가이드 노출]
```

1. **지연 로딩(Dynamic Import)**: 가드를 통과한 사용자에게만 Three.js 렌더링 번들을 다운로드하도록 코드 스플리팅 적용.
2. **원격 계측(Telemetry / Logging)**: Sentry 또는 Datadog에 GPU 드라이버 정보(`UNMASKED_RENDERER_WEBGL`)와 함께 미지원 이벤트 기록.
3. **Graceful Fallback UI**: 3D 대신 인터랙티브 2D 이미지 또는 동영상을 보여주어 비즈니스 전환율(Conversion Rate) 방어.
