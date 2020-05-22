#!/usr/bin/env electron
"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const electronDevtoolsInstaller = require("electron-devtools-installer");
const commander = require("commander");
const fs = require("fs");
const path = require("path");
const url = require("url");

// install developer tools
const installExtension = electronDevtoolsInstaller.default;
const {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS
} = electronDevtoolsInstaller;

// grab command line args
const cmdArgs = {};
commander
.option("--dev", "open DevTools")
.action(({ dev }) => Object.assign(cmdArgs, { dev }));
commander.parse(process.argv);

// commander won't fire its action clause without a file argument
cmdArgs.dev = cmdArgs.dev || commander.dev;

// loader for specified file
function loadTargetFile(targetFileName) {
  return new Promise((resolve) => {
    fs.readFile(targetFileName, (err, buff) => {
      if (err) {
        global.console.error(err);
        process.exit(1);
      }
      try {
        resolve(JSON.parse(buff));
      }
      catch (err) {
        global.console.error(err);
        process.exit(1);
      }
    });
  });
}

// need global reference to prevent GC deref
let mainWindow;
function createWindow () {

  // kick off loading he target file
  let fileLoadStub;
  if (cmdArgs.file) {
    fileLoadStub = loadTargetFile(cmdArgs.file);
  }

  const windowLoadStub = new Promise((resolve) => {
    ipcMain.on("renderer-ready", (event, msg) => {
      resolve(msg || "renderer-ready");
    });
    ipcMain.on("renderer-failure", (event, msg) => {
      mainWindow = null;
      global.console.error(msg);
      process.exit(1);
    });
  });

    // init all the things
  mainWindow = new BrowserWindow({
    width: cmdArgs.dev ? 1000 : 700,
    height: cmdArgs.dev ? 700 : 700,
    title: cmdArgs.file ? `Open Sourceror - ${cmdArgs.file}` : "Open Sourceror",
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    }
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }));

  if (cmdArgs.dev) {
    app.whenReady().then(async () => {
      await installExtension(REACT_DEVELOPER_TOOLS);
      await installExtension(REDUX_DEVTOOLS);
    });
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", function () {
    mainWindow = null;
    process.exit(0);
  });

  ipcMain.on("finished", function () {
    mainWindow = null;
    process.exit(0);
  });

  // UNUSED
  // when file and window are loaded, send file to window
  let fileContents;
  if (fileLoadStub) {
    Promise.all([
      windowLoadStub,
      fileLoadStub.then(contents => fileContents = contents)
    ])
    .then(() => {
      mainWindow.webContents.send("load-file", {
        fileContents,
        fileName: cmdArgs.file && path.basename(cmdArgs.file),
        filePath: cmdArgs.file
      });
    })
    .catch(e => {
      global.console.error(e);
    });
  }
}

// this method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", createWindow);

// quit when all windows are closed.
app.on("window-all-closed", function () {
  app.quit();
});

app.on("activate", async function () {
  if (mainWindow === null) {
    createWindow();
  }
});
