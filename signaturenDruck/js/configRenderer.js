// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the fs-module
const fs = require('fs')

// requires the lodash-module
const _ = require('lodash')

// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})

// required for ipc calls to the main process
const ipc = require('electron').ipcRenderer

const fontManager = require('font-manager')

let lineCounter = 1

let fonts = []

window.onload = function () {
  setFontsList()
  changeLineSpace()
  addTableLine()
  document.getElementById('line_1').style.fontFamily = document.getElementById('fontLine_1').value
}

function setFontsList () {
  let fontsList = []
  fonts = fontManager.getAvailableFontsSync()

  fonts.forEach(element => {
    fontsList.push(element.family)
  })

  fonts = _.uniq(fontsList)
  fonts.sort()
}

function changeLabelHeight (event) {
  document.getElementById('previewBox').style.height = document.getElementById('input_labelHeight').value + 'mm'
}

function changeLabelWidth (event) {
  document.getElementById('previewBox').style.width = document.getElementById('input_labelWidth').value + 'mm'
}

function saveConfig () {
  if (document.getElementById('input_fileName').value !== '') {
    if (!fs.existsSync('C:\\Export\\SignaturenDruck\\Formate\\' + document.getElementById('input_fileName').value + '.json')) {
      fs.writeFileSync('C:\\Export\\SignaturenDruck\\Formate\\' + document.getElementById('input_fileName').value + '.json', JSON.stringify(setObjct()), 'utf8')
    } else {
      console.log('already exists')
    }
  }
}

function setObjct () {
  let newConfig = {
    'name': document.getElementById('input_fileName').value,
    'printer': document.getElementById('input_printerName').value,
    'label': {
      'width': document.getElementById('input_labelWidth').value + 'mm',
      'height': document.getElementById('input_labelHeight').value + 'mm'
    },
    'pdfName': document.getElementById('input_fileName').value + '.pdf',
    'paper': {
      'width': document.getElementById('input_paperWidth').value,
      'height': document.getElementById('input_paperHeight').value
    },
    'lines': document.getElementById('input_labelLines').value,
    'centerHor': document.getElementById('centerHor').checked,
    'centerVer': document.getElementById('centerVer').checked,
    'lineSpace': document.getElementById('lineSpace').value,
    'linesData': ''
  }

  let linesData = []
  let i = 0
  while (i < newConfig.lines) {
    let lineData = {
      'id': i + 1,
      'font': document.getElementById('fontLine_' + (i + 1)).value,
      'fontSize': document.getElementById('fontSizeLine_' + (i + 1)).value,
      'bold': document.getElementById('bold_' + (i + 1)).checked,
      'italic': document.getElementById('italic_' + (i + 1)).checked,
      'indent': document.getElementById('indent_' + (i + 1)).value
    }
    linesData[i] = lineData
    i++
  }

  newConfig.linesData = linesData

  return newConfig
}

function close () {
  ipc.send('closeWinConfig')
}

function addLine () {
  let line = document.createElement('p')
  lineCounter++
  line.id = 'line_' + lineCounter
  line.class = ''
  line.innerHTML = 'Zeile ' + lineCounter
  document.getElementById('innerBox').appendChild(line)
  document.getElementById('input_labelLines').value = lineCounter
  addTableLine(lineCounter)
  changeLineSpace()
}

function removeLine () {
  if (lineCounter > 1) {
    removeTableLine(lineCounter)
    let parent = document.getElementById('innerBox')
    let toDelete = parent.childNodes[lineCounter + 1]
    toDelete.parentNode.removeChild(toDelete)
    lineCounter--
    document.getElementById('input_labelLines').value = lineCounter
  }
}

function changeLineSpace () {
  let lines = document.getElementById('innerBox').children.length
  let i = 1
  while (i <= lines) {
    document.getElementById('line_' + i).style.marginBottom = document.getElementById('line_' + i).style.marginTop = document.getElementById('lineSpace').value + 'px'
    i++
  }
}

function addTableLine (id) {
  if (id === undefined) {
    id = 0
  } else {
    id = id - 1
  }
  let table = document.getElementById('tableLinesBody')
  let row = table.insertRow(id)
  row.className = 'rowLine_' + (id + 1)
  let cell = row.insertCell(0)
  cell.innerHTML = id + 1
  addTableLineFontSelect(id, row)
  addTableLineFontSize(id, row)
  addTableLineBold(id, row)
  addTableLineItalic(id, row)
  addTableLineIndent(id, row)
}

function removeTableLine (id) {
  document.getElementById('tableLinesBody').deleteRow(id - 1)
}

function addTableLineFontSelect (id, row) {
  let cell = row.insertCell(1)
  let select = document.createElement('select')
  select.id = 'fontLine_' + (id + 1)
  fonts.forEach(element => {
    let font = document.createElement('option')
    if (element === 'Arial') {
      font.selected = true
    }
    font.value = element
    font.innerHTML = element
    select.appendChild(font)
  })
  select.addEventListener('input', changeLineFont)
  cell.appendChild(select)
}

function addTableLineFontSize (id, row) {
  let cell = row.insertCell(2)
  let input = document.createElement('input')
  input.id = 'fontSizeLine_' + (id + 1)
  input.type = 'number'
  input.value = 14
  input.className = 'fixedWidth'
  input.addEventListener('input', changeLineFontSize)
  cell.appendChild(input)
}

function addTableLineBold (id, row) {
  let cell = row.insertCell(3)
  let input = document.createElement('input')
  input.id = 'bold_' + (id + 1)
  input.type = 'checkbox'
  input.addEventListener('click', changeLineBold)
  cell.appendChild(input)
}

function addTableLineItalic (id, row) {
  let cell = row.insertCell(4)
  let input = document.createElement('input')
  input.id = 'italic_' + (id + 1)
  input.type = 'checkbox'
  input.addEventListener('click', changeLineItalic)
  cell.appendChild(input)
}

function addTableLineIndent (id, row) {
  let cell = row.insertCell(5)
  let input = document.createElement('input')
  input.id = 'indent_' + (id + 1)
  input.type = 'number'
  input.value = 0
  input.className = 'fixedWidth'
  input.addEventListener('input', changeLineIndent)
  cell.appendChild(input)
}

function changeLineIndent (event) {
  let elemId = getId(event)
  document.getElementById('line_' + elemId).style.marginLeft = document.getElementById('indent_' + elemId).value + '%'
}

function changeLineItalic (event) {
  let elemId = getId(event)
  if (document.getElementById('line_' + elemId).style.fontStyle === 'italic') {
    document.getElementById('line_' + elemId).style.fontStyle = 'normal'
  } else {
    document.getElementById('line_' + elemId).style.fontStyle = 'italic'
  }
}

function changeLineBold (event) {
  let elemId = getId(event)
  if (document.getElementById('line_' + elemId).style.fontWeight === 'bold') {
    document.getElementById('line_' + elemId).style.fontWeight = 'inherit'
  } else {
    document.getElementById('line_' + elemId).style.fontWeight = 'bold'
  }
}

function changeLineFont (event) {
  let elemId = getId(event)
  document.getElementById('line_' + elemId).style.fontFamily = document.getElementById('fontLine_' + elemId).value
}

function getId (event) {
  let htmlElement = event.target.id
  let parts = htmlElement.split('_')
  return parts[1]
}

function changeLineFontSize (event) {
  let elemId = getId(event)

  document.getElementById('line_' + elemId).style.fontSize = document.getElementById('fontSizeLine_' + elemId).value + 'pt'
}

function centerHor () {
  if (!document.getElementById('centerHor').checked) {
    document.getElementById('previewBox').style.justifyContent = 'initial'
    document.getElementById('innerBox').style.width = '100%'
  } else {
    document.getElementById('previewBox').style.justifyContent = 'center'
    document.getElementById('innerBox').style.width = 'initial'
  }
}

function centerVer () {
  if (!document.getElementById('centerVer').checked) {
    document.getElementById('previewBox').style.alignItems = 'initial'
  } else {
    document.getElementById('previewBox').style.alignItems = 'center'
  }
}

// adds event listener to the labelSize line add and remove buttons
document.getElementById('btn_addLine').addEventListener('click', addLine)
document.getElementById('btn_removeLine').addEventListener('click', removeLine)
// adds event listener to the labelSize inputs
document.getElementById('input_labelHeight').addEventListener('input', changeLabelHeight)
document.getElementById('input_labelWidth').addEventListener('input', changeLabelWidth)
// adds event listener to the save button
document.getElementById('btn_save').addEventListener('click', saveConfig)
// adds event listener to the close button
document.getElementById('btn_close').addEventListener('click', close)
// adds event listener to the lineSpace input
document.getElementById('lineSpace').addEventListener('input', changeLineSpace)
// adds enevt listener to toe centerHor input
document.getElementById('centerHor').addEventListener('click', centerHor)
// adds enevt listener to toe centerVer input
document.getElementById('centerVer').addEventListener('click', centerVer)
