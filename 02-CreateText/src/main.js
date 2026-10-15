import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

/**
 * 1. Scene & Environment Setup
 */
function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827); // Dark slate background
  return scene;
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 9);
  return camera;
}

function createLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 8, 5);
  scene.add(directionalLight);

  return { ambientLight, directionalLight };
}

function createGridHelper(scene) {
  const gridHelper = new THREE.GridHelper(20, 20, 0x475569, 0x334155);
  gridHelper.position.y = -0.5;
  scene.add(gridHelper);
  return gridHelper;
}

/**
 * 2. Renderers & Controls Setup
 */
function createRenderers() {
  // WebGL Renderer for 3D graphics
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  // CSS2D Renderer for HTML labels in 3D space
  const cssRenderer = new CSS2DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.top = '0px';
  cssRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(cssRenderer.domElement);

  return { renderer, cssRenderer };
}

function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  return controls;
}

/**
 * 3. Text Creation Methods
 */

/**
 * Method 2: CSS2DRenderer (HTML DOM Label anchored to 3D coordinates)
 */
function createCSS2DText(scene) {
  // Create an HTML element styled via CSS
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

  // Wrap DOM element into CSS2DObject
  const label = new CSS2DObject(div);
  label.position.set(-5.5, 1.8, 0);
  scene.add(label);

  // Anchor sphere representing the object being labeled
  const sphereGeo = new THREE.SphereGeometry(0.6, 32, 32);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.4,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.set(-5.5, 0.6, 0);
  scene.add(sphere);

  return { label, sphere };
}

/**
 * Method 3: TextGeometry (Real 3D Extruded Mesh Text)
 */
function create3DText(scene, text = 'Method 3: 3D Text') {
  const fontLoader = new FontLoader();
  fontLoader.load('./fonts/helvetiker_regular.typeface.json', (font) => {
    const geometry = new TextGeometry(text, {
      font: font,
      size: 0.55,
      depth: 1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 5,
    });

    geometry.center();

    const material = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.2,
      metalness: 0.3,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.1, 0);
    scene.add(mesh);
  });
}

/**
 * Method 4: Canvas 2D Texture (Offscreen 2D Canvas mapped to a 3D Plane Mesh)
 */
function createCanvasText(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, 512, 256);

  // Background card on canvas
  ctx.fillStyle = '#1e293b';
  ctx.roundRect(10, 10, 492, 236, 20);
  ctx.fill();
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Text rendered via 2D Canvas API
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.textAlign = 'center';
  ctx.fillText('Method 4:', 256, 110);
  ctx.fillText('Canvas 2D Texture', 256, 160);

  // Convert canvas to Three.js Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), material);
  canvasMesh.position.set(5.5, 0.6, 0);
  scene.add(canvasMesh);

  return canvasMesh;
}

/**
 * 4. Events & Animation Loop
 */
function setupResize(camera, renderer, cssRenderer) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function startAnimation(renderer, cssRenderer, scene, camera, controls) {
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
  }
  animate();
}

/**
 * Main Initialization
 */
function init() {
  const scene = createScene();
  const camera = createCamera();
  createLights(scene);
  createGridHelper(scene);

  const { renderer, cssRenderer } = createRenderers();
  const controls = createControls(camera, renderer.domElement);

  // Add the 3 visual text methods into the 3D scene
  createCSS2DText(scene);
  create3DText(scene);
  createCanvasText(scene);

  // Setup resize listeners and start render loop
  setupResize(camera, renderer, cssRenderer);
  startAnimation(renderer, cssRenderer, scene, camera, controls);
}

init();
