import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

let scene, camera, renderer, controls, cube, clock;

function addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 7)
    scene.add(directionalLight);
}

function addObjects() {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        roughness: 0.3,
        metalness: 0.2
    })

    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    gridHelper.position.y = -1;
    scene.add(gridHelper);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    // Get the time passed since the last frame
    const deltaTime = clock.getDelta();
    clock.update()

    // Frame-rate independent rotation animation
    if (cube) {
        cube.rotation.x += 0.5 * deltaTime;
        cube.rotation.y += 0.8 * deltaTime;
    }

    // Required to update camera position smoothly if damping is enabled
    controls.update();

    // Render the updated scene from the camera's perspective
    renderer.render(scene, camera);
}

function init() {
    console.log('hi');
    const container = document.getElementById("app");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    clock = new THREE.Timer();
    clock.connect(document);

    addLights();
    addObjects();

    window.addEventListener('resize', onWindowResize)

    renderer.setAnimationLoop(animate)
}

init();