import {
  Color,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2,
  WebGLRenderer
} from "three";
import * as p2 from "p2";
import * as decomp from "poly-decomp";
import SimpleShape from "./simple-shape";

window.decomp = decomp;
import "./style.less";

let renderEl, mRenderEl;
let scene, camera, renderer;

const windowSize = { width: 300, height: 300 };

export default function initScene() {
  const containerEl = document.getElementById("container");

  renderEl = document.createElement("canvas");
  renderEl.style = `
    background: #cccccc;
    width: ${windowSize.width}px;
    height: ${windowSize.height}px;
  `;
  containerEl.appendChild(renderEl);

  // mRenderEl = document.createElement("canvas");
  // mRenderEl.style = `
  //   background: #cccccc;
  //   width: ${windowSize.width}px;
  //   height: ${windowSize.height}px;
  // `;
  // mRenderEl.width = windowSize.width;
  // mRenderEl.height = windowSize.height;
  // containerEl.appendChild(mRenderEl);

  // set up three.js world and renderer
  scene = new Scene();
  camera = new OrthographicCamera(
    -100, 100,
    -100, 100,
    -100, 100
  );
  camera.lookAt(new Vector3(0, 0, -1));
  camera.position.copy(new Vector3(0, 0, 1));

  renderer = new WebGLRenderer({
    // alpha: true,
    canvas: renderEl,
    preserveDrawingBuffer: true
  });
  renderer.setClearColor(new Color("#444444"));
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(windowSize.width, windowSize.height);

  // set up matter.js world and renderer
  const world = new p2.World({
    gravity:[0, 300]
  });
  // const engine = Matter.Engine.create();
  // const world = engine.world;
  // const mRender = Matter.Render.create({
  //   canvas: mRenderEl,
  //   engine: engine,
  //   options: {
  //     width: windowSize.width,
  //     height: windowSize.height,
  //     background: "#ffcccc",
  //   }
  // });
  // const runner = Matter.Runner.create();
  // Matter.Render.run(mRender);
  // Matter.Runner.run(runner, engine);

  // add things to the world
  const triverts = [{ x: 0, y: 0 }, { x: 10, y: -50 }, { x: 50, y: 0 }];
  const thing = new SimpleShape(triverts, {
    // friction: 0.1,
    // frictionStatic: 0.1,
    // mass: 5,
    // //inertia: 199,
    // restitution: 0
    mass: 5,
    damping: 0.5
  });

  const groundVerts = [
    { x: 0, y: 0 },
    { x: 200, y: -30 },
    { x: 200, y: 10 },
    { x: 0, y: 10 },
  ];
  const ground = new SimpleShape(groundVerts, {
    //isStatic: true,
    mass: 0,
    fixedY: true,
    fixedRotation: true,
    position: [0, 80]
  });
  //ground.body.friction = 0.1;

  scene.add(thing.mesh);
  scene.add(ground.mesh);
  world.addBody(thing.body);
  world.addBody(ground.body);
  // Matter.World.add(world, [thing.body]);
  // Matter.World.add(world, [ground.body]);
  //
  // Matter.Body.setAngularVelocity(thing.body, 0.2);
  //
  // Matter.Render.lookAt(mRender, {
  //     min: { x: -100, y: -100 },
  //     max: { x: 100, y: 100 }
  // });
  //
  // Matter.Events.on(runner, "afterTick", function renderThree(e) {
  //   thing.syncMeshWithBody();
  //   ground.syncMeshWithBody();
  //   renderer.render(scene, camera);
  // });
  const fixedTimeStep = 1 / 60; // seconds
  const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
  let lastTime;
  function renderNextFrame() {
    const time = new Date().getTime();
    var deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
    world.step(fixedTimeStep, deltaTime, maxSubSteps);
    lastTime = time;
    thing.syncMeshWithBody();
    ground.syncMeshWithBody();
    renderer.render(scene, camera);
    requestAnimationFrame(renderNextFrame);
  }
  requestAnimationFrame(renderNextFrame);
}
