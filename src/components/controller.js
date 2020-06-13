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

import Engine from "../engine";

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
          running: true,
          loading: false
        });
        this.running = true;
        this.loading = false;
      });
    }
  }
  componentWillUnmount() {
    // this.engine.ks.unmount();
  }
  render() {
    const { children } = this.props;
    const ctx = {
      engine: this.engine,
      running: this.state.running,
      loading: this.state.loading,
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
    if (!this.running) {
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
    this.running = false;
    this.engine.running = false;
    this.setState({ running: false });
  }
  _focusGained() {
    return;
    this.running = true;
    this.engine.running = true;
    this.lastFrameTime = new Date().getTime();
    this.setState({ running: true });
  }
  pause() {
    this.running = false;
    this.engine.running = false;
    this.setState({ running: false });
  }
  unPause() {
    this.running = true;
    this.engine.running = true;
    this.lastFrameTime = new Date().getTime();
    this.setState({ running: true });
  }
};

export const GameController = connect()(_GameController);