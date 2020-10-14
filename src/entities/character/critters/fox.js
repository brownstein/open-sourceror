import { Object3D } from "three";
import {
  Circle,
  Body,
  vec2
} from "p2";
import { AnimatedSprite } from "src/engine/sprites";
import {
  runSheet,
  runImage,
  hangoutSheet,
  hangoutImage
} from "./sprites/fox";

import BaseEntity from "src/entities/base";

export class Fox extends BaseEntity {
  static roomEntityNames = ["foxStart"];
  static roomInitializer(engine, obj, props) {
    const fox = new Fox({
      position: [obj.x, obj.y]
    });
    engine.addEntity(fox);
    return fox;
  }

  constructor(props) {
    super(props);

    this.body = new Body({
      mass: 20,
      damping: 0.1,
      friction: 0.9,
      fixedRotation: true,
      position: props.position,
      allowSleep: true
    });

    const foxShape = new Circle({
      radius: 8
    });

    this.mesh = new Object3D();

    this.body.addShape(foxShape, [0, 0]);

    this.jumping = false;
    this.runningRight = false;

    this.spritesLoaded = false;
    this.readyPromise = this._loadSprites();
  }
  async _loadSprites() {
    const sitSprite = new AnimatedSprite(runImage, runSheet);
    await sitSprite.readyPromise;
    this.spritesLoaded = true;
    this.sprite = sitSprite;
    sitSprite.playAnimation();
    this.mesh.add(sitSprite.mesh);
  }
  syncMeshWithBody(timeDelta) {
    super.syncMeshWithBody(timeDelta);
    if (this.spritesLoaded) {
      this.sprite.animate(timeDelta);
    }
  }
  onFrame(timeDelta) {
    const controllingEntity = this.engine.controllingEntity;
    if (Math.abs(
      controllingEntity.body.position[0] -
      this.body.position[0]
    ) < 100) {
      this.body.velocity[0] += 10;
    }
  }
}
