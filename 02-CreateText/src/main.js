import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/Addons.js";

// scene
const scene = new THREE.Scene();

// camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 2, 9);


// light
const light = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 8, 5);
scene.add(directionalLight);

// webgl render
const render = new THREE.WebGLRenderer({ antialias: true });
render.setSize(window.innerWidth, window.innerHeight);
render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(render.domElement);

// constrols
const controls = new OrbitControls(camera, render.domElement);
controls.enableDamping = true;

// method1 : css renderer
const cssRenderer = new CSS2DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute'
cssRenderer.domElement.style.top = '0px'
cssRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(cssRenderer.domElement);

// const label = CSS2DObject();
const div = document.createElement('div');
div.className = 'label';
div.textContent = 'Method 2: CSS2D Earth';
div.style.color = '#38bdf8';
div.style.fontFamily = 'system-ui, sans-serif';
div.style.padding = '6px 12px';
div.style.background = 'rgba(15, 23, 42, 0.85)';
div.style.borderRadius = '16px';
div.style.border = '1px solid #38bdf8';
div.style.fontSize = '14px';
div.style.fontWeight = '600';
div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';

const label = new CSS2DObject(div);
label.position.set(-5.5, 1.8, 0);
scene.add(label);


function animate() {
  requestAnimationFrame(animate);
  render.render(scene, camera);
  cssRenderer.render(scene, camera)
}

animate();
