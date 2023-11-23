import WindowManager from "./WindowManager.js";

const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let tori = []; // renamed from 'cubes' to 'tori'
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

function getTime() {
  return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get("clear")) {
  localStorage.clear();
} else {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState != "hidden" && !initialized) {
      init();
    }
  });

  window.onload = () => {
    if (document.visibilityState != "hidden") {
      init();
    }
  };

  function init() {
    initialized = true;
    setTimeout(() => {
      setupScene();
      setupWindowManager();
      resize();
      updateWindowShape(false);
      render();
      window.addEventListener("resize", resize);
    }, 500);
  }

  function setupScene() {
    camera = new t.OrthographicCamera(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      -10000,
      10000
    );

    camera.position.z = 2.5;
    near = camera.position.z - 0.5;
    far = camera.position.z + 0.5;

    scene = new t.Scene();
    scene.background = new t.Color(0.0);
    scene.add(camera);

    renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
    renderer.setPixelRatio(pixR);

    world = new t.Object3D();
    scene.add(world);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
  }

  function setupWindowManager() {
    windowManager = new WindowManager();
    windowManager.setWinShapeChangeCallback(updateWindowShape);
    windowManager.setWinChangeCallback(windowsUpdated);

    let metaData = { foo: "bar" };
    windowManager.init(metaData);

    windowsUpdated();
  }

  function windowsUpdated() {
    updateNumberOfTori(); // renamed from updateNumberOfCubes
  }

  function updateNumberOfTori() {
    let wins = windowManager.getWindows();

    tori.forEach((c) => {
      world.remove(c);
    });

    tori = [];

    for (let i = 0; i < wins.length; i++) {
      let win = wins[i];

      let c = new t.Color();
      c.setHSL(i * 0.1, 1.0, 0.5);

      let s = 50 + i * 25;
      let torus = new t.Mesh(
        new t.TorusGeometry(s, s / 4, 16, 100),
        new t.MeshBasicMaterial({ color: c, wireframe: true })
      );
      torus.position.x = win.shape.x + win.shape.w * 0.5;
      torus.position.y = win.shape.y + win.shape.h * 0.5;

      world.add(torus);
      tori.push(torus);
    }
  }

  function updateWindowShape(easing = true) {
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
  }

  function render() {
    let t = getTime();

    windowManager.update();

    // Calculate the new position based on the offset delta times a falloff value for smooth effect
    let falloff = 0.05;
    sceneOffset.x =
      sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y =
      sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    // Set the world position to the offset
    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();

    // Loop through all tori and update their positions and rotations based on current window positions
    for (let i = 0; i < tori.length; i++) {
      let torus = tori[i];
      let win = wins[i];

      let posTarget = {
        x: win.shape.x + win.shape.w * 0.5,
        y: win.shape.y + win.shape.h * 0.5,
      };

      torus.position.x =
        torus.position.x + (posTarget.x - torus.position.x) * falloff;
      torus.position.y =
        torus.position.y + (posTarget.y - torus.position.y) * falloff;

      // Adjust rotation logic for tori
      torus.rotation.x = t * 0.8; // Adjust rotation speed and axis as needed
      torus.rotation.y = t * 0.8;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}
