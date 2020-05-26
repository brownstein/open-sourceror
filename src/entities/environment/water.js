import {
  Body,
  Box,
  vec2
} from "p2";
import {
  Color,
  Geometry,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";

import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";

const WATER_RESOLUTION = 8;

// TODO
export class SmallBodyOfWater {
  constructor(props) {
    this.width = props.width || 100;
    this.height = props.height || 100;
    this.position = castToVec2(props.position);

    this.body = new Body({
      mass: 0,
      position: this.position
    });
    this.body.addShape(new Box({
      sensor: true,
      width: this.width,
      height: this.height
    }));

    // TODO: implement some nice ripples
    this.mesh = getThreeJsObjectForP2Body(this.body, false);
    this.mesh.position.x = this.body.position[0];
    this.mesh.position.y = this.body.position[1];
    this.mesh.position.z = 1.2;
    this.mesh.children[0].material.color = new Color(0, 0.5, 1);
    this.mesh.children[0].material.opacity = 0.6;

    this.entitiesInWater = [];
  }
  // TODO: ripples here
  collisionHandler(engine, otherBodyId, otherEntity) {
    this.entitiesInWater.push(otherEntity);
  }
  endCollisionHandler(engine, otherBodyId, otherEntity) {
    this.entitiesInWater = this.entitiesInWater.filter(e => e !== otherEntity);
  }
  onFrame() {
    this.entitiesInWater.forEach(otherEntity => {
      vec2.scale(otherEntity.body.velocity, otherEntity.body.velocity, 0.95);
    });
  }
}

// TODO
export class SplashParticle {
  constructor(position) {
    this.engine = null;

    this.mesh = new Mesh(geometry, mat);

    this._destory = this._destroy.bind(this);
    setTimeout(this._destory, 200);
  }
  _destroy() {
    this.engine.removeEntity(this);
  }
}
