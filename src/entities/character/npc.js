import {
  Color,
  Vector2
} from "three";
import {
  Body,
  Convex,
  Circle
} from "p2";
import { castToVec2, vec2ToVector2 } from "src/p2-utils/vec2-utils";
import characterPolygon from "src/entities/character/base.json";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import BaseEntity from "src/entities/base";
import { DialogueEntity } from "src/entities/presentational/dialogue";
import { Sensor } from "src/entities/sensor";
import { loadDialogue } from "src/dialogues/loader";
import { beginDialogue } from "src/redux/actions/dialogue";

export class NPC extends BaseEntity {
  static roomEntityNames = ["npc"];
  static roomInitializer(engine, obj, props) {
    const npc = new NPC({
      position: {
        x: obj.x,
        y: obj.y
      },
      npcDialogue: props.npcDialogue,
      dialogueDef: props.dialogueDef
    });
    engine.addEntity(npc);
    return npc;
  }

  constructor(props) {
    super(props);
    const {
      position,
      npcDialogue,
      dialogueDef
    } = props;

    const color = new Color(0.2, 1, 0.2);

    this.body = new Body({
      mass: 1,
      position: castToVec2(position)
    });
    this.convex = new Convex({
      vertices: characterPolygon.vertices,
      // sensor: true
    });
    this.body.addShape(this.convex);
    this.mesh = getThreeJsObjectForP2Body(this.body, true, color);

    // set to not collide with the player
    this.convex.collisionMask = 0b100;

    this.sensor = new Sensor(this, 50);
    this.sensor.attachUpdateHandler(this._onSensorUpdate.bind(this));
    this.children = [this.sensor];

    if (npcDialogue) {
      this.npcDialogue = npcDialogue.split("|").map(d => d.trim());
      this.npcDialogueStep = 0;
    }

    if (dialogueDef) {
      this.dialogueDef = dialogueDef;
    }

    this.dialogueEntity = null;
    this._onKeyEvent = this._onKeyEvent.bind(this);
    this._onKeyEvent2 = this._onKeyEvent2.bind(this);
  }
  _onKeyEvent(keyEvent) {
    const { engine } = this;
    if (keyEvent.key === "e" && keyEvent.down) {
      this.npcDialogueStep++;
      engine.removeEntity(this.dialogueEntity);
      if (this.npcDialogueStep < this.npcDialogue.length) {
        let size = null;
        if (this.npcDialogue[this.npcDialogueStep].length > 100) {
          size = "large";
        }
        this.dialogueEntity = new DialogueEntity(
          vec2ToVector2(this.body.position).add(new Vector2(0, -16)),
          this.npcDialogue[this.npcDialogueStep],
          size
        );
        engine.addEntity(this.dialogueEntity);
      }
    }
  }
  _onKeyEvent2(keyEvent) {
    const { engine } = this;
    if (keyEvent.key !== "e" || !keyEvent.down) {
      return;
    }
    const def = loadDialogue(this.dialogueDef);
    engine.store.dispatch(beginDialogue(def));
  }
  _onSensorUpdate() {
    const { sensor, engine } = this;
    const player = engine.controllingEntity;
    if (sensor.collidingWith.find(([_, other]) => other === player)) {
      if (this.dialogueEntity) {
        return;
      }
      if (this.npcDialogue) {
        this.npcDialogueStep = 0;
        this.dialogueEntity = new DialogueEntity(
          vec2ToVector2(this.body.position).add(new Vector2(0, -16)),
          this.npcDialogue[this.npcDialogueStep]
        );
        engine.addEntity(this.dialogueEntity);
        engine.keyEventBus.on("keyboard-event", this._onKeyEvent);
      }
      // enable trigger
      if (this.dialogueDef) {
        engine.keyEventBus.on("keyboard-event", this._onKeyEvent2);
      }
    }
    else {
      if (this.npcDialogue) {
        if (this.dialogueEntity) {
          engine.removeEntity(this.dialogueEntity);
          this.dialogueEntity = null;
        }
        engine.keyEventBus.off("keyboard-event", this._onKeyEvent);
        this.npcDialogueStep = 0;
      }
      // disdable trigger
      if (this.dialogueDef) {
        engine.keyEventBus.off("keyboard-event", this._onKeyEvent2);
      }
    }
  }
}
