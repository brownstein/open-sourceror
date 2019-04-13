import * as THREE from "three";
const {
  Vector3,
  Face3,
  Geometry,
  Mesh,
  DoubleSide,
  ShaderMaterial,
  Color,
  Scene
} = THREE;
const Line2DGeometry = require("three-line-2d")(THREE);
const Line2DShader = require('three-line-2d/shaders/basic')(THREE);
const hash = require("hashcode").hashCode();
import { createText, createRunicText } from "./text";

class BaseSlice {
  createAllMeshes (...params) {
    const parentMesh = this.createMesh(...params);
    if (this.children) {
      this.children.forEach(child => {
        parentMesh.children.push(child.createAllMeshes());
      });
    }
    return parentMesh;
  }
}

/**
 * Helper class to make dealing with slices of circles easier
 */
export class CircleSlice extends BaseSlice {
  constructor ({
    startTheta = 0,
    endTheta = Math.PI * 2,
    radius = 10,
    thickness = 1,
    resolution = 32,
    color = "#ffffff",
    layoutPriority = 1,
    children = null
  } = {}) {
    super();
    this.startTheta = startTheta;
    this.endTheta = endTheta;
    this.radius = radius;
    this.thickness = thickness;
    this.resolution = resolution;
    this.color = color;
    this.children = [];
    this.layoutPriority = layoutPriority;
    if (children) {
      this.children.push(...children);
    }
  }
  static fromCodeExpression () {
    return new CircleSlice();
  }
  createMesh () {
    const {
      resolution,
      startTheta,
      endTheta,
      radius,
      color,
      thickness
    } = this;
    let closed = false;
    let numPoints = Math.ceil(resolution * (endTheta - startTheta) / Math.PI * 2);
    let pointAngle = (endTheta - startTheta) / numPoints;
    if (
      ((startTheta + Math.PI * 2) % (Math.PI * 2)) ===
      ((endTheta + Math.PI * 2) % (Math.PI * 2))
    ) {
      closed = true;
      numPoints -= 1;
    }
    const points = [];
    for (let p = 0; p < numPoints; p++) {
      points.push([
        radius * Math.cos(startTheta + p * pointAngle),
        radius * Math.sin(startTheta + p * pointAngle)
      ]);
    }
    const geom = new Line2DGeometry(points, {
      distances: true,
      closed: closed
    });
    const material =  new ShaderMaterial(Line2DShader({
      side: DoubleSide,
      diffuse: color,
      thickness: thickness
    }));
    return new Mesh(geom, material);
  }
}

/**
 * Helper class to make dealing with symbols and text easier
 */
export class SymbolText {
  constructor ({
    value = "[Symbol]",
    runic = false,
    center = false,
    color = "#ffffff",
    curveRadius = 0,
    scale = 1
  } = {}) {
    this.value = value;
    this.runic = runic;
    this.center = center;
    this.color = color;
    this.curveRadius = curveRadius;
    this.scale = scale;
  }
  createMesh () {
    const {
      value,
      runic,
      center,
      color,
      curveRadius,
      scale
    } = this;
    let textVal = `${value}`;
    if (runic) {
      textVal = String.fromCharCode(65 + Math.abs(hash.value(textVal)) % 26);
    }
    let textMeshes = [];
    if (curveRadius) {
      const cx = 0;
      const cy = curveRadius;
      let totalWidth = 0;
      const textWidths = [];
      for (let li = 0; li < textVal.length; li++) {
        const mesh = runic ?
          createRunicText(textVal[li], color) :
          createText(textVal[li], color);
        textMeshes.push(mesh);
        mesh.scale.multiplyScalar(scale);
        mesh.geometry.computeBoundingBox();
        let width = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
        textWidths.push(width);
        totalWidth += width;
        if (li < textVal.length - 1) {
          totalWidth += SymbolText.extraCharSpace;
        }
      }
      let offset = -totalWidth / 2;
      const thetaRatio = 1 / (curveRadius * Math.PI * 2);
      for (let li = 0; li < textVal.length; li++) {
        const mesh = textMeshes[li];
        const width = textWidths[li];
        const theta = -Math.PI / 2 + (offset + (width / 2)) * thetaRatio;
        offset += width;
        mesh.rotation.z = theta + Math.PI / 2;
        mesh.position.x = cx + curveRadius * Math.cos(theta);
        mesh.position.y = cy + curveRadius * Math.sin(theta);
      }
    }
    else {
      textMeshes.push(runic ?
        createRunicText(textVal, color) :
        createText(textVal, color)
      );
      textMeshes[0].scale.multiplyScalar(scale);
    }
    const meshContainer = new Scene();
    if (center && !curveRadius) {
      textMeshes.forEach(textMesh => {
        textMesh.geometry.computeBoundingBox();
        const textBbox = textMesh.geometry.boundingBox;
        const textBboxSize = new Vector3();
        textBbox.getSize(textBboxSize);
        textBboxSize.multiplyScalar(scale);
        textMesh.position.x = -textBboxSize.x / 2;
        textMesh.position.y = textBboxSize.y / 2;
      });
    }
    meshContainer.add(...textMeshes);
    return meshContainer;
  }
}
SymbolText.extraCharSpace = 2;

/**
 * Helper class to allow text to occupy circle slices
 */
export class SymbolTextCircleSlice extends BaseSlice {
  constructor ({
    text = "test",
    startTheta = 0,
    endTheta = Math.PI * 2,
    radius = 10,
    color = "0xffffff",
    runic = false,
    layoutPriority = 0.2
  } = {}) {
    super();
    this.text = text;
    this.startTheta = startTheta;
    this.endTheta = endTheta;
    this.radius = radius;
    this.color = color;
    this.runic = runic;
    this.layoutPriority = layoutPriority;
    this.children = [];
  }
  createMesh () {
    const midTheta = (this.startTheta + this.endTheta) / 2;
    if (this.runic) {
      const runicSymbol = new SymbolText({
        value: this.text,
        color: this.color,
        scale: 0.5,
        runic: true,
        center: true
      });
      const runicMesh = runicSymbol.createMesh();
      runicMesh.rotation.z = midTheta + Math.PI / 2;
      runicMesh.position.x = this.radius * Math.cos(midTheta);
      runicMesh.position.y = this.radius * Math.sin(midTheta);
      return runicMesh;
    }
    else {
      const symbol = new SymbolText({
        value: this.text,
        color: this.color,
        curveRadius: this.radius,
        scale: 0.3
      });
      const mesh = symbol.createMesh();
      mesh.rotation.z = midTheta + Math.PI / 2;
      mesh.position.x = this.radius * Math.cos(midTheta);
      mesh.position.y = this.radius * Math.sin(midTheta);
      return mesh;
    }
    throw new Error("only runic is currently supported");
  }
}

/**
 * Configures a given set of circle slices to fit into a given circle slice
 */
export function applyCircularLayout (slices, {
  startTheta = 0,
  endTheta = Math.PI * 2,
  margin = 0.1,
  radius = 30,
  radiusDelta = 10
} = {}) {
  if (slices.length === 0) {
    return;
  }
  if (slices.length === 1) {
    const slice = slices[0];
    slice.startTheta = startTheta;
    slice.endTheta = endTheta;
    slice.radius = radius;
    applyCircularLayout(slice.children, {
      startTheta: slice.startTheta,
      endTheta: slice.endTheta,
      radius: radius + radiusDelta,
      radiusDelta: radiusDelta
    });
    return;
  }
  let totalPriority = slices.reduce((p, s) => p + s.layoutPriority, 0);
  totalPriority += margin * slices.length;
  const thetaPerPriority = (endTheta - startTheta) / totalPriority;
  let theta = startTheta + margin * thetaPerPriority / 2;
  slices.forEach(slice => {
    slice.startTheta = theta;
    theta += slice.layoutPriority * thetaPerPriority;
    slice.endTheta = theta;
    theta += margin * thetaPerPriority;
    slice.radius = radius;
    applyCircularLayout(slice.children || [], {
      startTheta: slice.startTheta,
      endTheta: slice.endTheta,
      radius: radius + radiusDelta,
      radiusDelta: radiusDelta
    });
  });
}
