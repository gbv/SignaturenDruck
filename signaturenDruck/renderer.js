// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the shelfmark class
const Shelfmark = require('./shelfmark.js')

// requires lodash
const _ = require('lodash')

// requires the fs-module
const fs = require('fs')

// //requires jsPDF
// const jsPDF = require("jspdf");

const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\'})

const DataExtract = require('./dataExtract.js')
const strSecondLine = 'Bitte wählen sie eine Datei aus:'
const strSecondLine2 = 'Eine andere Datei auswählen:'

window.onload = function () {
  document.getElementById('defaultPath').innerHTML = config.get('defaultPath')
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
      let txt = extract.txt(line)
      let big = labelSize(txt)
      if (big === false) {
        sig.bigLabel = false
      }
      txt = txt.split(':')
      sig.txt = txt
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

function labelSize (txt) {
  let numberOfSeperators = getCountOfSeparators(txt, ':')
  let numberOfWhitespaces = getCountOfSeparators(txt, ' ')
  if ((numberOfSeperators >= 2) && (numberOfSeperators > numberOfWhitespaces)) {
    return true
  } else {
    return false
  }
}

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

function groupByPPN (obj) {
  return _.groupBy(obj, 'PPN')
}

function setIds (obj) {
  let i = 1
  return _.forEach(obj, function (value) {
    value.id = i
    i++
  })
}
// // function to test the PDF generation
// function testPDF() {
//     var doc = new jsPDF("l", "mm", [200, 200]);
//     doc.text("This is just a test", 5, 5);
//     doc.addPage(200, 100);
//     doc.text("This is a second page", 5, 5);
//     doc.save("test.pdf");
// }

function writeSignaturesToFile (json) {
  json = JSON.stringify(groupByPPN(JSON.parse(json)))
  fs.writeFileSync('signaturen.json', json, 'utf8')
}

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

function createPpnRow (row, value) {
  let i = 0
  let cell = row.insertCell(i)
  i++
  cell.innerHTML = 'PPN: ' + value
  cell.className = 'ppnCell'
  cell = row.insertCell(i)
  i++
  cell.innerHTML = '<hr>'
  cell.className = 'dateCell'
  cell = row.insertCell(i)
  i++
  cell.innerHTML = '<hr>'
  cell.className = 'isNrCell'
  cell = row.insertCell(i)
  i++
  cell.innerHTML = '<hr>'
  cell.className = 'shortShelfmarkCell'
  cell = row.insertCell(i)
  i++
  cell.innerHTML = '<hr>'
  cell.className = 'printCell'
  cell = row.insertCell(i)
  i++
  cell.innerHTML = '<hr>'
  cell.className = 'printCountCell'
  cell = row.insertCell(i)
  i++
  cell.innerHTML = '<hr>'
  cell.className = 'labelSizeCell'
}

function createTxtCell (row, cellNr, objct) {
  let txtCell = row.insertCell(cellNr)
  txtCell.onclick = function () { preview(objct.id) }
  _.forEach(objct.txt, function (value) {
    txtCell.innerHTML += value + ' '
  })
  txtCell.className = 'txtCell'
}

function createDateCell (row, cellNr, objct) {
  let dateCell = row.insertCell(cellNr)
  dateCell.onclick = function () { preview(objct.id) }
  dateCell.className = 'dateCell'
  dateCell.innerHTML = objct.date
}

function createExnrCell (row, cellNr, objct) {
  let isNrCell = row.insertCell(cellNr)
  isNrCell.onclick = function () { preview(objct.id) }
  isNrCell.className = 'isNrCell'
  isNrCell.innerHTML = objct.exNr
}

function createShortShelfmarkCell (row, cellNr, objct) {
  let shortShelfmarkCell = row.insertCell(cellNr)
  shortShelfmarkCell.className = 'shortShelfmarkCell'
  if (!objct.bigLabel) {
    let input = document.createElement('input')
    input.id = 'short_' + objct.id
    input.type = 'checkbox'
    input.name = 'shortShelfmark'
    input.value = objct.id
    input.onclick = function () { preview(objct.id) }
    shortShelfmarkCell.appendChild(input)
  }
}

function createPrintCell (row, cellNr, objct) {
  let printCell = row.insertCell(cellNr)
  let input = document.createElement('input')
  printCell.className = 'printCell'
  input.id = 'print_' + objct.id
  input.type = 'checkbox'
  input.name = 'toPrint'
  input.value = objct.id
  input.onclick = function () { preview(objct.id) }
  printCell.appendChild(input)
}

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

function createLabelSizeCell (row, cellNr, objct) {
  let labelSizeCell = row.insertCell(cellNr)
  labelSizeCell.className = 'labelSizeCell'
  if (objct.bigLabel) {
    labelSizeCell.innerHTML = 'groß'
  } else {
    labelSizeCell.innerHTML = 'klein'
  }
}

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

function displayFirstLine (bool) {
  let firstLine = document.getElementById('firstLine')
  if (bool) {
    firstLine.style.display = 'block'
  } else {
    firstLine.style.display = 'none'
  }
}
function changeSecondLine (str) {
  let secondLine = document.getElementById('secondLine').getElementsByTagName('span')[0]
  secondLine.innerHTML = str
}

// deletes the shelfmark source file
function deleteFile () {
  if (document.getElementById("fileToRead").files[0]) {
    deleteFromPath(document.getElementById("fileToRead").files[0].path)
  } else {
    deleteFromPath(config.store.defaultPath)
  }
}

function deleteFromPath(path) {
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

// test function
function test () {
  console.log('Test')
}
// adds event listener to test button
// document.getElementById("btn_testIt").addEventListener("click", test);
// adds event listener to deleteList button
document.getElementById('btn_deleteList').addEventListener('click', deleteList)

document.getElementById('btn_deleteFile').addEventListener('click', deleteFile)
