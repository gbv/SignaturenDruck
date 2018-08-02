const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const ipc = require('electron').ipcMain
const path = require('path')
const url = require('url')
const fs = require('fs')
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\'})
const cmd = require('node-cmd')

const configNew = {
  'testKey': "Don't panic, this is just a test",
  'defaultPath': 'C://Export/download.dnl',
  'big': {
    'printer': '\\\\ulbw2k812\\ulbps101',
    'label': {
      'width': 99.47,
      'height': 48.42
    }
  },
  'small': {
    'printer': '\\\\ulbw2k812\\ulbps124',
    'label': {
      'width': 74,
      'height': 23
    }
  },
  'unit': 'mm',
  'printToPdf': true
}

// name of signature storage json
const sigJSON = 'signaturen.json'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let savedData

// creates the mainWindow
function createWindow () {
  checkConfig()
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 580})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    deleteJSON()
  })
}

// deletes the signature storage json
function deleteJSON () {
  if (fs.existsSync(sigJSON)) {
    fs.unlink(sigJSON, function (err) {
      if (err) {
        throw err
      } else {
        console.log(sigJSON + ' wurde geloescht')
      }
    })
  }
}

// checks if config file exists, else creates one
function checkConfig () {
  if (fs.existsSync('C:\\Export\\config.json')) {
    if (!config.has('defaultPath')) {
      createConfig()
    }
  } else {
    createConfig()
  }
}

// creates new config.json
function createConfig () {
  config.set(configNew)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// starts the printing process
ipc.on('print', function (event, data) {
  // console.log(data)
  savedData = data
  if (savedData.big) {
    // console.log(savedData.big)
    printBig(savedData.big)
  }
  if (savedData.small) {
    printSmall(savedData.small)
  }
})

// closes the application
ipc.on('close', function (event) {
  mainWindow.close()
  app.quit()
})

function printBig (data) {
  let winBig = null
  let i = 0
  winBig = new BrowserWindow({ heihgt: 225, width: 500, show: false })
  winBig.loadURL(url.format({
    pathname: path.join(__dirname, 'print.html'),
    protocol: 'file:',
    slashes: true
  }))
  winBig.once('ready-to-show', () => {
    winBig.webContents.send('toPrint', data)
    // generated pdf prints fine if printed manually using Adobe Reader
    // Tested with Adobe Acrobat X Pro
    winBig.webContents.printToPDF({marginsType: 2, landscape: true, pageSize: { width: 48920, height: 99970 }}, (error, data) => {
      if (error) throw error
      fs.writeFile('./tmp/printBig.pdf', data, (error) => {
        if (error) throw error
        console.log('Write PDF successfully')
        // doesn't work atm, only prints a black box
        // let winPreview = new BrowserWindow({ webPreferences: {plugins: true} })
        // winPreview.once('ready-to-show', () => winPreview.hide(), console.log('ready-to-show'))
        // winPreview.loadURL(path.join(__dirname, '/tmp/printBig.pdf'))
        // console.log('load url')
        // winPreview.webContents.on('did-finish-load', () => {
        //   console.log('print content')
        //   winPreview.webContents.print({'silent': false, 'deviceName': '\\\\ulbw2k812\\ulbps101'})
        // })
      })
    })
    winBig.show()
    // // printing with SumatraPDF via node-cmd
    // // currently not working as SumatraPDF turns the page (y < x)
    // // landscape printing option is planned and comming soon (not in version SumatraPDF-prerelease-10766.exe)
    // cmd.get(
    //   '"C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe" -print-to "\\\\ulbw2k812\\ulbps101" -print-settings "1,noscale" "C:\\printBig_ref.pdf"',
    //   function (err, data, stderr) {
    //     if (!err) {
    //       console.log('all good ', data)
    //     } else {
    //       console.log('error ', err)
    //     }
    //   })
    // // native printer dialog
    // // currently not working as the printer doesn't like the format
    // if (config.store.printToPdf !== true) {
    // console.log('native print big')
    // // lists all available printers
    // console.log('available printers', winBig.webContents.getPrinters());
    // // prints the whole window (silently)
    // winBig.webContents.print({'silent': false, 'deviceName': '\\\\printsrv.ulb.uni-jena.de\\ulbps155'})
    // winBig.webContents.print({'silent': false, 'deviceName': '\\\\ulbw2k812\\ulbps101'})
    // }
    winBig = null
    // }
  })
}
function printSmall (data) {
  let winSmall = null
  winSmall = new BrowserWindow({width: 800, height: 600, show: false})
  winSmall.loadURL(url.format({
    pathname: path.join(__dirname, 'print.html'),
    protocol: 'file:',
    slashes: true
  }))
  winSmall.once('ready-to-show', () => {
    winSmall.webContents.send('toPrint', data)
    winSmall.webContents.printToPDF({marginsType: 2, landscape: true, pageSize: { width: 48920, height: 99970 }}, (error, data) => {
      if (error) throw error
      fs.writeFile('./tmp/printSmall.pdf', data, (error) => {
        if (error) throw error
        console.log('Write PDF successfully')
      })
    })
    if (config.store.printToPdf !== true) {
      console.log('native print small')
      // winSmall.webContents.print({"silent": true, "deviceName": "\\\\printsrv.ulb.uni-jena.de\\ulbps155"});
    }
    winSmall = null
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
