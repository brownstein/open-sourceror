import { useState } from "react";
import shortid from "shortid";

import {
  executionStarted,
  executionFinished,
  continuingExecution,
  compileTimeError,
  runtimeError,
  activeScriptChanged,
  activeScriptRun,

  setFocusedScript,
  updateScriptStates,
} from "src/redux/actions/scripts";

import ScriptRunner from "./index";

export class RunningScript {
  constructor({
    engine,
    scriptName,
    scriptRunner,
    targetEntity
  }) {
    this.engine = engine;
    this.id = shortid(),
    this.scriptName = scriptName;
    this.scriptContents = scriptRunner.sourceScript;
    this.scriptRunner = scriptRunner;
    this.targetEntity = targetEntity;
    this.executionSpeed = 0.01,
    this.executionTimeDelta = 0,
    this.running = true,
    this.finished = false;
    this.currentLine = null,
    this.transpileError = null,
    this.runtimeError = null
  }
  static withTranspileError({
    scriptName,
    scriptRunner,
    transpileError
  }) {
    const rs = new RunningScript({
      scriptName,
      scriptRunner
    });
    rs.running = false;
    rs.transpileError = transpileError;
    return rs;
  }
  /**
   * If currently running, perform operations at timeDelta * executionSpeed
   */
  _continueRunning(timeDelta) {
    if (!this.running) {
      return false;
    }
    this.executionTimeDelta += timeDelta * this.executionSpeed;
    const engine = this.engine;
    let anythingHappened = false;
    try {
      while (this.executionTimeDelta > 1) {
        this.executionTimeDelta += -1;
        let start = null;
        let exCap = 0;
        while (
          !start &&
          this.scriptRunner.hasNextStep() &&
          exCap++ < 1000
        ) {
          anythingHappened = true;
          this.scriptRunner.doCurrentLine();
          const exSection = this.scriptRunner.getExecutingSection();
          [start] = exSection;
        }
        this.currentLine = this.scriptRunner.getExecutingLine();
      }
    }
    catch (ex) {
      console.error("script exception", ex);
      this.runtimeError = ex;
      this.running = false;
      return true;
    }

    if (this.scriptRunner.hasCompletedExecution()) {
      this.running = false;
      this.finished = true;
      this.scriptRunner.cleanup();
      return true;
    }

    return anythingHappened;
  }
}

// list of reserved script names that can't be used
const RESERVED_SCRIPT_NAMES = {
  fire: 1
};

export class ScriptExecutionContext {
  constructor(engine) {
    this.engine = engine;
    this.runningScripts = [];
  }
  /**
   * Method to run on each frame of the game
   */
  onFrame(timeDelta) {
    if (!this.engine.running) {
      return;
    }
    let anythingHappened = false;
    this.runningScripts.forEach(s => {
      const didAnything = s._continueRunning(timeDelta);
      if (didAnything) {
        anythingHappened = true;
      }
    });
    if (anythingHappened) {
      this.engine.dispatch &&
      this.engine.dispatch(updateScriptStates(this));
    }
  }
  /**
   * Runs a script with a given name
   */
  async runScript(scriptSrc, runningEntity) {
    this._flushInactiveScripts();

    const engine = this.engine;
    const scriptName = `scr-${shortid()}`;
    const scriptRunner = new ScriptRunner(
      scriptSrc,
      engine,
      runningEntity
    );
    try {
      await scriptRunner.readyPromise;
    }
    catch (err) {
      // todo handle gracefully
      console.error(err);

      // not a compile time error
      if (!err.loc) {
        return;
      }

      engine.dispatch &&
      engine.dispatch(compileTimeError(err));

      // experimental - push broken script onto execution state
      const exState = RunningScript.withTranspileError({
        scriptName,
        scriptRunner,
        transpileError: err
      });
      this.runningScripts.push(exState);
      engine.dispatch &&
      engine.dispatch(updateScriptStates(this, exState.id));

      throw err;
    }

    const exState = new RunningScript({
      engine,
      scriptName,
      scriptRunner,
      targetEntity: runningEntity
    });

    this.runningScripts.push(exState);

    // update script states in the engine
    engine.dispatch &&
    engine.dispatch(updateScriptStates(this, exState.id));

    return exState;
  }
  stopScript(scriptName) {
    const engine = this.engine;
    const stopped = this.runningScripts.find(s => s.scriptName === scriptName);
    stopped.running = false;
    this.runningScripts = this.runningScripts.filter(s => s => stopped);
    engine.dispatch &&
    engine.dispatch(updateScriptStates(this));
    return stopped;
  }
  getRunningScripts() {
    return this.runningScripts;
  }
  _flushInactiveScripts() {
    this.runningScripts = this.runningScripts.filter(s => {
      if (s.finished) {
        return false;
      }
      if (s.runTimeError) {
        return false;
      }
      if (s.transpileError) {
        return false;
      }
      return true;
    });
  }
}
