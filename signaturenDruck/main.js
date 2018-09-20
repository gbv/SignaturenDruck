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

const configNew = {
  'testKey': "Don't panic, this is just a test",
  'defaultPath': 'C://Export/download.dnl',
  'modalTxt': 'Die ausgewählten Signaturen wurden gedruckt.',
  'sortByPPN': false,
  'big': {
    'printer': '\\\\ulbw2k812\\ulbps101',
    'label': {
      'width': 99970,
      'height': 48920
    },
    'pdfName': 'printBig.pdf'
  },
  'small': {
    'printer': '\\\\ulbw2k812\\ulbps124',
    'label': {
      'width': 74500,
      'height': 23500
    },
    'pdfName': 'printSmall.pdf'
  },
  'useSRU': false,
  'SRUaddress': 'http://sru.gbv.de/opac-de-27',
  'devMode': false
}

// name of signature storage json
const sigJSON = 'signaturen.json'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let savedData
let winManual

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

// closes the application
ipc.on('close', function (event) {
  mainWindow.close()
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

ipc.on('loadFromSRU', function (event, barcode) {
  let url = config.get('SRUaddress') + '?version=1.1&operation=searchRetrieve&query=pica.bar=' + barcode + '&maximumRecords=1&recordSchema=picaxml'
  let request = net.request(url)
  let allData = ''
  let field209A = false
  let exNr = ''
  let isBarcodeLine = false
  let isPpnLine = false
  let shelfmark = ''
  let pufferShelfmark = ''
  let pufferExNr = ''
  let ppnFromLine = ''
  let isDateLine = false
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
    'plainTxt': ''
  }
  request.on('response', (response) => {
    response.on('data', (chunk) => {
      allData += chunk
    })
    response.on('end', () => {
      console.log('No more data in response.')
      allData = allData.split(/\r\n|\n/)
      allData.map((line) => {
        setPPN(line)
        setDate(line)
        setShelfmark(line)
        setBarcode(line)
        if (barcode === barcodeFromLine) {
          // push shelfmark and exNr and PPN to table
          console.log(shelfmark, exNr, dateFromLine, barcode, ppnFromLine)
          setObjct()
          mainWindow.webContents.send('addSRUdata', objSRU)
          barcodeFromLine = ''
        }
      })
      fs.writeFileSync('sruResponse.txt', allData, 'utf8')
    })
  })
  request.end()

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
    objSRU.txt = shelfmark.split(':')
    objSRU.txtLength = objSRU.txt.length
    objSRU.date = dateFromLine
    objSRU.exNr = exNr
    objSRU.plainTxt = shelfmark
  }
})

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

    // generates a pdf file which is then printed silently via Foxit Reader v6.2.3.0815
    winBig.webContents.printToPDF({marginsType: 2, landscape: true, pageSize: { width: config.store.big.label.height, height: config.store.big.label.width }}, (error, data) => {
      if (error) throw error
      fs.writeFile('./tmp/' + config.store.big.pdfName, data, (error) => {
        if (error) throw error
        if (!config.store.devMode) {
          // printing with Foxit Reader 6.2.3.0815 via node-cmd
          cmd.get(
            // '"C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe" -print-to "\\\\http://jenlbs6-sun23.thulb.uni-jena.de:631\\SigGross" -print-settings "noscale" ".\\tmp\\printBig.pdf"',
            '"C:\\Program Files (x86)\\Foxit Software\\Foxit Reader\\Foxit Reader.exe"' + ' /t .\\tmp\\' + config.store.big.pdfName + ' ' + config.store.big.printer,
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
    winSmall.webContents.printToPDF({marginsType: 2, landscape: true, pageSize: { width: config.store.small.label.height, height: config.store.small.label.width }}, (error, data) => {
      if (error) throw error
      fs.writeFile('./tmp/' + config.store.small.pdfName, data, (error) => {
        if (error) throw error
        if (!config.store.devMode) {
          // printing with Foxit Reader 6.2.3.0815 via node-cmd
          cmd.get(
            // '"C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe" -print-to "\\\\http://jenlbs6-sun23.thulb.uni-jena.de:631\\SigGross" -print-settings "noscale" ".\\tmp\\printBig.pdf"',
            '"C:\\Program Files (x86)\\Foxit Software\\Foxit Reader\\Foxit Reader.exe"' + ' /t .\\tmp\\' + config.store.small.pdfName + ' ' + config.store.small.printer,
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
