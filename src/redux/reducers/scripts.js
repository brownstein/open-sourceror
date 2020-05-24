import {
  EXECUTION_STARTED,
  EXECUTION_FINISHED,

  CONTINUING_EXECUTION,
  COMPILETIME_ERROR,
  RUNTIME_ERROR,

  ACTIVE_SCRIPT_CHANGED,
  ACTIVE_SCRIPT_RUN
} from "../constants/scripts";

const DEFAULT_STATE = {
  activeScriptName: "",
  activeScriptContents: null,
  running: false,
  currentLine: null,
  runTimeError: null,
  compileTimeError: null,
  terminatedSuccessfully: false
};

export default function scriptsReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case EXECUTION_STARTED:
      return {
        ...state,
        running: true,
        currentLine: action.currentLine || 0,
        runTimeException: null,
        compileTimeException: null
      };
    case EXECUTION_FINISHED:
      return {
        ...state,
        running: false,
        currentLine: null,
        terminatedSuccessfully: true
      };
    case CONTINUING_EXECUTION:
      return {
        ...state,
        currentLine: action.currentLine
      };
    case COMPILETIME_ERROR:
      return {
        ...state,
        running: false,
        compileTimeError: action.error
      };
    case RUNTIME_ERROR:
      return {
        ...state,
        running: false,
        runTimeError: action.error
      };
    case ACTIVE_SCRIPT_CHANGED:
      return {
        ...state,
        activeScriptContents: action.activeScript
      };
    case ACTIVE_SCRIPT_RUN:
      return {
        ...state,
        running: true
      };
    default:
      break;
  }
  return state;
}
