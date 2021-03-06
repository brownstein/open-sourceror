import { Component, useState, useEffect, useRef } from "react";
import { connect } from "react-redux";

// pull in Ace and configure it
import Ace, { Range } from "ace-builds/src-noconflict/ace";
import jsWorkerUrl from "file-loader?name=mode-javascript.worker!ace-builds/src-noconflict/worker-javascript";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-tomorrow";
Ace.config.setModuleUrl(
  "ace/mode/javascript_worker",
  jsWorkerUrl
);
window.ace = Ace;

// pull in Ace editor afterwards
import AceEditor from "react-ace";

// pull in engine context
import { ControllerContext } from "src/components/controller";

import { openSaveScriptMenu, openLoadScriptMenu } from "src/redux/actions/ui";

import "./code-executor.less";


const defaultSrcScript = "";

class CodeExecutor extends Component {
  static contextType = ControllerContext;
  constructor() {
    super();
    this.state = {
      currentlyLoadedScript: null,
      scriptContents: defaultSrcScript,
      editorSize: { width: 400, height : 400 },
      executionSpeed: 1
    };
    // editor instance
    this.editor = null;

    // execution and markup state
    this.annotated = false;
    this.decorations = [];
    this.markerIds = [];

    // DOM element
    this.editorContainerEl = null;

    // bound methods
    this._loadEditor = this._loadEditor.bind(this);
    this._onChange = this._onChange.bind(this);
    this._setExecutionSpeed = this._setExecutionSpeed.bind(this);
    this._save = this._save.bind(this);
    this._load = this._load.bind(this);
    this._run = this._run.bind(this);
    this._pause = this._pause.bind(this);
    this._step = this._step.bind(this);
    this._resume = this._resume.bind(this);
    this._stop = this._stop.bind(this);
    this._onResize = this._onResize.bind(this);

    this._resetPlayerMana = this._resetPlayerMana.bind(this);
  }
  componentDidMount() {
    window.addEventListener("resize", this._onResize);
    this._onResize();
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this._onResize);
  }
  _onResize() {
    const bbox = this.editorContainerEl.getBoundingClientRect();
    const { width, height } = bbox;
    this.setState({
      editorSize: { width, height }
    });
  }
  render() {
    const {
      running,
      paused,
      activeScriptContents
    } = this.props;
    const {
      scriptContents,
      editorSize,
      executionSpeed
    } = this.state;
    const isUnsaved = (
      (scriptContents || activeScriptContents) &&
      activeScriptContents !== scriptContents
    );
    const errors = [];
    const { width, height } = editorSize;
    return (
      <div className="code-executor">
        <div className="toolbar">
          <button onClick={this._save}>save</button>
          <button onClick={this._load}>load</button>
          <button onClick={this._run} disabled={running}>run</button>
          <button onClick={this._stop} disabled={!running}>stop</button>
          <span>Speed:</span>
          <select value={executionSpeed} onChange={this._setExecutionSpeed} disabled={running}>
            <option value={0.0025}>0.0025</option>
            <option value={0.02}>0.02</option>
            <option value={0.1}>0.1</option>
            <option value={1}>1</option>
          </select>
          <button onClick={this._pause} disabled={!running || paused}>pause</button>
          <button onClick={this._step} disabled={!running || !paused}>step</button>
          <button onClick={this._resume} disabled={!running || !paused}>resume</button>
          <button className="hax" onClick={this._resetPlayerMana}>reset mana</button>
          <span>{ isUnsaved ? "unsaved" : "saved" }</span>
        </div>
        <div className="editor-container" ref={r => this.editorContainerEl = r}>
          { errors }
          <AceEditor
            name="__editor__"
            mode="javascript"
            theme="tomorrow"
            onChange={this._onChange}
            value={scriptContents}
            readOnly={running}
            onLoad={this._loadEditor}
            onFocus={() => {}}
            onBlur={() => {}}
            width={`${width}px`}
            height={`${height}px`}
            highlightActiveLine={!running}
            setOptions={{
              showLineNumbers: true
            }}
            />
        </div>
      </div>
    );
  }
  _loadEditor(editor) {
    this.editor = editor;
  }
  static getDerivedStateFromProps(props, state) {
    if (state.currentlyLoadedScript !== props.loadedScript) {
      return {
        currentlyLoadedScript: props.loadedScript,
        scriptContents: props.loadedScript.scriptContents
      };
    }
    return null;
  }
  componentDidUpdate(prevProps) {
    const props = this.props;
    const editor = this.editor;
    if (props.running && props.currentLine) {
      this._markLine(props.currentLine, true);
    }
    if (prevProps.running && !props.running) {
      if (props.terminatedSuccessfully) {
        this._clearMarkings();
      }
      else if (props.runTimeError) {
        this._markError(props.runTimeError.toString(), props.currentLine);
      }
      else {
        this._markLine(props.currentLine, false);
      }
    }
    if (props.activeScriptContents !== this.state.scriptContents) {
      this._clearMarkings();
    }
    else if (props.compileTimeError) {
      const err = props.compileTimeError;
      this._markError(err, err.loc.line - 1);
    }
  }
  _onChange(scriptContents) {
    this._clearMarkings();
    this.setState({ scriptContents });
  }
  _setExecutionSpeed(event) {
    this.setState({ executionSpeed: event.target.value });
  }
  _clearMarkings() {
    const session = this.editor.getSession();
    if (this.annotated) {
      session.clearAnnotations();
      this.annotated = false;
    }
    if (this.decorations.length) {
      this.decorations.forEach(([l, clazz]) => session.removeGutterDecoration(l, clazz));
      this.decorations = [];
    }
    if (this.markerIds.length) {
      this.markerIds.forEach(m => session.removeMarker(m));
      this.markerIds = [];
    }
  }
  _markLine(line, isExecuting, finishedSuccessfully) {
    this._clearMarkings();

    const session = this.editor.getSession();
    let markerClass, gutterClass;
    if (isExecuting) {
      markerClass = "active-line-marker";
      gutterClass = "active-line-gutter";
    }
    else {
      markerClass = "terminated-line-marker";
      gutterClass = "terminated-line-gutter";
    }
    const markerRange = new Range(line, 0, line, Infinity);
    const markerId = session.addMarker(markerRange, markerClass, "screenLine", false);
    this.markerIds.push(markerId);
    session.addGutterDecoration(line, gutterClass);
    this.decorations.push([line, gutterClass]);
  }
  _markError(text, row, column = null) {
    this._clearMarkings();

    const session = this.editor.getSession();
    session.setAnnotations([{
      type: "error",
      text,
      row,
      column
    }]);
    this.annotated = true;

    // mark error in text
    const markerRange = new Range(row, column ? column : 0, row, 100);
    const markerId = session.addMarker(markerRange, "error-line-marker", "screenLine", false);
    this.markerIds.push(markerId);
    session.addGutterDecoration(row, "error-line-gutter");
    this.decorations.push([row, "error-line-gutter"]);
  }
  _run() {
    const { scriptContents } = this.state;
    const { engine } = this.context;
    const { activeScriptId } = this.props;
    const player = engine.controllingEntity;
    const exSpeed = this.state.executionSpeed;
    engine.scriptExecutionContext.runScript(
      scriptContents,
      player,
      exSpeed,
      activeScriptId
    );
  }
  _pause() {
    const { activeScriptId } = this.props;
    const { engine } = this.context;
    engine.scriptExecutionContext.pauseScript(activeScriptId);
  }
  _step() {
    const { activeScriptId } = this.props;
    const { engine } = this.context;
    engine.scriptExecutionContext.stepScript(activeScriptId);
  }
  _resume() {
    const { activeScriptId } = this.props;
    const { engine } = this.context;
    engine.scriptExecutionContext.resumeScript(activeScriptId);
  }
  _stop() {
    const { activeScriptId } = this.props;
    const { engine } = this.context;
    engine.scriptExecutionContext.stopScript(activeScriptId);
  }
  _save() {
    const { dispatch } = this.props;
    const { scriptContents } = this.state;
    dispatch(openSaveScriptMenu(scriptContents));
  }
  _load() {
    const { dispatch } = this.props;
    dispatch(openLoadScriptMenu());
  }

  // hax
  _resetPlayerMana() {
    const { engine } = this.context;
    const player = engine.controllingEntity;
    player.incrementMana(999);
  }
}

/**
 * Mapping from Redux store to passed props - does the heavy lifting
 */
function mapStateToProps(state) {
  const { scripts } = state;
  const { focusedScriptId, activeScripts, loadedScript } = scripts;

  let activeScriptId = null;
  let activeScriptContents = null;
  let running = false;
  let paused = false;
  let finished = false;
  let currentLine = null;
  let runTimeError = null;
  let compileTimeError = null;
  let terminatedSuccessfully = false;

  if (focusedScriptId) {
    const activeScript = activeScripts[focusedScriptId];
    if (activeScript) {
      activeScriptId = activeScript.scriptId;
      activeScriptContents = activeScript.scriptContents;
      running = activeScript.running;
      paused = activeScript.paused;
      finished = activeScript.finished;
      currentLine = activeScript.currentLine;
      runTimeError = activeScript.runTimeError;
      compileTimeError = activeScript.compileTimeError;
      terminatedSuccessfully = activeScript.finished;
    }
  }

  return {
    loadedScript,
    activeScriptId,
    activeScriptContents,
    running,
    paused,
    finished,
    currentLine,
    runTimeError,
    compileTimeError,
    terminatedSuccessfully,
  };
}

export default connect(mapStateToProps)(CodeExecutor);
