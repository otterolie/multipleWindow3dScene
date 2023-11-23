import WindowManager from "./WindowManager.js";

const t = THREE;
let camera, scene, renderer;
let torus;

// Function to get time in seconds since the beginning of the day
function getTime() {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  return (new Date().getTime() - today.getTime()) / 1000.0;
}

// Function to set up the scene
function setupScene() {
  camera = new t.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  scene = new t.Scene();
  scene.background = new t.Color(0x000000); // Black background

  renderer = new t.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

// Function to create a torus with a random color
function createTorus() {
  let geometry = new t.TorusGeometry(1, 0.4, 16, 100);
  let material = new t.MeshBasicMaterial({
    color: new t.Color(Math.random(), Math.random(), Math.random()),
    wireframe: true,
  });
  torus = new t.Mesh(geometry, material);
  scene.add(torus);
}

// Animation loop function
function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.01;

  renderer.render(scene, camera);
}

// Function to handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialization function
function init() {
  setupScene();
  createTorus();
  animate();
}

window.addEventListener("resize", onWindowResize, false);
init();
