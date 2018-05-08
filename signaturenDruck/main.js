const electron = require("electron");
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const ipc = require("electron").ipcMain;
const path = require("path");
const url = require("url");
const fs = require("fs");

const Store = require("electron-store");
const store = new Store({cwd: "C:\\Export\\"});

// name of signature storage json
const sigJSON = "signaturen.json";

const username = require("username");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
    checkConfig();
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600});

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true
    }));
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
        mainWindow = null;
        deleteJSON();
    });
}

// deletes the signature storage json
function deleteJSON() {
    if (fs.existsSync(sigJSON)) {
        fs.unlink(sigJSON, function (err){
            if (err) {
                throw err;
            } else {
                console.log(sigJSON + " wurde geloescht");
            }
        });
    }
}

// checks if config file exists, else creates one
function checkConfig() {
    if (fs.existsSync("C:\\Export\\config.json")) {
        if (!store.has("default")) {
            createConfig();
        }
    } else {
        createConfig();
    }
}

// creates new config.json
function createConfig() {
    let config = {
        "testKey": "Don't panic, this is just a test",
        "default": "C://Export//download.dnl",
        "gross": {
            "drucker": "\\\\ulbw2k812\\ulbps101",
            "label": {
                "width": 99.47,
                "height": 48.42
            }
        },
        "klein": {
            "drucker": "\\\\ulbw2k812\\ulbps124",
            "label": {
                "width": 74,
                "height": 23
            }
        },
        "einheit": "mm"
    };
    store.set(config);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

ipc.on("print", function(event, data){
    let win = null;
    console.log(data);
    win = new BrowserWindow({width: 800, height: 600, show: false });
    win.loadURL(url.format({
        pathname: path.join(__dirname, "print.html"),
        protocol: "file:",
        slashes: true
    }));
    // Could be redundant, try if you need this.
    // win.once("ready-to-show", () => {
    //     // createPDF();
    //     win.hide();
    // });
    username().then(username => {
        console.log(username);
    });
    win.once("ready-to-show", () => {
        win.webContents.send("toPrint", data);
        win.show();
    });

    win.webContents.session.on("will-download", (event, item, webContents) => {
        item.setSavePath("C:\\Export\\myfile.pdf");
    });

    /* print it
    // win.once("ready-to-show", () => win.hide());
    // // load PDF.
    // win.loadURL("file://D:/myfile.pdf");
    // // if pdf is loaded start printing.
    // win.webContents.on("did-finish-load", () => {
    //     let printer = win.webContents.getPrinters();
    //     console.log(printer);
    //     win.webContents.print({silent: false, deviceName: "ulbps155"});
    //     // close window after print order.
    //     win = null;
    // });
    */

});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
