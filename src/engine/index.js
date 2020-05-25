import EventEmitter from "events";
import {
  Box3,
  Color,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2,
  WebGLRenderer
} from "three";
import {
  ContactMaterial,
  World
} from "p2";

import KeyState from "./key-state";
import { ScriptExecutionContext } from "../script-runner/execution-context";

export default class Engine extends EventEmitter {
  constructor() {
    super();

    // keyboard events
    this.ks = new KeyState();

    // rendering
    this.scene = new Scene();

    // physics
    this.world = new World({
      gravity:[0, 900]
    });
    this.world.sleepMode = World.BODY_SLEEPING;

    // script execution context
    this.scriptExecutionContext = new ScriptExecutionContext(this);

    // three.js camera positioning will be managed at the engine level for now
    const minCameraSize = { width: 200, height: 200 };
    const camera = new OrthographicCamera(
      -minCameraSize.width * 0.5, minCameraSize.width * 0.5,
      -minCameraSize.height * 0.5, minCameraSize.height * 0.5,
      -32, 32
    );
    camera.lookAt(new Vector3(0, 0, -1));
    camera.position.copy(new Vector3(0, 0, 1));
    this.cameras = [{
      minCameraSize,
      camera
    }];

    // we will keep track of the level's bounding box
    this.levelBBox = new Box3();
    this.levelBBox.expandByPoint(new Vector3(0, 0, 0));
    this.levelBBox.expandByPoint(new Vector3(64, 64, 0));

    // engine-level entities
    this.activeEntities = [];
    this.activeEntitiesByBodyId = {};
    this.followingEntity = null;
    this.controllingEntity = null;

    // running scripts
    this.running = false;
    this.attachedScriptsByBodyId = {};

    // connection to the controller and the Redux world (for script execution)
    this.controller = null;
    this.dispatch = null;

    // set up P2 contact handlers
    this._initializeContactHandlers();
  }
  _initializeContactHandlers () {
    this.world.on("beginContact", event => {
      const { bodyA, bodyB, shapeA, shapeB, contactEquations } = event;
      const entityA = this.activeEntitiesByBodyId[bodyA.id];
      const entityB = this.activeEntitiesByBodyId[bodyB.id];
      if (!entityA || !entityB) {
        return;
      }
      if (entityA && entityA.collisionHandler) {
        const eq = contactEquations[0]; // .find(c => c.bodyA === bodyA);
        entityA.collisionHandler(this, bodyB.id, entityB, eq);
      }
      if (entityB && entityB.collisionHandler) {
        const eq = contactEquations[0]; //.find(c => c.bodyA === bodyB);
        entityB.collisionHandler(this, bodyA.id, entityA, eq);
      }
    });
    this.world.on("endContact", event => {
      const { bodyA, bodyB, shapeA, shapeB } = event;
      const entityA = this.activeEntitiesByBodyId[bodyA.id];
      const entityB = this.activeEntitiesByBodyId[bodyB.id];
      if (entityA && entityA.endCollisionHandler) {
        entityA.endCollisionHandler(this, bodyB.id, entityB);
      }
      if (entityB && entityB.endCollisionHandler) {
        entityB.endCollisionHandler(this, bodyA.id, entityA);
      }
    });
    this.world.on("preSolve", event => {
      const { contactEquations } = event;
      for (let eqi = 0; eqi < contactEquations.length; eqi++) {
        const eq = contactEquations[eqi];
        const entityA = this.activeEntitiesByBodyId[eq.bodyA.id];
        const entityB = this.activeEntitiesByBodyId[eq.bodyB.id];
        if (!entityA || !entityB) {
          return;
        }
        if (entityA && entityA.handleContactEquation) {
          entityA.handleContactEquation(this, eq.bodyB.id, entityB, eq);
        }
        if (entityB && entityB.handleContactEquation) {
          entityB.handleContactEquation(this, eq.bodyA.id, entityA, eq);
        }
      }
    });
  }
  addEntity(entity) {
    entity.engine = this;
    this.activeEntities.push(entity);
    if (entity.body) {
      this.activeEntitiesByBodyId[entity.body.id] = entity;
      this.world.addBody(entity.body);
    }
    if (entity.mesh) {
      this.scene.add(entity.mesh);
    }
  }
  addLevelEntity(entity) {
    entity.engine = this;
    this.activeEntities.push(entity);
    if (entity.body) {
      this.activeEntitiesByBodyId[entity.body.id] = entity;
      this.world.addBody(entity.body);
    }
    if (entity.mesh) {
      this.scene.add(entity.mesh);
      this.levelBBox.expandByObject(entity.mesh);
    }
  }
  followEntity(entity) {
    this.followingEntity = entity;
  }
  setControllingEntity(entity) {
    this.controllingEntity = entity;
  }
  removeEntity(entity) {
    this.activeEntities = this.activeEntities.filter(e => e !== entity);
    if (entity.body) {
      delete this.activeEntitiesByBodyId[entity.body.id];
      this.world.removeBody(entity.body);
    }
    if (entity.mesh) {
      this.scene.remove(entity.mesh);
    }
    if (entity.emit) {
      entity.emit("remove", { entity });
    }
  }
  /**
   * Primary run method
   */
  step(deltaTimeMs) {
    // run P2
    const deltaTimeS = deltaTimeMs / 1000;
    const fixedTimeStep = 1 / 60; // seconds
    const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
    this.world.step(fixedTimeStep, deltaTimeS, maxSubSteps);

    // sync three with P2, do keyboard events
    this.activeEntities.forEach(e => {
      e.syncMeshWithBody && e.syncMeshWithBody(deltaTimeMs);
      e.onFrame && e.onFrame(deltaTimeMs);
    });

    // run scripts
    this.scriptExecutionContext.onFrame(deltaTimeMs);

    // track camera
    if (this.followingEntity) {
      this.cameras.forEach(cam => {
        cam.camera.position.copy(this.followingEntity.mesh.position)
      });
    }

    // emit frame event to child components for rendering
    this.emit("frame", { deltaTimeMs });
  }
  /**
   * Viewport focus / defocus method - allows the character to react to the
   * user's focus state
   */
  handleViewportFocus(isFocused) {
    if (this.controllingEntity && this.controllingEntity.handleViewportFocus) {
      this.controllingEntity.handleViewportFocus(isFocused);
    }
  }
}
