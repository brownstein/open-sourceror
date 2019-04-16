"use strict";
const { ipcRenderer } = require("electron");
const Interpreter = require("js-interpreter");
const acorn = require("acorn");
const fs = require("fs");
const delay = require("delay");

var THREE = require("three");
var {
  Box3,
  Scene,
  Vector3,
  Face3,
  Mesh,
  Geometry,
  MeshBasicMaterial,
  WebGLRenderer,
  OrthographicCamera,
  Color,
  DoubleSide,
  ShaderMaterial,
  Object3D,
  TextureLoader
} = THREE;

const {
  loadAllFonts,
  createText,
  createRunicText,

  CircleSlice,
  SymbolText,
  applyCircularLayout,

  scriptToCircle,

  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice,
  runLayout
} = require("./dist");

const scr = `
"use strict";
function fibo (n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  log(n);
  return fibo(n - 1) + fibo(n - 2);
}
log(testing);
log(fibo(10));
`;

const parsed = acorn.parse(scr, {
  locations: true
});
function visitor (node) {
  console.log(node);
  fs.writeFileSync("temp1.json", JSON.stringify(node, 0, 2));
}
visitor(parsed);


let renderEl;
let scene, camera, renderer;

async function init () {
  const containerEl = document.getElementById("container");
  containerEl.appendChild(document.createElement("canvas"));
  renderEl = document.querySelector("#container > canvas");
  renderEl.style = `
    background: #cccccc;
    width: 256px;
    height: 256px;
  `;

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
  renderer.setSize(256, 256);

  await loadAllFonts();

  const [ctx, mainSlices] = scriptToCircle(parsed);
  runLayout(mainSlices[0]);

  const container = new Object3D();
  mainSlices.forEach(s => s.addMeshesToContainer(container));
  const maxRadius = mainSlices[0].getMaxRadius();
  container.scale.multiplyScalar(80 / maxRadius);
  scene.add(container);

  renderer.render(scene, camera);

  const interp = new Interpreter(scr, (interpreter, scope) => {
    interpreter.setProperty(
      scope,
      "log",
      interpreter.createNativeFunction(f => console.log(f.data))
    );
    interpreter.setProperty(
      scope,
      "testing",
      { data: "foo bar" }
    );
  });

  console.log({ interp });

  let lastParts = [];
  while (interp.stateStack.length) {
    const node = interp.stateStack[interp.stateStack.length - 1].node;
    const nodeKey = `${node.start}:${node.end}`;
    const partsByKey = ctx.slicesByPosition[nodeKey];
    if (partsByKey) {
      partsByKey.forEach(part => {
        if (part.textMeshes) {
          part.textMeshes.forEach(m => {
            m.material.uniforms.color.value = new Color(255, 0, 0);
          });
        }
      });
      renderer.render(scene, camera);
      await delay(30);
      lastParts.forEach(part => {
        if (part.textMeshes) {
          part.textMeshes.forEach(m => {
            m.material.uniforms.color.value = new Color(255, 255, 255);
          });
        }
        renderer.render(scene, camera);
      });
      lastParts = partsByKey;
    }
    if (!interp.step()) {
      break;
    }
  }

}

init();

// sourcemap experiment here
const babel = require("@babel/core");
const vlq = require("vlq");
const esScr = `
  const funky = ({ a }) => console.log(...a);
`;

babel.transform(esScr, {
  plugins: [],
  presets: ["@babel/preset-env"],
  generatorOpts: {
    sourceMaps: true
  }
}, (err, result) => {
  console.log(result.code);
  console.log(result.map);
});
