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

import { EngineContext } from "./engine";
import {
  executionStarted,
  executionFinished,
  continuingExecution,
  compileTimeError,
  runTimeError,
  activeScriptChanged,
  activeScriptRun
} from "src/redux/actions/scripts";

import "./code-executor.less";

// source script to run - this gets transpiled from ES6 to normal ES5, then
// run inside of a JS-based JS interpreter so that it is totally sandboxed
const srcScript =
`"use strict";
// const fire = require("fire");
while (true) {
  fire();
}
`;

class CodeExecutor extends Component {
  static contextType = EngineContext;
  constructor() {
    super();
    this.state = {
      runningScriptInstance: null,
      scriptContents: srcScript,
      editorSize: { width: 400, height : 400 },
    };
    this.exSpeed = 0.15;

    // editor instance
    this.editor = null;

    // execution and markup state
    this.annotated = false;
    this.decorations = [];
    this.markerIds = [];

    // DOM element
    this.editorContainerEl = null;

    this._loadEditor = this._loadEditor.bind(this);
    this._onChange = this._onChange.bind(this);
    this._run = this._run.bind(this);
    this._stop = this._stop.bind(this);
    this._onResize = this._onResize.bind(this);
  }
  componentDidMount() {
    window.addEventListener("resize", this._onResize);
    this._onResize();
    const { dispatch } = this.props;
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
      running
    } = this.props;
    const {
      runningScriptInstance,
      scriptContents,
      editorSize
    } = this.state;
    const errors = [];
    const { width, height } = editorSize;
    return (
      <div className="code-executor">
        <div className="toolbar">
          <button onClick={this._run} disabled={running}>run</button>
          <button onClick={this._stop} disabled={!running}>stop</button>
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
  componentDidUpdate(prevProps) {
    const props = this.props;
    const editor = this.editor;
    console.log('U', props);
  }
  _onChange(scriptContents) {
    this._clearMarkings();
    this.setState({ scriptContents });
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
    this.markerIds = [];
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
    const markerId = session.addMarker(markerRange, "terminated-line-marker", "screenLine", false);
    this.markerIds.push(markerId);
  }
  async _run() {
    const { dispatch } = this.props;
    const { scriptContents } = this.state;
    const engine = this.context;
    const player = engine.activeEntities[0];
    dispatch(activeScriptChanged(scriptContents));
    dispatch(activeScriptRun());
    const runningScript = await engine.scriptExecutionContext.runScript(scriptContents, player);
    console.log(runningScript);
    dispatch(executionStarted());
  }
  _stop() {
    const { dispatch, activeScriptName } = this.props;
    const engine = this.context;
    engine.scriptExecutionContext.stopScript(activeScriptName);
    dispatch(executionFinished());
  }
}

function mapStateToProps(state) {
  const { scripts } = state;
  const {
    activeScriptName,
    activeScriptContents,
    running,
    currentLine,
    runTimeException,
    compileTimeException,
  } = scripts;
  return {
    activeScriptName,
    activeScriptContents,
    running,
    currentLine,
    runTimeException,
    compileTimeException,
  };
}

export default connect(mapStateToProps)(CodeExecutor);
