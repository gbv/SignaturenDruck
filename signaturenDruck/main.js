const { BrowserWindow, app, ipcMain, dialog } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const _ = require('lodash')
const Store = require('electron-store')

const defaultProgramPath = 'C:\\SignaturenDruck'
// Use a default path
const config = new Store({ cwd: defaultProgramPath })

const Shell = require('node-powershell')

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
  defaultFormat: 'thulb_gross',
  sortByPPN: false,
  newLineAfter: ':',
  modal: {
    showModal: true,
    modalTxt: 'Die ausgewählten Signaturen wurden gedruckt.'
  },
  file: {
    signatureCategory: '7100',
    subfieldLocation: '$f',
    subfieldSignature: '$a',
    subfieldLoanIndication: '$d'
  },
  SRU: {
    useSRU: false,
    SRUAddress: 'http://sru.gbv.de/opac-de-27',
    signatureCategory: '209A',
    subfieldLocation: 'f',
    subfieldSignature: 'a',
    subfieldLoanIndication: 'd'
  },
  print: {
    printImmediately: false
  },
  mode: {
    useMode: true,
    defaultMode: 'thulbMode',
    showLocation: false,
    showLoanIndication: false
  },
  'devMode': false
}

// name of signature storage json
const sigJSONFile = 'signaturen.json'
// requires the loadDataFromSRU-module
const loadFromSRU = require('./js/loadDataFromSRU.js')

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
ipcMain.on('print', (event, dataAll) => {
  _.each(dataAll, (data) => {
    // console.warn(data.formatInformation)
    // console.warn(data.printInformation)
    printData(data.formatInformation, data.printInformation)
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
ipcMain.on('openManualSignaturesWindow', function (event, data) {
  createManualSignaturesWindow(data)
})

// listens on closeManual, closes the manualSignaturesWindow and invokes the removeManual process
ipcMain.on('closeManualSignaturesWindow', function (event) {
  manualSignaturesWindow.close()
  manualSignaturesWindow = null
  mainWindow.webContents.send('removeManualSignatures')
})

// listens on saveManualSignatures, closes the manualSignaturesWindow and passes the data along
ipcMain.on('saveManualSignatures', function (event, data) {
  console.warn(data)
  manualSignaturesWindow.close()
  manualSignaturesWindow = null
  mainWindow.webContents.send('addManualSignatures', data)
})

// listens on loadFromSRU, invokes the loadAndAddFromSRU function with the provided barcode
ipcMain.on('loadFromSRU', function (event, barcode) {
  if (barcode !== '') {
    loadFromSRU(barcode).then(function (objSRU) {
      mainWindow.webContents.send('addSRUdata', objSRU)
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

// creates the mainWindow
function createWindow () {

  /*
  Pass config STORE as global variable to all other js files
   */
  global.config = config
  global.defaultProgramPath = defaultProgramPath
  global.sigJSONFile = sigJSONFile

  checkDir('./tmp')
  checkDir(defaultProgramPath)
  checkDir(defaultProgramPath + '\\Formate')
  checkDir(defaultProgramPath + '\\FormateCSS')
  checkConfig()
  // Create the browser window.
  if (!config.store.devMode) {
    mainWindow = new BrowserWindow({ width: 800, height: 520, backgroundColor: '#f0f0f0' })
  } else {
    mainWindow = new BrowserWindow({ width: 800, height: 550, backgroundColor: '#f0f0f0' })
  }

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/html/index.html'),
    protocol: 'file:',
    slashes: true
  }))
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
    manualSignaturesWindow = null
    configWindow = null
    editorWindow = null
    deleteJSON()
  })
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

// TODO redefine that function - that's to complex
// checks if config file exists, else creates one
function checkConfig () {
  if (fs.existsSync(defaultProgramPath + '\\config.json')) {
    if (!config.has('defaultDownloadPath')) {
      createConfig()
    }
  } else {
    createConfig()
  }
  // TODO should that be really the default formats
  let defaultConfigs = ['thulb_gross', 'thulb_klein', 'thulb_klein_1']
  defaultConfigs.forEach(fileName => {
    checkAndCreate(defaultProgramPath + '\\Formate\\', fileName, '.json')
    checkAndCreate(defaultProgramPath + '\\FormateCSS\\', fileName, '.css')
  })
  function checkAndCreate (pathName, fileName, ending) {
    if (!fs.existsSync(pathName + fileName + ending)) {
      let file = fs.readFileSync(path.join(__dirname, 'defaultFiles/' + fileName + ending), 'utf8')
      fs.writeFileSync(pathName + fileName + ending, file, 'utf8')
    }
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

function printData (formatInformation, printInformation) {
  let winPrint = null
  winPrint = new BrowserWindow({ width: 899, height: 900, show: false })
  winPrint.loadURL(url.format({
    pathname: path.join(__dirname, 'html/print.html'),
    protocol: 'file:',
    slashes: true
  }))
  winPrint.once('ready-to-show', () => {
    winPrint.webContents.send('toPrint', formatInformation, printInformation)
    // TODO - why ist height and width vise versa?
    winPrint.webContents.printToPDF({ marginsType: 1, landscape: true, pageSize: { height: formatInformation.paper.width, width: formatInformation.paper.height } }, (error, data) => {
      if (error) throw error
      let fileName = formatInformation.name + '_' + new Date().getTime() + '.pdf'
      fs.writeFile(defaultProgramPath + '\\' + fileName, data, (error) => {
        if (error) throw error
        let ps = new Shell({
          executionPolicy: 'Bypass',
          noProfile: true
        })
        if (!config.store.devMode) {
          ps.addCommand('Start-Process -file "' + defaultProgramPath + '\\' + fileName + '" -Verb PrintTo "' + formatInformation.printer + '" -PassThru | %{sleep 4;$_} | kill')
          ps.invoke().then(output => {
            fs.unlinkSync(defaultProgramPath + '\\' + fileName)
            mainWindow.webContents.send('printMsg', true)
          }).catch(err => {
            dialog.showErrorBox('Es ist ein Fehler aufgetreten.', err)
            mainWindow.webContents.send('printMsg', false)
            ps.dispose()
          })
        } else {
          ps.addCommand('Start-Process -file "' + defaultProgramPath + '\\' + fileName + '"')
          ps.invoke().then(output => { mainWindow.webContents.send('printMsg', true); ps.dispose() }).catch(err => {
            dialog.showErrorBox('Es ist ein Fehler aufgetreten.', err)
            mainWindow.webContents.send('printMsg', false)
            ps.dispose()
          })
        }
      })
    })
    if (config.store.devMode) {
      winPrint.show()
    }
    winPrint = null
  })
}

// creates the manualSignaturesWindow
function createManualSignaturesWindow (objMan) {
  manualSignaturesWindow = new BrowserWindow({ width: 650, height: 420, show: false })
  manualSignaturesWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html/manual.html'),
    protocol: 'file',
    slashes: true
  }))
  manualSignaturesWindow.once('ready-to-show', () => {
    manualSignaturesWindow.show()
    manualSignaturesWindow.webContents.send('objMan', objMan)
  })
}

// creates the configWindow
function createConfigWindow () {
  configWindow = new BrowserWindow({ width: 800, height: 950, show: false })
  configWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html/config.html'),
    protocol: 'file',
    slashes: true
  }))
  configWindow.once('ready-to-show', () => {
    configWindow.show()
  })
}

// creates the editorConfig
function createEditorWindow () {
  editorWindow = new BrowserWindow({ width: 800, height: 950, show: false })
  editorWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html/editor.html'),
    protocol: 'file',
    slashes: true
  }))
  editorWindow.once('ready-to-show', () => {
    editorWindow.show()
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
