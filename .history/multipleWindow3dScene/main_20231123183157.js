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

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime() {
  return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get("clear")) {
  localStorage.clear();
} else {
  // this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
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

    // add a short timeout because window.offsetX reports wrong values before a short period
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
    scene.background = new t.Color(0x000000);
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

    // here you can add your custom metadata to each windows instance
    let metaData = { foo: "bar" };

    // this will init the windowmanager and add this window to the centralised pool of windows
    windowManager.init(metaData);

    // call update windows initially (it will later be called by the win change callback)
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

      // Create a random color
      let c = new t.Color(Math.random(), Math.random(), Math.random());

      // Create a torus geometry
      let torus = new t.Mesh(
        new t.TorusGeometry(50, 20, 16, 100), // You can adjust these parameters
        new t.MeshBasicMaterial({ color: c, wireframe: true })
      );
      torus.position.x = win.shape.x + win.shape.w * 0.5;
      torus.position.y = win.shape.y + win.shape.h * 0.5;

      world.add(torus);
      cubes.push(torus);
    }
  }

  function updateWindowShape(easing = true) {
    // storing the actual offset in a proxy that we update against in the render function
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
  }

  function render() {
    let t = getTime();

    windowManager.update();

    // calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
    let falloff = 0.05;
    sceneOffset.x =
      sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y =
      sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    // set the world position to the offset
    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();

    // loop through all our cubes and update their positions based on current window positions
    for (let i = 0; i < cubes.length; i++) {
      let cube = cubes[i];
      let win = wins[i];
      let _t = t; // + i * .2;

      let posTarget = {
        x: win.shape.x + win.shape.w * 0.5,
        y: win.shape.y + win.shape.h * 0.5,
      };

      cubes.forEach((torus, index) => {
        let scale = Math.sin(t + index) * 2;
        torus.scale.set(scale, scale, scale); // Morphing effect
        torus.rotation.x = t * 0.5; // Adjust rotation speed if needed
        torus.rotation.y = t * 0.3; // Adjust rotation speed if needed
      });
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  // resize the renderer to fit the window size
  function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}
