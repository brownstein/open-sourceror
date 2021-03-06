import EventEmitter from "events";
import { Component } from "react";
import {
  Box3,
  Color,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2,
  WebGLRenderer
} from "three";

import KeyState from "src/engine/key-state";
import { ControllerContext } from "src/components/controller";
import StatusOverlay from "./status-overlay";
import HotkeyRow from "src/components/items/hotkey-row";
import { TargetingReticle } from "src/entities/presentational/targeting";

import "./viewport.less";

const DEBUG_OUTER_VIEW = 0; // debug number to expand view outside room bounds

export class EngineViewport extends Component {
  static contextType = ControllerContext;
  constructor(props) {
    super(props);
    this.constrainCameraToScene = true;

    this.camera = null;
    this.needsRender = false;
    this.renderer = null;

    this.canvasEl = null;
    this.canvasSize = { width: 200, height: 200 };

    // focus context and keyboard events
    this.ks = new KeyState();

    // we need to keep hovering dialogue in the react state to force updates
    this.state = {
      hoveringDomEntities: []
    };

    // mouse coordinates
    this.mouseOnScreen = false;
    this.mouseScreenCoordinates = new Vector3(0, 0, 0);
    this.mouseSceneCoordinates = new Vector3(0, 0, 0);
    this.mouseEventEmitter = new EventEmitter();

    // targeting, camera positioning
    this.targetSceneFrameSize = new Vector2(300, 200);
    this.targetingReticle = new TargetingReticle(this);

    // return focus support
    this._globalMousePosition = {
      clientX: 0,
      clientY: 0
    };

    this._onFrame = this._onFrame.bind(this);
    this._renderFrame = this._renderFrame.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onReturnFocus = this._onReturnFocus.bind(this);
    this._onGlobalMouseMove = this._onGlobalMouseMove.bind(this);
  }
  componentDidMount() {
    const { engine, cursorPosition } = this.context;
    const { minCameraSize } = engine.cameras[0];

    this.ks.mount(document);

    this.cameraSize = { ...minCameraSize };
    this.camera = new OrthographicCamera(
      -this.cameraSize.width * 0.5, this.cameraSize.width * 0.5,
      -this.cameraSize.height * 0.5, this.cameraSize.height * 0.5,
      -32, 32
    );
    this.camera.lookAt(new Vector3(0, 0, -1));

    this.renderer = new WebGLRenderer({
      canvas: this.canvasEl,
      // alpha: true,
      // preserveDrawingBuffer: true
    });
    this.renderer.setClearColor(new Color("#444444"));
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // attach event listeners
    window.addEventListener("resize", this._onResize);

    // add targeting reticle to the scene
    // engine.addEntity(this.targetingReticle);

    // size canvas to the current size of it's container
    this._onResize();
    this._queueRender();

    // start listening for rendering queues
    engine.on("frame", this._onFrame);

    // listen for focus returns after closing a modal
    engine.on("return-focus", this._onReturnFocus);
    document.addEventListener("mousemove", this._onGlobalMouseMove);

    // queue second resize to be sure (windows)
    requestAnimationFrame(this._onResize);

    // handle current cursor position
    const viewportBounds = this.viewportEl.getBoundingClientRect();
    if (
      viewportBounds.top <= cursorPosition.y &&
      viewportBounds.bottom >= cursorPosition.y &&
      viewportBounds.left <= cursorPosition.x &&
      viewportBounds.right >= cursorPosition.x
    ) {
      this.mouseOnScreen = true;
      this.targetingReticle.setVisible(true);
      engine.handleViewportFocus(true);
      this._updateMouseScreenCoordinates({
        clientX: cursorPosition.x,
        clientY: cursorPosition.y
      });
    }
  }
  componentWillUnmount() {
    const { engine } = this.context;
    this.ks.unmount(document);
    window.removeEventListener("resize", this._onResize);
    engine.off("frame", this._onFrame);
    engine.off("return-focus", this._onReturnFocus);
    document.removeEventListener("mousemove", this._onGlobalMouseMove);
    // engine.removeEntity(this.targetingReticle);
  }
  render() {
    const { hoveringDomEntities } = this.state;
    const entityOverlays = hoveringDomEntities.map(
      ({ entity, position }, i) => (
        <div
          className="hovering-entity"
          key={i}
          style={{
            position: "absolute",
            left: position.x,
            top: position.y
          }}
        >
          { entity.hoverElement }
        </div>
      )
    );
    return <div
      ref={r => this.viewportEl = r}
      className="viewport"
      onMouseEnter={this._onMouseEnter}
      onMouseLeave={this._onMouseLeave}
      onMouseMove={this._onMouseMove}
      onMouseDown={this._onMouseDown}
      onMouseUp={this._onMouseUp}
      onClick={this._onClick}
      >
      <canvas ref={r => this.canvasEl = r}/>
      <StatusOverlay/>
      <div className="hotkeys"><HotkeyRow interactive={false}/></div>
      { entityOverlays }
    </div>;
  }
  _onFrame() {
    const { engine } = this.context;
    const player = engine.controllingEntity;

    if (player && engine.running && this.mouseOnScreen) {
      player.runKeyboardMotion(engine, this.ks);
      this.ks.runEvents().forEach(e => {
        engine.keyEventBus.emit("keyboard-event", e)
      });
    }

    this.needsRender = true;
    this._renderFrame();

    // update state with anything that needs to be positioned over the canvas
    if (
      engine.hoveringDomEntities.length ||
      this.state.hoveringDomEntities.length
    ) {
      const { width, height } = this.canvasSize;

      const maxEntityBBoxSize = 100;
      const hoveringDomEntities = [];
      engine.hoveringDomEntities.forEach(entity => {
        const position = this.getOnscreenPosition(entity.hoverPosition);
        if (
          position.x >= -maxEntityBBoxSize &&
          position.x <= maxEntityBBoxSize + width &&
          position.y >= -maxEntityBBoxSize &&
          position.y <= maxEntityBBoxSize + height
        ) {
          hoveringDomEntities.push({
            entity,
            position
          });
        }
      });

      this.setState({
        hoveringDomEntities
      });
    }
  }
  getOnscreenPosition(position, inPlace = false) {
    const { width, height } = this.canvasSize;
    const pos = inPlace ? position : position.clone();
    pos.project(this.camera);
    pos.x = (0.5 + pos.x * 0.5) * width;
    pos.y = (0.5 - pos.y * 0.5) * height;
    return pos;
  }
  getScenePositionForScreenPosition(position, inPlace = false) {
    const { width, height } = this.canvasSize;
    const pos = inPlace ? position : position.clone();
    pos.x = ((pos.x / width) - 0.5) * 2;
    pos.y = (0.5 - (pos.y / height)) * 2;
    pos.unproject(this.camera);
    return pos;
  }
  _queueRender() {
    this.needsRender = true;
    requestAnimationFrame(this._renderFrame);
  }
  _renderFrame() {
    if (!this.needsRender) {
      return;
    }
    this.needsRender = false;
    const { engine } = this.context;
    const { scene, levelBBox, followingEntity } = engine;
    if (!scene) {
      return;
    }

    // track camera to whatever we're following
    if (followingEntity) {
      const cameraPosition = followingEntity.mesh.position;
      this.camera.position.x = cameraPosition.x;
      this.camera.position.y = cameraPosition.y;
      if (this.constrainCameraToScene) {
        // see if we have to letterbox
        if (levelBBox.max.x - levelBBox.min.x >= this.cameraSize.width) {
          // non-letterbox constraint
          this.camera.position.x = Math.max(
            levelBBox.min.x + this.cameraSize.width / 2 - DEBUG_OUTER_VIEW,
            Math.min(
              levelBBox.max.x - this.cameraSize.width / 2 + DEBUG_OUTER_VIEW,
              this.camera.position.x
            )
          );
        }
        else {
          // letterbox constraint
          this.camera.position.x = (levelBBox.max.x + levelBBox.min.x) / 2;
          // TODO: fill extra area in if necessary
        }
        // see if we have to letterbox
        if (levelBBox.max.y - levelBBox.min.y >= this.cameraSize.height) {
          // non-letterbox constraint
          this.camera.position.y = Math.max(
            levelBBox.min.y + this.cameraSize.height / 2 - DEBUG_OUTER_VIEW,
            Math.min(
              levelBBox.max.y - this.cameraSize.height / 2 + DEBUG_OUTER_VIEW,
              this.camera.position.y
            )
          );
        }
        else {
          // letterbox constraint
          this.camera.position.y = (levelBBox.max.y + levelBBox.min.y) / 2;
          // TODO: fill extra area in if necessary
        }
      }
    }

    // update the cursor's onscreen coordinates
    this.mouseSceneCoordinates.copy(this.mouseScreenCoordinates);
    this.getScenePositionForScreenPosition(this.mouseSceneCoordinates, true);

    // update entities that have to be moved with the camera
    engine.cameraTrackedEntities.forEach(e => e.trackWithCamera(this.camera));

    // sync meshes that depend on the viewport
    for (let ei = 0; ei < engine.activeEntities.length; ei++) {
      const entity = engine.activeEntities[ei];
      if (entity.syncMeshWithViewport) {
        entity.syncMeshWithViewport(this);
      }
    }

    // render the frame
    this.renderer.render(scene, this.camera);
  }
  _updateMouseScreenCoordinates(event) {
    const { engine } = this.context;
    const { width, height } = this.canvasSize;
    this.mouseScreenCoordinates.x = event.clientX; // TODO: subtract canvas loc
    this.mouseScreenCoordinates.y = event.clientY; // TODO: subtract canvas loc
    this.mouseSceneCoordinates.copy(this.mouseScreenCoordinates);
    this.getScenePositionForScreenPosition(this.mouseSceneCoordinates, true);
    if (!engine) {
      return;
    }
    if (engine.controllingEntity) {
      engine.controllingEntity.targetCoordinates = this.mouseSceneCoordinates;
    }
  }
  _onResize() {
    const rect = this.viewportEl.getBoundingClientRect();
    const { width, height } = rect;
    this.canvasSize = { width, height };

    const targetSize = this.targetSceneFrameSize;
    const scale = Math.max(
      targetSize.x / width,
      targetSize.y / height
    );

    this.cameraSize = {
      width: width * scale,
      height: height * scale
    };
    this.camera.left = -this.cameraSize.width / 2;
    this.camera.right = this.cameraSize.width / 2;
    this.camera.top = -this.cameraSize.height / 2;
    this.camera.bottom = this.cameraSize.height / 2;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // update mouse coordinates in the scene
    this.mouseSceneCoordinates.copy(this.mouseScreenCoordinates);
    this.getScenePositionForScreenPosition(this.mouseSceneCoordinates, true);
    // this.targetingReticle.syncMeshWithViewport(this);

    // update entities that have to be resized with the camera
    const { engine } = this.context;
    engine.cameraTrackedEntities.forEach(e => e.updateForCameraBBox(this.camera));

    this._queueRender();
  }
  _onMouseEnter(event) {
    const { engine } = this.context;
    this.mouseOnScreen = true;
    if (this.targetingReticle) {
      this.targetingReticle.setVisible(true);
    }
    engine.handleViewportFocus(true);
    this._updateMouseScreenCoordinates(event);
  }
  _onMouseLeave(event) {
    const { engine } = this.context;
    this.mouseOnScreen = false;
    if (this.targetingReticle) {
      this.targetingReticle.setVisible(false);
    }
    engine.handleViewportFocus(false);
    this._updateMouseScreenCoordinates(event);
  }
  _onMouseMove(event) {
    // if we're getting mouse movements all of a sudden, it means we probably
    // deleted a node that was hovering over the canvas and it's time to begin
    // acting as if we entered the screen
    if (!this.mouseOnScreen) {
      return this._onMouseEnter(event);
    }
    this._updateMouseScreenCoordinates(event);
  }
  _onMouseDown(event) {
    const { engine } = this.context;
    engine.emit("mousedown", {
      position: this.mouseSceneCoordinates
    });
  }
  _onMouseUp(event) {
    const { engine } = this.context;
    engine.emit("mouseup", {
      position: this.mouseSceneCoordinates
    });
  }
  _onClick(event) {
    const { engine } = this.context;
    engine.emit("click", {
      position: this.mouseSceneCoordinates
    });
  }
  _onGlobalMouseMove(event) {
    const { clientX, clientY } = event;
    this._globalMousePosition = {
      clientX,
      clientY
    };
  }
  /**
   * This is a hack to allow the player to immediately interract with the
   * viewport after closing an overlay that stole focus
   */
  _onReturnFocus() {
    if (this.mouseOnScreen) {
      return;
    }
    const viewportEl = this.viewportEl;
    const bbox = viewportEl.getBoundingClientRect();
    const mousePos = this._globalMousePosition;
    if (
      mousePos.clientX >= bbox.left &&
      mousePos.clientX <= bbox.right &&
      mousePos.clientY >= bbox.top &&
      mousePos.clientY <= bbox.bottom
    ) {
      this._onMouseEnter(this._globalMousePosition);
    }
  }
}
