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
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})
const cmd = require('node-cmd')
const {net} = require('electron')

// default main config settings
const configNew = {
  'testKey': "Don't panic, this is just a test",
  'defaultPath': 'C://Export/download.dnl',
  'modalTxt': 'Die ausgewählten Signaturen wurden gedruckt.',
  'sortByPPN': false,
  'newLineAfter': ':',
  'useSRU': false,
  'SRUaddress': 'http://sru.gbv.de/opac-de-27',
  'devMode': false
}

// default "big" label config
const configBigNew = {
  'name': 'gross',
  'printer': '\\\\ulbw2k812\\ulbps101',
  'label': {
    'width': 99970,
    'height': 48920
  },
  'pdfName': 'printBig.pdf',
  'preview': {
    'width': '80mm',
    'height': '43mm'
  },
  'lines': 6
}

// default "small" label config
const configSmallNew = {
  'name': 'klein',
  'printer': '\\\\ulbw2k812\\ulbps124',
  'label': {
    'width': 74500,
    'height': 23500
  },
  'pdfName': 'printSmall.pdf',
  'preview': {
    'width': '74mm',
    'height': '23mm'
  },
  'linesMin': 1
}

// name of signature storage json
const sigJSON = 'signaturen.json'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let savedData
let winManual
let winConfig

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
ipc.on('print', function (event, data, dataMan) {
  savedData = data
  if (savedData.big || savedData.small) {
    try {
      if (savedData.big) {
        printBig(savedData.big, dataMan)
      }
      if (savedData.small) {
        printSmall(savedData.small, dataMan)
      }
    } catch (error) {
      throw error
    }
  }
})

app.on('close', () => {
  mainWindow.close()
  mainWindow = null
  winManual.close()
  winManual = null
  winConfig.close()
  winConfig = null
  app.quit()
})

// closes the application
ipc.on('close', function (event) {
  mainWindow.close()
  mainWindow = null
  app.quit()
})

// listens on printed, invokes then printMsg via ipc
ipc.on('printed', function (event) {
  mainWindow.webContents.send('printMsg', true)
})

// listens on openManually, invokes the opening process
ipc.on('openManually', function (event, objMan) {
  createManualWindow(objMan)
})

// listens on closeManual, closes the winManual and invokes the removeManual process
ipc.on('closeManual', function (event) {
  winManual.close()
  winManual = null
  mainWindow.webContents.send('removeManual')
})

// listens on saveManual, closes the winManual and passes the data along
ipc.on('saveManual', function (event, data) {
  winManual.close()
  winManual = null
  mainWindow.webContents.send('manual', data)
})

// listens on loadFromSRU, invokes the loadAndAddFromSRU function with the provided barcode
ipc.on('loadFromSRU', function (event, barcode) {
  if (barcode !== '') {
    loadAndAddFromSRU(barcode).then(function (objSRU) {
      mainWindow.webContents.send('addSRUdata', objSRU)
    })
  }
})

// listens on openConfigWindow, invokes the createConfigWindow function
ipc.on('openConfigWindow', function (event) {
  createConfigWindow()
})

// listens on closeWinConfig, invokes the closeWinConfig function
ipc.on('closeWinConfig', function (event) {
  closeWinConfig()
})

function closeWinConfig () {
  winConfig.close()
  winConfig = null
}

// loads the shelfmark with the matching barcode from SRU, adds it to the table
function loadAndAddFromSRU (barcode) {
  let url = config.get('SRUaddress') + '?version=1.1&operation=searchRetrieve&query=pica.bar=' + barcode + '&maximumRecords=1&recordSchema=picaxml'
  let request = net.request(url)
  let allData = ''
  let field209A = false
  let isBarcodeLine = false
  let isPpnLine = false
  let isDateLine = false
  let exNr = ''
  let shelfmark = ''
  let pufferShelfmark = ''
  let pufferExNr = ''
  let ppnFromLine = ''
  let dateFromLine = ''
  let barcodeFromLine = ''
  let objSRU = {
    'PPN': '',
    'id': '',
    'bigLabel': true,
    'txt': [],
    'txtLength': '',
    'date': '',
    'exNr': '',
    'plainTxt': '',
    'error': ''
  }
  return new Promise(function (resolve, reject) {
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        allData += chunk
      })
      response.on('end', () => {
        allData = allData.split(/\r\n|\n/)
        allData.map((line) => {
          if (!recordCheck(line)) {
            resolve(objSRU)
          }
          setPPN(line)
          setDate(line)
          setShelfmark(line)
          setBarcode(line)
          if (barcode === barcodeFromLine) {
            setObjct()
            resolve(objSRU)
            barcodeFromLine = ''
          }
        })
      })
    })
    request.end()
  })

  function setPPN (line) {
    if (/(<datafield tag="003@")/.test(line)) {
      isPpnLine = true
    } else if (isPpnLine) {
      ppnFromLine = line.replace(/^(.*)(0">)(.*)(<\/subfield>)$/, '$3')
      isPpnLine = false
    }
  }
  function setDate (line) {
    if (/(<datafield tag="201B")/.test(line)) {
      isDateLine = true
    } else if (isDateLine) {
      if (/(code="0">)/.test(line)) {
        dateFromLine = line.replace(/^(.*)(0">)(.*)(<\/subfield>)$/, '$3')
        isDateLine = false
      }
    }
  }
  function setShelfmark (line) {
    if (/(<datafield tag="209A")/.test(line)) {
      pufferExNr = line.replace(/^(.*)(occurrence=")(\d{2})(")(.*)$/, '$3')
      field209A = true
    } else {
      if (field209A && /(<\/datafield>)/.test(line)) {
        field209A = false
      } else if (field209A) {
        if (/code="a">/.test(line)) {
          pufferShelfmark = line.replace(/^(.*)(a">)(.*)(<\/subfield>)$/, '$3')
        } else if (/code="x">00/.test(line)) {
          exNr = pufferExNr
          shelfmark = pufferShelfmark
        }
      }
    }
  }
  function setBarcode (line) {
    if (/(<datafield tag="209G")/.test(line)) {
      isBarcodeLine = true
    } else if (isBarcodeLine && /(<\/datafield>)/.test(line)) {
      isBarcodeLine = false
    } else if (isBarcodeLine) {
      barcodeFromLine = line.replace(/^(.*)(code="a">)(.*)(<\/subfield>)$/, '$3')
    }
  }
  function setObjct () {
    objSRU.PPN = ppnFromLine
    objSRU.id = 99
    objSRU.bigLabel = true
    objSRU.txt = shelfmark.split(config.get('newLineAfter'))
    objSRU.txtLength = objSRU.txt.length
    objSRU.date = dateFromLine
    objSRU.exNr = exNr
    objSRU.plainTxt = shelfmark
  }
  function recordCheck (line) {
    if (/<zs:numberOfRecords>0<\/zs:numberOfRecords>/.test(line)) {
      objSRU.error = 'Barcode wurde nicht gefunden'
      return false
    } else {
      return true
    }
  }
}

// creates the mainWindow
function createWindow () {
  checkConfig()
  checkDir('./tmp')
  checkDir('C:\\Export\\SignaturenDruck')
  // Create the browser window.
  if (!config.store.devMode) {
    mainWindow = new BrowserWindow({width: 800, height: 580})
  } else {
    mainWindow = new BrowserWindow({width: 800, height: 600})
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
    winManual = null
    winConfig = null
    deleteJSON()
  })
}

// deletes the signature storage json
function deleteJSON () {
  if (fs.existsSync(sigJSON)) {
    fs.unlink(sigJSON, function (err) {
      if (err) {
        throw err
      }
    })
  }
}

// checks if config file exists, else creates one
function checkConfig () {
  if (fs.existsSync('C:\\Export\\SignaturenDruck\\config.json')) {
    if (!config.has('defaultPath')) {
      createConfig()
    }
  } else {
    createConfig()
  }
  if (!fs.existsSync('C:\\Export\\SignaturenDruck\\Formate\\gross.json')) {
    let configBig = new Store({name: 'gross', cwd: 'C:\\Export\\SignaturenDruck\\Formate'})
    configBig.set(configBigNew)
  }
  if (!fs.existsSync('C:\\Export\\SignaturenDruck\\Formate\\klein.json')) {
    let configSmall = new Store({name: 'klein', cwd: 'C:\\Export\\SignaturenDruck\\Formate'})
    configSmall.set(configSmallNew)
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

// invokes the generating and printing of printBig.pdf
function printBig (data, dataMan) {
  let winBig = null
  winBig = new BrowserWindow({ heihgt: 350, width: 500, show: false })
  winBig.loadURL(url.format({
    pathname: path.join(__dirname, 'html/print.html'),
    protocol: 'file:',
    slashes: true
  }))
  winBig.once('ready-to-show', () => {
    winBig.webContents.send('toPrint', data, dataMan)
    let configBig = new Store({name: 'gross', cwd: 'C:\\Export\\SignaturenDruck\\Formate'})

    // generates a pdf file which is then printed silently via Foxit Reader v6.2.3.0815
    winBig.webContents.printToPDF({marginsType: 2, landscape: true, pageSize: { width: configBig.store.label.height, height: configBig.store.label.width }}, (error, data) => {
      if (error) throw error
      fs.writeFile('./tmp/' + configBig.store.pdfName, data, (error) => {
        if (error) throw error
        if (!config.store.devMode) {
          // printing with Foxit Reader 6.2.3.0815 via node-cmd
          cmd.get(
            '"C:\\Program Files (x86)\\Foxit Software\\Foxit Reader\\Foxit Reader.exe"' + ' /t .\\tmp\\' + configBig.store.pdfName + ' ' + configBig.store.printer,
            function (error, data, stderr) {
              if (error) throw error
            }
          )
        }
      })
    })
    if (config.store.devMode) {
      winBig.show()
    }
    winBig = null
  })
}

// invokes the generating and printing of printSmall.pdf
function printSmall (data, dataMan) {
  let winSmall = null
  winSmall = new BrowserWindow({width: 350, height: 500, show: false})
  winSmall.loadURL(url.format({
    pathname: path.join(__dirname, 'html/print.html'),
    protocol: 'file:',
    slashes: true
  }))
  winSmall.once('ready-to-show', () => {
    winSmall.webContents.send('toPrint', data, dataMan)
    let configSmall = new Store({name: 'small', cwd: 'C:\\Export\\SignaturenDruck\\Formate'})

    winSmall.webContents.printToPDF({marginsType: 2, landscape: true, pageSize: { width: configSmall.store.label.height, height: configSmall.store.label.width }}, (error, data) => {
      if (error) throw error
      fs.writeFile('./tmp/' + configSmall.store.pdfName, data, (error) => {
        if (error) throw error
        if (!config.store.devMode) {
          // printing with Foxit Reader 6.2.3.0815 via node-cmd
          cmd.get(
            '"C:\\Program Files (x86)\\Foxit Software\\Foxit Reader\\Foxit Reader.exe"' + ' /t .\\tmp\\' + configSmall.store.pdfName + ' ' + configSmall.store.printer,
            function (error, data, stderr) {
              if (error) throw error
            }
          )
        }
      })
    })
    if (config.store.devMode) {
      winSmall.show()
    }
    winSmall = null
  })
}

// creates the winManual
function createManualWindow (objMan) {
  winManual = new BrowserWindow({width: 582, height: 355, show: false})
  winManual.loadURL(url.format({
    pathname: path.join(__dirname, 'html/manual.html'),
    protocol: 'file',
    slashes: true
  }))
  winManual.once('ready-to-show', () => {
    winManual.show()
    winManual.webContents.send('objMan', objMan)
  })
}

// creates the winConfig
function createConfigWindow () {
  winConfig = new BrowserWindow({width: 400, height: 500, show: false})
  winConfig.loadURL(url.format({
    pathname: path.join(__dirname, 'html/config.html'),
    protocol: 'file',
    slashes: true
  }))
  winConfig.once('ready-to-show', () => {
    winConfig.show()
  })
}

// function getPrinterNameList () {
//   let printerList = mainWindow.webContents.getPrinters()
//   let nameList = []
//   let i = 0
//   _.forEach(printerList, function (key) {
//     nameList[i] = key.name
//     i++
//   })
//   return nameList
// }

// function isIncluded (printer, printerList) {
//   if (_.indexOf(printerList, printer) !== -1) {
//     return true
//   } else {
//     return false
//   }
// }

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
