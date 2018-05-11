const electron = require("electron");
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const ipc = require("electron").ipcMain;
const path = require("path");
const url = require("url");
const fs = require("fs");

const store = require("electron-store");
const config = new store({cwd: "C:\\Export\\"});

const configNew = {
    "testKey": "Don't panic, this is just a test",
    "defaultPath": "C://Export//download.dnl",
    "big": {
        "printer": "\\\\ulbw2k812\\ulbps101",
        "label": {
            "width": 99.47,
            "height": 48.42
        }
    },
    "small": {
        "printer": "\\\\ulbw2k812\\ulbps124",
        "label": {
            "width": 74,
            "height": 23
        }
    },
    "unit": "mm"
};

// name of signature storage json
const sigJSON = "signaturen.json";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let win = null;

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
        if (!config.has("defaultPath")) {
            createConfig();
        }
    } else {
        createConfig();
    }
}

// creates new config.json
function createConfig() {
    config.set(configNew);
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
    console.log(data);
    win = new BrowserWindow({width: 800, height: 600, show: false });
    win.loadURL(url.format({
        pathname: path.join(__dirname, "print.html"),
        protocol: "file:",
        slashes: true
    }));
    // win.loadURL("file:\\\\C:\\Export\\myfile.pdf");
    win.once("ready-to-show", () => {
        win.webContents.send("toPrint", data);
        win.show();
        /* navtive windows printer
        // lists all available printers
        console.log("available printers", win.webContents.getPrinters());
        // prints the whole window (silently)
        win.webContents.print({"silent": true, "name": "\\\\printsrv.ulb.uni-jena.de\\ulbps155"});
        */
    });

    // win.webContents.session.on("will-download", (event, item, webContents) => {
    //     item.setSavePath("C:\\Export\\test.pdf");
    // });


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

ipc.on("printSize", function(event, data){
    if (data == "big"){
        win.webContents.session.on("will-download", (event, item, webContents) => {
            item.setSavePath("C:\\Export\\big.pdf");
        });
    }
    if (data == "small"){
        win.webContents.session.on("will-download", (event, item, webContents) => {
            item.setSavePath("C:\\Export\\small.pdf");
        });
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
