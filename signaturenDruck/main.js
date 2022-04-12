const THULBBUILD = false
const CONFIGVERSION = 1
const { BrowserWindow, app, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const _ = require('lodash')
const Store = require('electron-store')
const C = require('./js/classes/Config')
const Printer = require('pdf-to-printer')
// requires the username-module
const username = require('username')
// const defaultProgramPath = 'C:/Users/' + username.sync() + '/SignaturenDruck/'

const defaultProgramPath = new C(THULBBUILD).defaultPath
// Use a default path
const config = new Store({ cwd: defaultProgramPath })

// needed for the old printing code
// const Shell = require('node-powershell')

require('electron-context-menu')({
  prepend: (params, BrowserWindow) => [{
    visible: false
  }],
  labels: {
    cut: 'Ausschneiden',
    copy: 'Kopieren',
    paste: 'Einfügen'
  }
})

// default main config settings
const configNew = {
  defaultDownloadPath: 'C:/Export/download.dnl',
  sortByPPN: false,
  useK10plus: true,
  hideDeleteBtn: false,
  showMenu: false,
  filterByLoc: false,
  example: {
    shelfmark: 'PÄD:TG:1420:Dan::2017',
    location: 'MAG',
    regex: '^(.*):(.*):(.*):(.*):(.*):(.*)$',
    delimiter: ':'
  },
  modal: {
    showModal: true,
    modalTxt: 'Die ausgewählten Signaturen wurden gedruckt.'
  },
  SRU: {
    useSRU: false,
    printImmediately: false,
    SRUAddress: 'http://sru.k10plus.de/opac-de-27',
    QueryPart1: '?version=1.1&operation=searchRetrieve&query=pica.bar=',
    QueryPart1EPN: '?version=1.1&operation=searchRetrieve&query=pica.epn=',
    QueryPart2: '&maximumRecords=1&recordSchema=picaxml'
  },
  print: {
    printCoverLabel: true,
    reverseOrder: false,
    showPrintDialog: false,
    orientation: 'landscape',
    scale: 'noscale'
  },
  mode: {
    defaultMode: 'defaultMode'
  },
  devMode: false
}

const template = [
  {
    label: 'Datei',
    submenu: [
      {
        label: 'Schließen',
        role: 'close'
      }
    ]
  },
  {
    label: 'Bearbeiten',
    submenu: [
      {
        label: 'Modus',
        accelerator: 'Control+Shift+C',
        click () {
          createConfigWindow()
        }
      },
      {
        label: 'Format',
        accelerator: 'Control+Shift+E',
        click () {
          createEditorWindow()
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)

// name of signature storage json
const sigJSONFile = 'signaturen.json'

const DataFromSRU = require('./js/classes/DataFromSRU.js')
const sruData = new DataFromSRU()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, manualSignaturesWindow, configWindow, editorWindow

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

// starts the printing process
ipcMain.on('print', (event, dataAll, printImmediately = false) => {
  let i = 1
  const nrOfFormats = dataAll.length

  _.each(dataAll, (data) => {
    let last = false
    // console.warn(data.formatInformation)
    // console.warn(data.printInformation)
    if (nrOfFormats === i) {
      last = true
    }
    setTimeout(function () {
      printData(data.formatInformation, data.printInformation, printImmediately, last)
    }, (i * 1000))
    i++
  })
})

app.on('close', () => {
  mainWindow.close()
  mainWindow = null
  manualSignaturesWindow.close()
  manualSignaturesWindow = null
  configWindow.close()
  configWindow = null
  editorWindow.close()
  editorWindow = null
  app.quit()
})

// closes the application
ipcMain.on('close', function (event) {
  mainWindow.close()
  mainWindow = null
  app.quit()
})

// listens on openManualSignaturesWindow, invokes the opening process
ipcMain.on('openManualSignaturesWindow', function (event, data, edit = false, manId) {
  createManualSignaturesWindow(data, edit, manId)
})

// TODO REFATOR
// listens on closeManual, closes the manualSignaturesWindow and invokes the removeManual process
ipcMain.on('closeManualSignaturesWindow', function (event) {
  manualSignaturesWindow.close()
  manualSignaturesWindow = null
  /*
  mainWindow.webContents.send('removeManualSignatures')
  */
})

// new function to replace closeManualSignaturesWindow & saveManualSignatures
ipcMain.on('closeManualWindow', function (event, data = null) {
  manualSignaturesWindow.close()
  manualSignaturesWindow = null
  if (data != null) {
    mainWindow.webContents.send('addManualSignatuers', data)
  }
})

// listens on saveManualSignatures, closes the manualSignaturesWindow and passes the data along
ipcMain.on('addManualData', function (event, data) {
  mainWindow.webContents.send('addManualSignatures', data)
})

// listens on saveManualSignatures, closes the manualSignaturesWindow and passes the data along
ipcMain.on('saveManualSignatures', function (event, data) {
  manualSignaturesWindow.close()
  manualSignaturesWindow = null
  mainWindow.webContents.send('addManualSignatures', data)
})

// listens on loadFromSRU, invokes the loadAndAddFromSRU function with the provided barcode
ipcMain.on('loadFromSRU', function (event, key, mode) {
  if (key !== '') {
    sruData.loadData(key, mode).then(function (data) {
      mainWindow.webContents.send('addSRUdata', data, key, mode)
    })
  }
})

ipcMain.on('newConfig', function (event) {
  mainWindow.reload()
})

// listens on openConfigWindow, invokes the createConfigWindow function
ipcMain.on('openConfigWindow', function (event) {
  createConfigWindow()
})

// listens on closeWinConfig, invokes the closeWinConfig function
ipcMain.on('closeConfigWindow', function (event) {
  closeConfigWindow()
})

// listens on createNewModeFormat, invokes the createEditorWindows function
ipcMain.on('createNewModeFormat', function (event, data) {
  createEditorWindow(data)
})

function closeConfigWindow () {
  configWindow.close()
  configWindow = null
}

// listens on openConfigWindow, invokes the createEditorWindow function
ipcMain.on('openEditorWindow', function (event) {
  createEditorWindow()
})

// listens on closeEditorWindow, invokes the closeEditorWindow function
ipcMain.on('closeEditorWindow', function (event) {
  closeEditorWindow()
})

function closeEditorWindow () {
  editorWindow.close()
  editorWindow = null
}

function windowParams (width = 850, height = 570, show = true) {
  return {
    width: width,
    height: height,
    show: show,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nativeWindowOpen: true
    }
  }
}

// creates the mainWindow
function createWindow () {
  checkConfig()
  /*
  Pass config STORE as global variable to all other js files
   */
  config.set('username', username.sync())
  config.set('defaultProgramPath', defaultProgramPath)

  // check if config is up-to-date
  if (!config.has('configVersion')) {
    updateConfig()
  } else if (config.get('configVersion') < CONFIGVERSION) {
    updateConfig()
  }

  // checkDir('./tmp')
  checkDir(defaultProgramPath)
  checkDir(defaultProgramPath + '\\Formate')
  checkDir(defaultProgramPath + '\\FormateCSS')
  checkDir(defaultProgramPath + '\\Modi')

  const options = windowParams()
  options.backgroundColor = '#f0f0f0'
  options.webPreferences.preload = path.join(__dirname, 'js\\renderer.js')

  if (config.store.devMode) {
    options.height = 600
  }

  mainWindow = new BrowserWindow(options)
  mainWindow.removeMenu()
  const printerNames = []
  _.forEach(mainWindow.webContents.getPrinters(), function (printer) {
    printerNames.push(printer.name)
  })
  config.set('print.printerList', printerNames)
  if (config.store.showMenu) {
    Menu.setApplicationMenu(menu)
  }
  // set the mainwindow title (name + version from package.json)
  mainWindow.setTitle('Signaturendruck v' + app.getVersion())
  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/html/index.html'),
    protocol: 'file:',
    slashes: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  }))
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
    manualSignaturesWindow = null
    configWindow = null
    editorWindow = null
    deleteJSON()
  })
  if (config.store.devMode) {
    // open dev-tools
    mainWindow.webContents.openDevTools()
  }
}

// deletes the signature storage json
function deleteJSON () {
  if (fs.existsSync(sigJSONFile)) {
    fs.unlink(sigJSONFile, function (err) {
      if (err) {
        throw err
      }
    })
  }
}

// checks if config file exists, else creates one
function checkConfig () {
  if (fs.existsSync(defaultProgramPath + '\\config.json')) {
    if (!config.has('defaultDownloadPath')) {
      fs.renameSync(defaultProgramPath + '\\config.json', defaultProgramPath + '\\config_invalid.json')
      dialog.showErrorBox('Die Konfigurationsdatei:\n    ' + defaultProgramPath + '\\config.json\nwar fehlerhaft und wurde in config_invalid.json umbenannt.\n\nDas Programm hat zum Start eine valide Standardversion erstellt.', '')
      createConfig()
    }
  } else {
    createConfig()
  }
  if (config.get('mode.defaultMode') === 'thulbMode') {
    createModeFiles('thulbMode', ['thulb_gross', 'thulb_klein', 'thulb_klein_1'])
  } else if (config.get('mode.defaultMode') === 'defaultMode') {
    createModeFiles('defaultMode', ['default_klein', 'default_gross'])
  }
}

function createModeFiles (modeName, subModeNames) {
  checkAndCreate(defaultProgramPath + '\\Modi\\', modeName, '.json')
  subModeNames.forEach(fileName => {
    checkAndCreate(defaultProgramPath + '\\Formate\\', fileName, '.json')
    checkAndCreate(defaultProgramPath + '\\FormateCSS\\', fileName, '.css')
  })
}

function checkAndCreate (pathName, fileName, ending) {
  if (!fs.existsSync(pathName + fileName + ending)) {
    const file = fs.readFileSync(path.join(__dirname, 'defaultFiles/' + fileName + ending), 'utf8')
    fs.writeFileSync(pathName + fileName + ending, file, 'utf8')
  }
}

// creates directory (if not already there)
function checkDir (path) {
  try {
    fs.mkdirSync(path)
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}

// creates new config.json
function createConfig () {
  config.set(configNew)
}

function printData (formatInformation, printInformation, printImmediately, last = false) {
  let winPrint = null
  const options = windowParams(899, 900, false)

  winPrint = new BrowserWindow(options)
  winPrint.loadURL(url.format({
    pathname: path.join(__dirname, 'html/print.html'),
    protocol: 'file:',
    slashes: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  }))
  winPrint.removeMenu()
  winPrint.once('ready-to-show', () => {
    winPrint.webContents.send('toPrint', formatInformation, printInformation, printImmediately, last)
    /*
    if (config.store.devMode) {
      winPrint.show()
    }
    */
  })
}

ipcMain.on('readyToPrint', function (event, formatInformation, printImmediately, last) {
  const winPrint = BrowserWindow.fromWebContents(event.sender)
  winPrint.webContents.printToPDF({ marginsType: 1, landscape: true, pageSize: { height: formatInformation.paper.width, width: formatInformation.paper.height } }).then(data => {
    const fileName = formatInformation.name + new Date().getTime() + '.pdf'
    const fullPath = defaultProgramPath + '\\' + fileName
    fs.writeFile(fullPath, data, (error) => {
      if (error) throw error
      const options = {
        printer: formatInformation.printer,
        printDialog: config.get('print.showPrintDialog'),
        orientation: config.get('print.orientation'),
        scale: config.get('print.scale')
      }
      if (!printImmediately) {
        mainWindow.webContents.send('printMsg', last)
      }
      if (!config.store.devMode) {
        Printer.print(fullPath, options).then(
          unlinkFile(fullPath)
        )
      } else {
        options.printDialog = true
        Printer.print(fullPath, options).then(console.log)
      }
    })
  }).catch(error => {
    console.log(error)
  })
})

function unlinkFile (path) {
  setTimeout(function () {
    try {
      fs.unlinkSync(path)
    } catch (error) {
      if (error.code === 'EBUSY') {
        mainWindow.webContents.send('couldNotDelete', defaultProgramPath)
      } else {
        throw error
      }
    }
  }, 10000)
}

// creates the manualSignaturesWindow
function createManualSignaturesWindow (objMan, edit, manId) {
  const options = windowParams(650, 420, false)

  manualSignaturesWindow = new BrowserWindow(options)
  manualSignaturesWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html/manual.html'),
    protocol: 'file',
    slashes: true
  }))
  manualSignaturesWindow.removeMenu()
  manualSignaturesWindow.once('ready-to-show', () => {
    manualSignaturesWindow.show()
    manualSignaturesWindow.webContents.send('objMan', objMan, edit, manId)
  })
}

// creates the configWindow
function createConfigWindow () {
  const options = windowParams(800, 950, false)

  configWindow = new BrowserWindow(options)
  configWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html/config.html'),
    protocol: 'file',
    slashes: true,
    contextIsolation: false,
    nodeIntegration: true
  }))
  configWindow.removeMenu()
  configWindow.once('ready-to-show', () => {
    configWindow.show()
  })
}

// creates the editorConfig
function createEditorWindow (formatName = '', nrOfLines = '') {
  const options = windowParams(800, 950, false)

  editorWindow = new BrowserWindow(options)
  editorWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html/editor.html'),
    protocol: 'file',
    slashes: true,
    contextIsolation: false,
    nodeIntegration: true
  }))
  editorWindow.removeMenu()
  editorWindow.once('ready-to-show', () => {
    editorWindow.show()
    editorWindow.webContents.send('newModeFormat', formatName, nrOfLines)
  })
}

// update config
function updateConfig () {
  if (!config.has('sigJSONFile')) {
    config.set('sigJSONFile', sigJSONFile)
  }
  if (!config.has('print.reverseOrder')) {
    config.set('print.reverseOrder', false)
  }
  if (!config.has('print.showPrintDialog')) {
    config.set('print.showPrintDialog', false)
  }
  if (!config.has('print.orientation')) {
    config.set('print.orientation', 'landscape')
  }
  if (!config.has('print.scale')) {
    config.set('print.scale', 'noscale')
  }
  config.set('configVersion', CONFIGVERSION)
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
