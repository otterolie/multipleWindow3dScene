import WindowManager from "./WindowManager.js";
import * as THREE from "three";

const camera = new THREE.OrthographicCamera(
  0,
  0,
  window.innerWidth,
  window.innerHeight,
  -10000,
  10000
);
let scene, renderer, world;
let cubes = [];
let sceneOffset = { x: 0, y: 0 };
let sceneOffsetTarget = { x: 0, y: 0 };
let windowManager;
let initialized = false;
const clock = new THREE.Clock();

function init() {
  initialized = true;
  setupScene();
  setupWindowManager();
  resize();
  updateWindowShape(false);
  render();
  window.addEventListener("resize", resize);
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0.0);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, depthBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  world = new THREE.Object3D();
  scene.add(world);

  renderer.domElement.id = "scene";
  document.body.appendChild(renderer.domElement);
}

function setupWindowManager() {
  windowManager = new WindowManager();
  windowManager.setWinShapeChangeCallback(updateWindowShape);
  windowManager.setWinChangeCallback(updateNumberOfCubes);

  windowManager.init({ foo: "bar" }); // Custom metadata
  updateNumberOfCubes(); // Initial update
}

function updateNumberOfCubes() {
  const wins = windowManager.getWindows();

  // Update cubes based on current window setup
  wins.forEach((win, i) => {
    if (i >= cubes.length) {
      const color = new THREE.Color().setHSL(i * 0.1, 1.0, 0.5);
      const size = 100 + i * 50;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({ color: color, wireframe: true })
      );
      world.add(cube);
      cubes.push(cube);
    }
    const cube = cubes[i];
    cube.position.x = win.shape.x + win.shape.w * 0.5;
    cube.position.y = win.shape.y + win.shape.h * 0.5;
  });

  // Remove extra cubes if any
  while (cubes.length > wins.length) {
    const cube = cubes.pop();
    world.remove(cube);
  }
}

function updateWindowShape(easing = true) {
  sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
  if (!easing) sceneOffset = sceneOffsetTarget;
}

function render() {
  windowManager.update();

  const deltaTime = clock.getDelta();
  const falloff = 0.05;
  sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
  sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;

  world.position.x = sceneOffset.x;
  world.position.y = sceneOffset.y;

  cubes.forEach((cube, i) => {
    const angle = deltaTime * (i + 1) * 0.5;
    cube.rotation.x += angle;
    cube.rotation.y += angle;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.left = 0;
  camera.right = width;
  camera.top = 0;
  camera.bottom = height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

if (new URLSearchParams(window.location.search).get("clear")) {
  localStorage.clear();
} else {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden" && !initialized) {
      init();
    }
  });

  window.onload = () => {
    if (document.visibilityState !== "hidden") {
      init();
    }
  };
}
