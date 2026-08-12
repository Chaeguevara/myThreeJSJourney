# Three.js Text Creation Reference

Source: [Three.js Manual - Creating Text](https://threejs.org/manual/#en/creating-text)

---

## 1. DOM + CSS (Overlay Text)
The simplest and fastest method to add text overlays on top of a 3D canvas.

### HTML ([index.html](file:///Users/heejinchae/Documents/Dev/ThreejsMyJourney/02-CreateText/index.html))
```html
<div id="info">Description</div>
```

### CSS ([public/info.css](file:///Users/heejinchae/Documents/Dev/ThreejsMyJourney/02-CreateText/public/info.css))
```css
#info {
  position: absolute;
  top: 10px;
  width: 100%;
  text-align: center;
  z-index: 100;
  display: block;
}
```

---

## 2. CSS2DRenderer / CSS3DRenderer
Use `CSS2DRenderer` or `CSS3DRenderer` from `three/addons/renderers/CSS2DRenderer.js` to anchor HTML DOM elements to 3D positions in the scene space while maintaining high quality vector text.

```js
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Setup CSS2DRenderer alongside WebGLRenderer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

// Create label object
const div = document.createElement('div');
div.className = 'label';
div.textContent = 'Earth';
const label = new CSS2DObject(div);
label.position.set(0, 1, 0);
scene.add(label);
```

---

## 3. TextGeometry (3D Mesh Text)
Render 3D geometric text extrusions into the scene using `FontLoader` and `TextGeometry`.

```js
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const loader = new FontLoader();
loader.load('path/to/font.json', (font) => {
  const geometry = new TextGeometry('Hello Three.js', {
    font: font,
    size: 1,
    height: 0.2,
  });
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
});
```

---

## 4. Canvas 2D Texture (Texture Mapping)
Draw text onto an offscreen 2D HTML Canvas, convert it to a `THREE.CanvasTexture`, and apply it to a 3D plane or sprite.

```js
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = '48px sans-serif';
ctx.fillStyle = 'white';
ctx.fillText('Hello World', 10, 50);

const texture = new THREE.CanvasTexture(canvas);
const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), material);
scene.add(mesh);
```
