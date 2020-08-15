import delay from "delay";
import EventEmitter from "events";
import { createContext, Component } from "react";
import { connect } from "react-redux";
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

import Engine from "src/engine";
import requireRoom from "src/rooms/require-room";
import { canOpenPauseMenu } from "src/redux/selectors/ui";
import { openPauseMenu, closeModal } from "src/redux/actions/ui";

export const ControllerContext = createContext({
  engine: null
});

class _GameController extends Component {
  constructor(props) {
    super();
    this.engine = new Engine();
    this.engine.store = props.store;

    // top-level control properties
    this.gameState = "start-menu";

    // running properties
    this.running = false;
    this.loading = true;
    this.lastFrameTime = null;

    this.state = {
      running: false,
      loading: true
    };

    // bind event handlers
    this._updateLoop = this._updateLoop.bind(this);
    this._focusLost = this._focusLost.bind(this);
    this._focusGained = this._focusGained.bind(this);

    // add pausing functionality
    this.engine.keyEventBus.on("keyboard-event", e => {
      if (e.key === "Escape" && e.up) {
        this.pause();
      }
    });
  }
  componentDidMount() {
    // attach window focus events for automatic pausing
    window.onblur = this._focusLost;
    window.onfocus = this._focusGained;

    // start the engine
    this.running = true;
    this.engine.running = true;
    this.lastFrameTime = new Date().getTime();
    this._updateLoop();

    // bootstrap the scene
    const { addThings } = this.props;
    if (addThings) {
      this.setState({
        running: false,
        loading: true
      });
      this.running = false;
      this.loading = true;
      addThings(this.engine);
      this.engine.getLoadingPromise().then(() => {
        this.setState({
          loading: false
        });
        this.running = true;
        this.loading = false;
      });
    }

    if (this.props.currentRoom) {
      this._swapRoom(this.props.currentRoom);
    }
  }
  componentWillUnmount() {
    const { engine } = this;
    if (engine.currentRoom) {
      engine.currentRoom.cleanup(engine);
    }
  }
  componentDidUpdate(prevProps) {
    const { currentRoom: roomName, paused } = this.props;
    const { currentRoom: previousRoomName } = prevProps;

    const { loading } = this.state;

    const running = !paused && !loading;

    if (!this.running && running) {
      this.lastFrameTime = new Date().getTime();
    }
    this.running = running;
    this.engine.running = running;

    if (roomName !== previousRoomName) {
      this._swapRoom(roomName);
    }
  }
  async _swapRoom(roomName) {
    const { engine } = this;
    const room = await requireRoom(roomName);
    if (engine.currentRoom) {
      await engine.getLoadingPromise();
      engine.currentRoom.cleanup(engine);
      await delay(100);
    }
    room.init(engine);
  }
  render() {
    const { children, paused } = this.props;
    const { loading } = this.state;
    const ctx = {
      engine: this.engine,
      running: !paused && !loading,
      loading: loading,
      unPause: () => this.unPause()
    };
    return (
      <ControllerContext.Provider value={ctx}>
        { children }
      </ControllerContext.Provider>
    );
  }
  _updateLoop() {
    try {
      this._updateFrame();
    }
    catch (err) {
      console.error(err);
    }
    requestAnimationFrame(this._updateLoop);
  }
  _updateFrame() {
    const { paused } = this.props;
    if (paused) {
      return;
    }

    // timekeeping
    const currentFrameTime = new Date().getTime();
    const deltaTimeMs = currentFrameTime - this.lastFrameTime;
    this.lastFrameTime = currentFrameTime;

    // run the engine
    this.engine.step(deltaTimeMs);
  }
  _focusLost() {
    const { dispatch } = this.props;
    // dispatch(openPauseMenu());
  }
  _focusGained() {
    // dispatch(closeModal());
  }
  pause() {
    const { dispatch } = this.props;
    dispatch(openPauseMenu());
  }
  unPause() {
    const { dispatch } = this.props;
    dispatch(closeModal());
  }
};

function mapStateToProps(state) {
  const { rooms, ui } = state;
  const { currentRoom } = rooms;
  return {
    currentRoom,
    paused: !!ui.modalStack.length,
    canOpenPauseMenu: canOpenPauseMenu(state)
  };
}

export const GameController = connect(mapStateToProps)(_GameController);
