import { Body, Convex, Material, vec2 } from "p2";
import getThreeJsObjectForP2Body from "../../p2-utils/get-threejs-mesh";
import BaseEntity from "entities/base";

import characterPolygon from "./base.json";

export const characterMaterial = new Material();

export class Character extends BaseEntity {
  constructor (props = {}) {
    super();
    this.body = new Body({
      mass: 20,
      damping: 0.1,
      friction: 0.9,
      fixedRotation: true,
      position: props.position || [50, 50],
      allowSleep: false
    });
    const convex = new Convex({
      vertices: characterPolygon.vertices
    });
    convex.material = characterMaterial;

    // assign collision group for the convex
    convex.collisionGroup = 0b11;
    convex.collisionMask = 0b01;

    // find center of mass for convex vertices
    const cm = vec2.create();
    for(let j = 0; j !== convex.vertices.length; j++){
      const v = convex.vertices[j];
      vec2.sub(v, v, convex.centerOfMass);
    }
    vec2.scale(cm, convex.centerOfMass, 1);

    // add the convex
    this.body.addShape(convex, cm);
    this.mesh = getThreeJsObjectForP2Body(this.body);

    this.facingRight = true;
    this.onSurface = true;

    this.accelleration = [50, 50]; // rate of character speed increase
    this.jumpAcceleration = 400; // velocity delta of jump
    this.maxControlledVelocity = [200, 400]; // max controlled speed
    this.plannedAccelleration = [0, 0]; // accelleration to apply on next frame

    this.health = 100;
    this.maxHealth = 100;
    this.mana = 100;
    this.maxMana = 100;

    this.laserPassthrough = true;
  }
  syncMeshWithBody() {
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
  accellerate(delta, maxControlledSpeed = 0) {
    if (maxControlledSpeed) {
      // normalize the delta to get the raw directional vector
      const normalizedDelta = vec2.create();
      vec2.normalize(normalizedDelta, delta);

      // calculate the initial speed along that vector
      const initialSpeed = vec2.dot(normalizedDelta, this.body.velocity);

      // if we're moving over the speed threshold already, we're done
      if (initialSpeed >= maxControlledSpeed) {
        return;
      }

      // calculate the updated speed
      const deltaLength = vec2.length(delta);
      const newSpeed = Math.min(deltaLength + initialSpeed, maxControlledSpeed);
      const deltaSpeed = Math.max(0, newSpeed - initialSpeed);

      // calculate the constrained delta
      const constrainedDelta = vec2.create();
      vec2.scale(constrainedDelta, normalizedDelta, deltaSpeed);

      // add the delta speed
      vec2.add(this.body.velocity, this.body.velocity, constrainedDelta);
    }
    else {
      vec2.add(this.body.velocity, this.body.velocity, delta);
    }
  }
  onFrame() {
    // move the character
    if (this.plannedAccelleration[0]) {
      this.facingRight = this.plannedAccelleration[0] > 0;
      this.accellerate(
        [this.plannedAccelleration[0], 0],
        this.maxControlledVelocity[0]
      );
    }
    if (this.plannedAccelleration[1]) {
      if (this.plannedAccelleration[1] > 0) {
        this.accellerate(
          [0, this.plannedAccelleration[1]],
          this.maxControlledVelocity[1]
        );
      }
      else if (this.onSurface) {
        this.accellerate(
          [0, this.plannedAccelleration[1]],
          this.jumpAcceleration
        );
      }
    }

    // reset surface contact (this runs before handleContactEquation)
    this.onSurface = false;
    this.plannedAccelleration[0] = 0;
    this.plannedAccelleration[1] = 0;
  }
  handleContactEquation (engine, shapeId, otherBodyId, otherEntity, eq) {
    // figure out whether or not the character is on a jump-ready surface
    let surfaceNormal;
    if (eq.bodyA === this.body) {
      surfaceNormal = eq.normalA;
    }
    else {
      surfaceNormal = [-eq.normalA[0], -eq.normalA[1]];
    }
    this.onSurface = this.onSurface || surfaceNormal[1] > 0.3;
  }
  getMana() {
    return this.mana;
  }
  incrementMana(diff) {
    this.mana = Math.max(0, Math.min(this.maxMana, this.mana + diff));
  }
  getHealth() {
    return this.health;
  }
  incrementHealth(diff) {
    this.health = Math.max(0, Math.min(this.maxHealth, this.health + diff));
  }
}
