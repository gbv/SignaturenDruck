// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the shelfmark class
const Shelfmark = require('./shelfmark.js')

// requires lodash
const _ = require('lodash')

// requires the fs-module
const fs = require('fs')

// requires the preview-module
const pre = require('./preview.js')

// required for ipc calls to the main process
const ipc = require('electron').ipcRenderer

// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})

// requires the dataExtract-module
const DataExtract = require('./dataExtract.js')

// initializes the 2 different strings for file-selection
const strSecondLine = 'Bitte wählen sie eine Datei aus:'
const strSecondLine2 = 'Eine andere Datei auswählen:'

let objMan = null

// function on window load
window.onload = function () {
  document.getElementById('defaultPath').innerHTML = config.get('defaultPath')
  if (config.get('devMode')) {
    document.getElementById('devMode').style.display = 'block'
  }
  document.getElementById('modalTxt').innerHTML = config.get('modalTxt')
  let fileSelected = document.getElementById('fileToRead')
  let fileTobeRead
  if (fs.existsSync(config.get('defaultPath'))) {
    let file = fs.readFileSync(config.get('defaultPath'), 'utf-8')
    let allLines = file.split(/\r\n|\n/)
    writeToFile(allLines)
    displayData()
  } else {
    displayFirstLine(false)
    alert('Die Datei ' + config.get('defaultPath') + ' ist nicht vorhanden.')
    changeSecondLine(strSecondLine)
  }

  // Check the support for the File API support
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    fileSelected.addEventListener('change', function () {
      objMan = null
      fileTobeRead = fileSelected.files[0]
      let fileReader = new FileReader()
      fileReader.onload = function () {
        let file = event.target.result
        let allLines = file.split(/\r\n|\n/)
        writeToFile(allLines)
        displayData()
        changeSecondLine(strSecondLine2)
      }
      fileReader.readAsText(fileTobeRead)
    }, false)
  } else {
    alert('Files are not supported')
  }
}

// listens on printMsg, invokes the modal
ipc.on('printMsg', function (event) {
  document.getElementById('myModal').style.display = 'block'
})

ipc.on('manual', function (event, data) {
  objMan = data
  deleteOldManual()
  addToTable(objMan)
})

ipc.on('removeManual', function (event) {
  objMan = null
  deleteOldManual()
})

// extracts all the shelfmark data found in the lines and passes them to writeSignaturesToFile
function writeToFile (allLines) {
  let obj = {
    all: []
  }
  let sig = new Shelfmark()
  let extract = new DataExtract()
  let ppnAktuell = ''
  // let id = 1;
  // sig.id = id;
  // Reading line by line
  allLines.map((line) => {
    let first4 = extract.firstFour(line)
    if (first4 == '0100') {
      sig.ppn = ppnAktuell = extract.ppn(line)
    } else if (first4 >= 7001 && first4 <= 7099) {
      sig.exNr = extract.exNr(line)
    } else if (first4 == 7100) {
      let plainTxt = extract.txt(line)
      let big = labelSize(plainTxt)
      if (big === false) {
        sig.bigLabel = false
      }
      let txt = plainTxt.split(':')
      if (txt.length === 6) {
        sig.txt = txt
      } else {
        let txt = [plainTxt]
        sig.txt = txt
      }
      sig.txtLength = sig.txt.length
    } else if (first4 == 7901) {
      sig.date = extract.date(line)
    }
    if (sig.allSet()) {
      obj.all.push(sig.shelfmark)
      sig = new Shelfmark()
      // id++;
      // sig.id = id;
      sig.ppn = ppnAktuell
    }
  })
  // write every shelfmark to signaturen.json
  writeSignaturesToFile(JSON.stringify(setIds(getUnique(obj))))
}

// retuns if label is big
function labelSize (txt) {
  let numberOfSeperators = getCountOfSeparators(txt, ':')
  let numberOfWhitespaces = getCountOfSeparators(txt, ' ')
  if ((numberOfSeperators >= 2) && (numberOfSeperators > numberOfWhitespaces)) {
    return true
  } else {
    return false
  }
}

// returns number of separators
function getCountOfSeparators (txt, separator) {
  return txt.split(separator).length
}

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
function writeSignaturesToFile (json) {
  json = JSON.stringify(groupByPPN(JSON.parse(json)))
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
  _.forEach(obj, function (key, value) {
    let row = table.insertRow(i)
    row.className = 'ppnRow'
    createPpnRow(row, value)
    _.forEach(key, function (objct) {
      i++
      row = table.insertRow(i)
      createTxtCell(row, 0, objct)
      createDateCell(row, 1, objct)
      createExnrCell(row, 2, objct)
      createShortShelfmarkCell(row, 3, objct)
      createPrintCell(row, 4, objct)
      createPrintCountCell(row, 5, objct)
      createLabelSizeCell(row, 6, objct)
    })
    i++
  })
}

function addToTable (obj) {
  let table = document.getElementById('shelfmarkTable').getElementsByTagName('tbody')[0]
  let row = table.insertRow(0)
  row.className = 'ppnRow manual'
  createPpnRow(row, 'manuell')
  let i = 0
  while (obj[i] !== undefined) {
    row = table.insertRow(i + 1)
    row.className = 'manual'
    createTxtCell(row, 0, obj[i].oneLineTxt, obj[i].id)
    createDateCell(row, 1, obj[i].id)
    createExnrCell(row, 2, obj[i].id)
    createShortShelfmarkCell(row, 3, obj[i].id)
    createPrintCell(row, 4, obj[i].id)
    createPrintCountCell(row, 5, obj[i].id)
    createLabelSizeCell(row, 6, obj[i].id)
    i++
  }

  function createTxtCell (row, cellNr, txt, id) {
    let txtCell = row.insertCell(cellNr)
    txtCell.onclick = function () { preMan(id) }
    txtCell.innerHTML = txt
    txtCell.className = 'txtCell'
  }

  function createDateCell (row, cellNr, id) {
    let dateCell = row.insertCell(cellNr)
    dateCell.onclick = function () { preMan(id) }
    dateCell.className = 'dateCell'
    dateCell.innerHTML = '-'
  }

  function createExnrCell (row, cellNr, id) {
    let isNrCell = row.insertCell(cellNr)
    isNrCell.onclick = function () { preMan(id) }
    isNrCell.className = 'isNrCell'
    isNrCell.innerHTML = '-'
  }

  function createShortShelfmarkCell (row, cellNr, id) {
    let shortShelfmarkCell = row.insertCell(cellNr)
    shortShelfmarkCell.onclick = function () { preMan(id) }
    shortShelfmarkCell.className = 'shortShelfmarkCell'
    if (obj[id].lines < 6) {
      shortShelfmarkCell.id = 'short_m_' + id
    }
    shortShelfmarkCell.innerHTML = '-'
  }

  function createPrintCell (row, cellNr, id) {
    let printCell = row.insertCell(cellNr)
    let input = document.createElement('input')
    printCell.className = 'printCell'
    input.id = 'print_m_' + id
    input.type = 'checkbox'
    input.name = 'toPrint'
    input.value = id
    input.onclick = function () { preMan(id) }
    printCell.appendChild(input)
  }

  function createPrintCountCell (row, cellNr, id) {
    let printCountCell = row.insertCell(cellNr)
    let input = document.createElement('input')
    printCountCell.className = 'printCountCell'
    input.id = 'count_' + 'm_' + id
    input.type = 'number'
    input.max = 99
    input.min = 1
    input.name = 'printCount'
    input.value = 1
    printCountCell.appendChild(input)
  }

  function createLabelSizeCell (row, cellNr, id) {
    let labelSizeCell = row.insertCell(cellNr)
    labelSizeCell.className = 'labelSizeCell'
    if (obj[id].lines < 6) {
      labelSizeCell.innerHTML = 'klein'
    } else {
      labelSizeCell.innerHTML = 'groß'
    }
  }
}

// creates the PPN row
function createPpnRow (row, value) {
  let i = 0
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
      cell.innerHTML = 'PPN: ' + value
    } else {
      cell.innerHTML = '<hr>'
      cell.className = className
    }
  }
}

// creates the shelfmark text cell
function createTxtCell (row, cellNr, objct) {
  let txtCell = row.insertCell(cellNr)
  txtCell.onclick = function () { pre(objct.id) }
  if (objct.txtLength === 1) {
    txtCell.innerHTML = objct.txt
  } else {
    _.forEach(objct.txt, function (value) {
      txtCell.innerHTML += value + ' '
    })
  }
  txtCell.className = 'txtCell'
}

// creates the date cell
function createDateCell (row, cellNr, objct) {
  let dateCell = row.insertCell(cellNr)
  dateCell.onclick = function () { pre(objct.id) }
  dateCell.className = 'dateCell'
  dateCell.innerHTML = objct.date
}

// create the ex. nr. cell
function createExnrCell (row, cellNr, objct) {
  let isNrCell = row.insertCell(cellNr)
  isNrCell.onclick = function () { pre(objct.id) }
  isNrCell.className = 'isNrCell'
  isNrCell.innerHTML = objct.exNr
}

// creates the short shelfmark cell
function createShortShelfmarkCell (row, cellNr, objct) {
  let shortShelfmarkCell = row.insertCell(cellNr)
  shortShelfmarkCell.className = 'shortShelfmarkCell'
  if (!objct.bigLabel) {
    let input = document.createElement('input')
    input.id = 'short_' + objct.id
    input.type = 'checkbox'
    input.name = 'shortShelfmark'
    input.value = objct.id
    input.onclick = function () { pre(objct.id) }
    shortShelfmarkCell.appendChild(input)
  }
}

// creates the print cell
function createPrintCell (row, cellNr, objct) {
  let printCell = row.insertCell(cellNr)
  let input = document.createElement('input')
  printCell.className = 'printCell'
  input.id = 'print_' + objct.id
  input.type = 'checkbox'
  input.name = 'toPrint'
  input.value = objct.id
  input.onclick = function () { pre(objct.id) }
  printCell.appendChild(input)
}

// creates the print count cell
function createPrintCountCell (row, cellNr, objct) {
  let printCountCell = row.insertCell(cellNr)
  let input = document.createElement('input')
  printCountCell.className = 'printCountCell'
  input.id = 'count_' + objct.id
  input.type = 'number'
  input.max = 99
  input.min = 1
  input.name = 'printCount'
  input.value = 1
  printCountCell.appendChild(input)
}

// creates the label size cell
function createLabelSizeCell (row, cellNr, objct) {
  let labelSizeCell = row.insertCell(cellNr)
  labelSizeCell.className = 'labelSizeCell'
  if (objct.bigLabel) {
    labelSizeCell.innerHTML = 'groß'
  } else {
    labelSizeCell.innerHTML = 'klein'
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
        displayFirstLine(false)
        changeSecondLine(strSecondLine)
        alert('Die Liste wurde gelöscht.')
      }
    })
  }
}

// toggles first line
function displayFirstLine (bool) {
  let firstLine = document.getElementById('firstLine')
  if (bool) {
    firstLine.style.display = 'block'
  } else {
    firstLine.style.display = 'none'
  }
}

// changes secondLine
function changeSecondLine (str) {
  let secondLine = document.getElementById('secondLine').getElementsByTagName('span')[0]
  secondLine.innerHTML = str
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
  let dataAll = {}
  let big = {}
  let b = 0
  let small = {}
  let s = 0
  let j = 0

  let elems = document.querySelectorAll('[name=toPrint]')
  for (let i = 0; i < elems.length; i++) {
    if (elems[i].checked) {
      let data = {
        'manual': false,
        'id': '',
        'count': '1',
        'size': 'big',
        'short': false,
        'removeIndent': false
      }
      if (elems[i].id.includes('print_m_')) {
        data.id = elems[i].id.split('print_')[1]
        data.manual = true
      } else {
        data.id = elems[i].value
      }
      let count = document.getElementById('count_' + data.id).value
      if ((count <= 99) && (count >= 1)) {
        data.count = count
      }
      if (document.getElementById('short_' + data.id)) {
        if (document.getElementById('short_' + data.id).checked) {
          data.short = true
        }
        data.size = 'small'
        small[s] = data
        s++
      } else {
        big[b] = data
        b++
      }
      dataAll[j] = data
      j++
    }
  }
  let data = {}
  if (b > 0) {
    data.big = big
  }
  if (s > 0) {
    data.small = small
  }
  ipc.send('print', data, objMan)
}

function deleteOldManual () {
  let elements = document.getElementsByClassName('manual')
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0])
  }
}

function openManually () {
  ipc.send('openManually', objMan)
}

function preMan (id) {
  let prevBox = document.getElementById('previewBox')
  prevBox.classList = ''
  if (objMan[id].lines == 1) {
    prevBox.className = 'small center'
    removeOld()
    addLines()
    if (objMan[id].removeIndent) {
      document.getElementById('line1').style.textAlign = 'left'
    }
  } else if (objMan[id].lines == 3) {
    prevBox.className = 'small indent'
    removeOld()
    addLines()
  } else {
    prevBox.className = 'big indent'
    removeOld()
    addLines()
  }
  if (objMan[id].removeIndent) {
    prevBox.classList.remove('indent')
  }

  function addLines () {
    let line
    let i = 0
    let j
    while (i < objMan[id].lines) {
      j = i + 1
      line = document.createElement('p')
      line.id = 'line' + j
      line.className = 'previewLine'
      if (objMan[id].lineTxts[i] === '') {
        line.innerHTML = ' '
      } else {
        line.innerHTML = objMan[id].lineTxts[i]
      }
      prevBox.appendChild(line)
      i++
    }
  }

  function removeOld () {
    let myNode = document.getElementById('previewBox')
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild)
    }
  }
}

function refresh () {
  if (fs.existsSync(config.store.defaultPath)) {
    objMan = null
    let file = fs.readFileSync(config.store.defaultPath, 'utf-8')
    let allLines = file.split(/\r\n|\n/)
    writeToFile(allLines)
    displayData()
  }
}

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
