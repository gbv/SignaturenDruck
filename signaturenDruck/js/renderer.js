// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires lodash
const _ = require('lodash')

// requires the fs-module
const fs = require('fs')

// required for ipc calls to the main process
const ipc = require('electron').ipcRenderer

// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})

const getLabelSize = require('./getLabelSize.js')
const loadDataFromFile = require('./loadDataFromFile')

const printerList = require('electron').remote.getCurrentWindow().webContents.getPrinters()

let objMan = null
let objSRU = {
  all: []
}
let formats = []
let selectOptions = []
let printerFound = []

// function on window load
window.onload = function () {
  addStyleFiles()
  loadFormats()
  if (config.get('devMode')) {
    document.getElementById('devMode').style.display = 'block'
  }
  checkPrinters()

  document.getElementById('modalTxt').innerHTML = config.get('modalTxt')
  let fileSelected = document.getElementById('fileToRead')
  let fileTobeRead
  if (config.get('useSRU') === false) {
    if (fs.existsSync(config.get('defaultPath'))) {
      let file = fs.readFileSync(config.get('defaultPath'), 'utf-8')
      let allLines = file.split(/\r\n|\n/)
      writeShelfmarksToFile(JSON.stringify(setIds(getUnique(loadDataFromFile(allLines)))))
      displayData()
      document.getElementById('defaultPath').innerHTML = config.get('defaultPath')
    } else {
      document.getElementById('defaultPath').innerHTML = 'nicht vorhanden'
      alert('Die Datei ' + config.get('defaultPath') + ' ist nicht vorhanden.')
    }
  } else {
    document.getElementById('dnl').hidden = true
    document.getElementById('sru').hidden = false
  }

  // Check the support for the File API support
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    fileSelected.addEventListener('change', function () {
      objMan = null
      fileTobeRead = fileSelected.files[0].path
      document.getElementById('defaultPath').innerHTML = fileTobeRead
      let file = fs.readFileSync(fileTobeRead, 'utf-8')
      let allLines = file.split(/\r\n|\n/)
      // getBarcodesFromFile(allLines)
      writeShelfmarksToFile(JSON.stringify(setIds(getUnique(loadDataFromFile(allLines)))))
      displayData()
    }, false)
  } else {
    alert('Files are not supported')
  }
}

// listens on printMsg, invokes the modal
ipc.on('printMsg', function (event) {
  document.getElementById('myModal').style.display = 'block'
})

// ipc listener to add new manual data to the table
ipc.on('manual', function (event, data) {
  objMan = data
  deleteOldManual()
  if (objMan !== undefined && objMan !== null && objMan.length !== 0) {
    addToTable(objMan)
  }
})

// ipc listener to remove the manual data
ipc.on('removeManual', function (event) {
  objMan = null
  deleteOldManual()
})

// ipc listener to add provided data to the SRU obj
ipc.on('addSRUdata', function (event, data) {
  if (data.error !== '') {
    alert(data.error)
  } else {
    let indx = objSRU.all.length
    objSRU.all[indx] = data
    objSRU.all[indx].id = indx + 1
    objSRU.all[indx].bigLabel = getLabelSize(data.plainTxt)
    fs.writeFileSync('signaturen.json', JSON.stringify(objSRU.all), 'utf8')
    clearTable()
    createTable(objSRU.all)
  }
})

// // function to get all lines from the .dnl file via SRU
// // not enabled atm because it messes up the order
// function getBarcodesFromFile (allLines) {
//   allLines.map((line) => {
//     if (line.substr(0, 4) === '8200') {
//       ipc.send('loadFromSRU', line.substr(5))
//     }
//   })
// }

// removes duplicates
function getUnique (obj) {
  return _.map(
    _.uniq(
      _.map(obj.all, function (obj) {
        return JSON.stringify(obj)
      })
    ), function (obj) {
      return JSON.parse(obj)
    }
  )
}

// groups shelfmarks by PPN
function groupByPPN (obj) {
  return _.groupBy(obj, 'PPN')
}

// sets shelfmark ids
function setIds (obj) {
  let i = 1
  return _.forEach(obj, function (value) {
    value.id = i
    i++
  })
}

// creates the signaturen.json file
function writeShelfmarksToFile (json) {
  if (config.store.sortByPPN) {
    json = JSON.stringify(groupByPPN(JSON.parse(json)))
  }
  fs.writeFileSync('signaturen.json', json, 'utf8')
}

// reads data from the signaturen.json file and displays it via createTable
function displayData () {
  let file = fs.readFileSync('signaturen.json', 'utf8')
  if (document.getElementById('shelfmarkTable')) {
    let myNode = document.getElementById('shelfmarkTableBody')
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild)
    }
  }
  createTable(JSON.parse(file))
}

// creates the displayed table with the provided data
function createTable (obj) {
  let table = document.getElementById('shelfmarkTable').getElementsByTagName('tbody')[0]
  let i = 0
  if (config.store.sortByPPN) {
    _.forEach(obj, function (key, value) {
      let row = table.insertRow(i)
      row.className = 'ppnRow'
      createPpnRow(row, value)
      _.forEach(key, function (objct) {
        i++
        row = table.insertRow(i)
        row.id = objct.PPN + '-0'
        createTxtCell(row, 0, objct.id, objct.txtOneLine)
        createDateCell(row, 1, objct.id, objct.date)
        createExnrCell(row, 2, objct.id, objct.exNr)
        createShortShelfmarkCell(row, 3, objct.id, objct.bigLabel)
        createPrintCell(row, 4, objct.id)
        createPrintCountCell(row, 5, objct.id)
        createLabelSizeCell(row, 6, objct.id, key.txtLength)
      })
      i++
    })
  } else {
    let i = 0
    _.forEach(obj, function (key) {
      let current = document.getElementById(key.PPN)
      let row
      if (current) {
        let i = 0
        while (document.getElementById(key.PPN + '-' + i)) {
          i++
        }
        row = document.createElement('tr')
        row.id = key.PPN + '-' + i
        if (i === 0) {
          current = document.getElementById(key.PPN)
        } else {
          current = document.getElementById(key.PPN + '-' + (i - 1))
        }

        current.parentNode.insertBefore(row, current.nextSibling)
      } else {
        row = table.insertRow(i)
        row.className = 'ppnRow'
        createPpnRow(row, key.PPN)
        i++
        row = table.insertRow(i)
        row.id = key.PPN + '-0'
      }
      createTxtCell(row, 0, key.id, key.txtOneLine)
      createDateCell(row, 1, key.id, key.date)
      createExnrCell(row, 2, key.id, key.exNr)
      createShortShelfmarkCell(row, 3, key.id, key.bigLabel)
      createPrintCell(row, 4, key.id)
      createPrintCountCell(row, 5, key.id)
      createLabelSizeCell(row, 6, key.id, key.txtLength)
      i++
    })
  }
}

// function to add all entries from the obj to the table
function addToTable (obj) {
  let table = document.getElementById('shelfmarkTable').getElementsByTagName('tbody')[0]
  let row = table.insertRow(0)
  row.className = 'ppnRow manual'
  createPpnRow(row, 'manuell')
  let i = 0
  while (obj[i] !== undefined) {
    row = table.insertRow(i + 1)
    row.className = 'manual'
    createTxtCell(row, 0, ('m_' + obj[i].id), obj[i].oneLineTxt)
    createDateCell(row, 1, ('m_' + obj[i].id))
    createExnrCell(row, 2, ('m_' + obj[i].id))
    createShortShelfmarkCell(row, 3, ('m_' + obj[i].id), obj[i].size)
    createPrintCell(row, 4, ('m_' + obj[i].id))
    createPrintCountCell(row, 5, ('m_' + obj[i].id))
    createLabelSizeCell(row, 6, ('m_' + obj[i].id), obj[i].lines)
    i++
  }
}

// creates the PPN row
function createPpnRow (row, value) {
  let i = 0
  row.id = value
  createCell(row, i, 'ppnCell', value)
  i++
  createCell(row, i, 'dateCell')
  i++
  createCell(row, i, 'isNrCell')
  i++
  createCell(row, i, 'shortShelfmarkCell')
  i++
  createCell(row, i, 'printCell')
  i++
  createCell(row, i, 'printCountCell')
  i++
  createCell(row, i, 'labelSizeCell')

  function createCell (row, i, className, value) {
    let cell = row.insertCell(i)
    if (i === 0) {
      cell.innerHTML = value
    } else {
      cell.innerHTML = '<hr>'
      cell.className = className
    }
  }
}

// creates the shelfmark text cell
function createTxtCell (row, cellNr, id, txt) {
  let txtCell = row.insertCell(cellNr)
  txtCell.onclick = function () { pre(id) }
  txtCell.innerHTML = txt
  txtCell.className = 'txtCell'
}

// creates the date cell
function createDateCell (row, cellNr, id, date = '-') {
  let dateCell = row.insertCell(cellNr)
  dateCell.onclick = function () { pre(id) }
  dateCell.className = 'dateCell'
  dateCell.id = 'dateCell_' + id
  dateCell.innerHTML = date
}

// create the ex. nr. cell
function createExnrCell (row, cellNr, id, exNr = '-') {
  let isNrCell = row.insertCell(cellNr)
  isNrCell.onclick = function () { pre(id) }
  isNrCell.className = 'isNrCell'
  isNrCell.innerHTML = exNr
}

// creates the short shelfmark cell
function createShortShelfmarkCell (row, cellNr, id, size) {
  let shortShelfmarkCell = row.insertCell(cellNr)
  shortShelfmarkCell.className = 'shortShelfmarkCell'
  if (!size) {
    if (!String(id).includes('m_')) {
      let input = document.createElement('input')
      input.id = 'short_' + id
      input.type = 'checkbox'
      input.name = 'shortShelfmark'
      input.value = id
      input.onclick = function () {
        changeFormat(id)
        pre(id)
      }
      shortShelfmarkCell.appendChild(input)
    } else {
      shortShelfmarkCell.id = 'short_' + id
    }
  }
  function changeFormat (id) {
    if (document.getElementById('short_' + id).checked) {
      document.getElementById('templateSelect_' + id).value = 'thulb_klein'
    } else {
      document.getElementById('templateSelect_' + id).value = 'thulb_klein_1'
    }
  }
}

// creates the print cell
function createPrintCell (row, cellNr, id) {
  let printCell = row.insertCell(cellNr)
  let input = document.createElement('input')
  printCell.className = 'printCell'
  input.id = 'print_' + id
  input.type = 'checkbox'
  input.name = 'toPrint'
  input.value = id
  input.onclick = function () { pre(id) }
  printCell.appendChild(input)
}

// creates the print count cell
function createPrintCountCell (row, cellNr, id) {
  let printCountCell = row.insertCell(cellNr)
  let input = document.createElement('input')
  printCountCell.className = 'printCountCell'
  input.id = 'count_' + id
  input.type = 'number'
  input.max = 99
  input.min = 1
  input.name = 'printCount'
  input.value = 1
  printCountCell.appendChild(input)
}

// creates the label size cell
function createLabelSizeCell (row, cellNr, id, lines) {
  let cell = row.insertCell(cellNr)
  let select = document.createElement('select')
  select.id = 'templateSelect_' + id
  selectOptions.forEach(element => {
    let size = document.createElement('option')
    size.value = element
    size.innerHTML = element
    if (!printerFound[element]) {
      size.disabled = true
    }
    select.appendChild(size)
  })
  select.onchange = function () { pre(id) }
  if (Number(lines) <= 2) {
    if (printerFound['thulb_klein_1']) {
      select.value = 'thulb_klein_1'
    }
  } else if (Number(lines) === 3) {
    if (printerFound['thulb_klein']) {
      select.value = 'thulb_klein'
    }
  } else if (Number(lines) <= 6) {
    if (printerFound['thulb_gross']) {
      select.value = 'thulb_gross'
    }
  }
  cell.appendChild(select)
}

function loadFormats () {
  let files = fs.readdirSync('C:\\Export\\SignaturenDruck\\Formate')
  for (let file of files) {
    let fileName = file.split('.json')[0]
    selectOptions.push(fileName)
    formats[fileName] = JSON.parse(fs.readFileSync('C:\\Export\\SignaturenDruck\\Formate\\' + file, 'utf8'))
  }
}

// clears the display table
function deleteList () {
  if (fs.existsSync('signaturen.json')) {
    fs.unlink('signaturen.json', function (err) {
      if (err) {
        throw err
      } else {
        let myNode = document.getElementById('shelfmarkTableBody')
        while (myNode.firstChild) {
          myNode.removeChild(myNode.firstChild)
        }
        objMan = null
        objSRU = {
          all: []
        }
        alert('Die Liste wurde gelöscht.')
      }
    })
  } else {
    let myNode = document.getElementById('shelfmarkTableBody')
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild)
    }
    objMan = null
    objSRU = {
      all: []
    }
    alert('Die Liste wurde gelöscht.')
  }
}

// deletes the shelfmark source file
function deleteFile () {
  if (document.getElementById('fileToRead').files[0]) {
    deleteFromPath(document.getElementById('fileToRead').files[0].path)
  } else {
    deleteFromPath(config.store.defaultPath)
  }
}

// deletes provided file
function deleteFromPath (path) {
  if (fs.existsSync(path)) {
    fs.unlink(path, function (err) {
      if (err) {
        throw err
      } else {
        alert('Die Datei wurde gelöscht.')
      }
    })
  }
}

// invokes to close the app via ipc
function closeButton () {
  ipc.send('close')
}

// gathers the data to print and invokes printing via ipc
function printButton () {
  let dataAll = {
    all: []
  }

  let elems = document.querySelectorAll('[name=toPrint]')
  for (let i = 0; i < elems.length; i++) {
    if (elems[i].checked) {
      let data = {
        'manual': false,
        'id': '',
        'count': '1',
        'removeIndent': false,
        'format': '',
        'isShort': false
      }
      dataAll.all.push(setData(data, i))
    }
  }
  ipc.send('print', _.groupBy(dataAll.all, 'format'), objMan)

  function setData (data, i) {
    setIdAndManual()
    setFormat()
    setCount()
    checkIfShort()

    return data

    function checkIfShort () {
      let shortCkbx = document.getElementById('short_' + data.id)
      if (shortCkbx) {
        if (shortCkbx.checked) {
          data.isShort = true
        }
      }
    }
    function setCount () {
      let count = document.getElementById('count_' + data.id).value
      if ((count <= 99) && (count >= 1)) {
        data.count = count
      } else if (count > 99) {
        data.count = 99
      } else if (count < 1) {
        data.count = 1
      }
    }
    function setFormat () {
      data.format = document.getElementById('templateSelect_' + data.id).value
    }
    function setIdAndManual () {
      if (elems[i].id.includes('print_m_')) {
        data.id = elems[i].id.split('print_')[1]
        data.manual = true
      } else {
        data.id = elems[i].value
      }
    }
  }
}

// funtion to delete all manual entries
function deleteOldManual () {
  let elements = document.getElementsByClassName('manual')
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0])
  }
}

// function to clear the table
function clearTable () {
  let myNode = document.getElementById('shelfmarkTableBody')
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild)
  }
}

// function to send objMan to the manual window
function openManually () {
  ipc.send('openManually', objMan)
}

// function to refresh the table
function refresh () {
  let currentFile = document.getElementById('defaultPath').innerHTML
  if (!readThisFile(currentFile)) {
    if (readThisFile(config.get('defaultPath'))) {
      document.getElementById('defaultPath').innerHTML = config.get('defaultPath')
    } else {
      document.getElementById('defaultPath').innerHTML = 'nicht vorhanden'
    }
  }

  function readThisFile (path) {
    if (fs.existsSync(path)) {
      objMan = null
      let file = fs.readFileSync(path, 'utf-8')
      let allLines = file.split(/\r\n|\n/)
      loadDataFromFile(allLines)
      displayData()
      return true
    }
    return false
  }
}

// function to invert the print-selection
function invertPrintingSelection () {
  let elems = document.querySelectorAll('[name=toPrint]')
  for (let i = 0; i < elems.length; i++) {
    if (elems[i].checked) {
      elems[i].checked = false
    } else {
      elems[i].checked = true
    }
  }
}

// function to select shelfmarks per date
function selectByDate () {
  let datepicker = document.getElementById('datepicker')
  let pickedDate = datepicker.value
  if (pickedDate !== '') {
    let pickedDateFormated = pickedDate.replace(/(\d{2})(\d{2})-(\d{2})-(\d{2})/, '$4-$3-$2')
    let elems = document.querySelectorAll('[name=toPrint]')
    for (let i = 0; i < elems.length; i++) {
      let elemValue = elems[i].value
      let date = document.getElementById('dateCell_' + elemValue).innerHTML
      if (date === pickedDateFormated) {
        document.getElementById('print_' + elemValue).checked = true
      } else {
        document.getElementById('print_' + elemValue).checked = false
      }
    }
  }
}

// function to get the printerList
function getPrinterNameList () {
  let nameList = []
  let i = 0
  _.forEach(printerList, function (key) {
    nameList[i] = key.name
    i++
  })
  return nameList
}

// function to check if printer is on the printerList
function isIncluded (printer, printerList) {
  if (_.indexOf(printerList, printer) !== -1) {
    return true
  } else {
    return false
  }
}

// function check if printers are available
function checkPrinters () {
  let printerList = getPrinterNameList()
  for (let format in formats) {
    printerFound[format] = isIncluded(formats[format].printer, printerList)
  }
  let printerNotFound = []
  for (let printer in printerFound) {
    if (!printerFound[printer]) {
      printerNotFound.push(printer)
    }
  }
  let str = ''
  if (printerNotFound.length > 0) {
    if (printerNotFound.length === 1) {
      str = 'Der Drucker des Formats: "' + printerNotFound[0] + '" wurde nicht gefunden'
    } else {
      str = 'Die Drucker der folgenden Formate wurden nicht gefunden: "'
      printerNotFound.forEach(element => {
        str += element + ', '
      })
      str = str.substr(0, str.length - 2)
      str += '"'
    }
    document.getElementById('btn_print').innerHTML = '<div class="tooltip">Drucken<span class="tooltiptext tooltip-right">' + str + '</span></div>'
  }
}

// function to submit the barcode
function submitBarcode () {
  ipc.send('loadFromSRU', document.getElementById('input_barcode').value)
  document.getElementById('input_barcode').value = ''
}

// function to send with enter
function sendWithEnter (event) {
  if (event.keyCode === 13) {
    document.getElementById('btn_barcode').click()
  }
}

function openConfigWindow (event) {
  if (event.altKey && event.ctrlKey && event.keyCode === 69) {
    ipc.send('openConfigWindow')
  }
}

function pre (id) {
  removeOld()
  if (!String(id).includes('m_')) {
    let file = fs.readFileSync('signaturen.json', 'utf8')
    if (config.store.sortByPPN) {
      _.forEach(JSON.parse(file), function (key, value) {
        let sig = ''
        let found = ''
        found = _.find(key, { 'id': Number(id) })
        if (found !== undefined) {
          sig = found
          if (sig.txtLength <= 2) {
            if (document.getElementById('short_' + sig.id).checked) {
              showData(sig.txt)
            } else {
              let data = []
              data[0] = sig.txtOneLine
              showData(data)
            }
          } else {
            showData(sig.txt)
          }
        }
      })
    } else {
      let found = _.find(JSON.parse(file), { 'id': Number(id) })
      if (found !== undefined) {
        if (found.txtLength <= 2) {
          if (document.getElementById('short_' + found.id).checked) {
            showData(found.txt)
          } else {
            let data = []
            data[0] = found.txtOneLine
            showData(data)
          }
        } else {
          showData(found.txt)
        }
      }
    }
    document.getElementsByClassName('innerBox')[0].className = 'innerBox'
  } else {
    let cleanId = id.split('m_')[1]
    checkIfNoIndent(cleanId)
  }
  changePreview(id)

  function checkIfNoIndent (cleanId) {
    showData(objMan[cleanId].lineTxts)
    if (objMan[cleanId].removeIndent) {
      document.getElementsByClassName('innerBox')[0].className = 'innerBox noIndent'
    } else {
      document.getElementsByClassName('innerBox')[0].className = 'innerBox'
    }
  }

  function removeOld () {
    let myNode = document.getElementById('previewBox')
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild)
    }
  }
}

function showData (shelfmark) {
  let i = 1
  let line
  let innerBox = document.createElement('div')
  innerBox.className = 'innerBox'
  shelfmark.forEach(element => {
    line = document.createElement('p')
    line.id = 'line_' + i
    line.className = 'line_' + i
    if (element === '') {
      let emptyLine = document.createElement('br')
      line.appendChild(emptyLine)
    } else {
      line.innerHTML = element
    }
    innerBox.appendChild(line)
    i++
  })
  document.getElementById('previewBox').appendChild(innerBox)
}

function changePreview (id) {
  let format = document.getElementById('templateSelect_' + id).value
  let previewBox = document.getElementById('previewBox')
  previewBox.className = 'format_' + format
}

function addStyleFiles () {
  let files = fs.readdirSync('C:\\Export\\SignaturenDruck\\FormateCSS')
  for (let file of files) {
    let fileName = file.split('.css')[0]
    let cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.type = 'text/css'
    cssLink.href = 'C:/Export/SignaturenDruck/FormateCSS/' + fileName + '.css'
    document.head.appendChild(cssLink)
  }
}

// adds event listener to the create manually button
document.getElementById('btn_create_manually').addEventListener('click', openManually)
// adds event listener to the deleteList button
document.getElementById('btn_deleteList').addEventListener('click', deleteList)
// adds event listener to the deleteFile button
document.getElementById('btn_deleteFile').addEventListener('click', deleteFile)
// adds event listener to the print button
document.getElementById('btn_print').addEventListener('click', printButton)
// adds event listener to the close button
document.getElementById('btn_close').addEventListener('click', closeButton)
// adds event listener to the refresh button
document.getElementById('btn_refresh').addEventListener('click', refresh)
// adds event listener to the print column
document.getElementById('columnPrint').addEventListener('click', invertPrintingSelection)
// adds event listener to the datepicker
document.getElementById('datepicker').addEventListener('change', selectByDate)
// adds event listener to the barcode button
document.getElementById('btn_barcode').addEventListener('click', submitBarcode)
// adds event listener to the barcode input
document.getElementById('input_barcode').addEventListener('keyup', sendWithEnter)
// adds event listener to the window to open config window
document.addEventListener('keydown', openConfigWindow)
