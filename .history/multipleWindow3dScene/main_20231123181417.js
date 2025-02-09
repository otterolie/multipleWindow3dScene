import WindowManager from "./WindowManager.js";

const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
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

const geometries = [
  new t.BoxGeometry(200, 200, 200),
  new t.SphereGeometry(200, 200, 200),
  new t.ConeGeometry(200, 200, 200),
  new t.TorusGeometry(200, 200, 200),
  new t.CylinderGeometry(200, 200, 200),
];

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
      window.innerWidth,
      0,
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
    renderer.shadowMap.enabled = true;

    world = new t.Object3D();
    scene.add(world);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);

    renderer.domElement.addEventListener("click", function (event) {
      cubes.forEach((cube) => {
        let color = new t.Color(Math.random(), Math.random(), Math.random());
        cube.material.color = color;
      });
    });
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
    updateNumberOfCubes();
  }

  function updateNumberOfCubes() {
    let wins = windowManager.getWindows();
    cubes.forEach((c) => world.remove(c));
    cubes = [];

    for (let i = 0; i < wins.length; i++) {
      let win = wins[i];

      let c = new t.Color();
      c.setHSL(i * 0.1, 1.0, 0.5);

      let geometry = geometries[i % geometries.length];
      let cube = new t.Mesh(
        geometry,
        new t.MeshBasicMaterial({ color: c, wireframe: true })
      );
      cube.castShadow = true;
      cube.receiveShadow = true;

      cube.position.x = win.shape.x + win.shape.w * 0.5;
      cube.position.y = win.shape.y + win.shape.h * 0.5;

      world.add(cube);
      cubes.push(cube);
    }
  }

  function updateWindowShape(easing = true) {
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
  }

  function render() {
    let t = getTime();
    windowManager.update();
    updateBackgroundColor();
    animateShapes();

    let falloff = 0.05;
    sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();
    for (let i = 0; i < cubes.length; i++) {
      let cube = cubes[i];
      let win = wins[i];
      let _t = t;

      let posTarget = {
        x: win.shape.x + win.shape.w * 0.5,
        y: win.shape.y + win.shape.h * 0.5,
      };

      cube.position.x += (posTarget.x - cube.position.x) * falloff;
      cube.position.y += (posTarget.y - cube.position.y) * falloff;
      cube.rotation.x = _t * 0.5;
      cube.rotation.y = _t * 0.3;
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

  function updateBackgroundColor() {
    const hue = (getTime() % 360) / 360;
    scene.background.setHSL(hue, 0.6, 0.7);
  }

  function animateShapes() {
    cubes.forEach((cube, index) => {
      cube.geometry.dispose();
      let geometry =
        geometries[(Math.floor(getTime()) + index) % geometries.length];
      cube.geometry = geometry;
    });
  }
}
