#!/usr/bin/env electron
"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const commander = require("commander");
const fs = require("fs");
const path = require("path");
const url = require("url");

// grab command line args
const cmdArgs = {};
try {
  commander
  .option("--dev", "open DevTools")
  .action(({ dev }) => Object.assign(cmdArgs, { dev }));
  commander.parse(process.argv.filter(a => typeof a === "string"));
}
catch (ex) {
  // do nothing
}

// commander won't fire its action clause without a file argument
cmdArgs.dev = cmdArgs.dev || commander.dev;

// need global reference to prevent GC deref
let mainWindow;
function createWindow () {

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
    // install developer tools
    const electronDevtoolsInstaller = require("electron-devtools-installer");
    const installExtension = electronDevtoolsInstaller.default;
    const {
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS
    } = electronDevtoolsInstaller;
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
