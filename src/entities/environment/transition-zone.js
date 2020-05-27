import { Body, Box } from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import requireRoom from "src/rooms/require-room";
import BaseEntity from "src/entities/base";

export default class TransitionZone extends BaseEntity {
  constructor(props) {
    super(props);
    const position = castToVec2(props.position);
    const width = props.width;
    const height = props.height;
    const level = props.level;

    this.body = new Body({
      position,
      mass: 0,
      isStatic: true
    });

    this.sensor = new Box({
      width,
      height,
      sensor: true
    });

    this.body.addShape(this.sensor);

    this.mesh = getThreeJsObjectForP2Body(this.body);
    this.syncMeshWithBody();

    this.transitionToLevel = level;
  }
  async collisionHandler(engine, otherBodyId, otherEntity) {
    if (otherEntity !== engine.controllingEntity) {
      return;
    }
    const nextLevel = await requireRoom(this.transitionToLevel);
    engine.currentRoom.cleanup(engine);
    nextLevel.init(engine);
  }
}
