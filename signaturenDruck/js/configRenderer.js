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

let lineCounter = 1

window.onload = function () {
  // let myStyles = document.createElement('style')
  // document.head.appendChild(myStyles)
  // let styleSheet = myStyles.sheet

  // styleSheet.insertRule('#previewBox { ' + config.get('previewBox') + '}', 0)
}

function changeLabelHeight (event) {
  document.getElementById('previewBox').style.height = document.getElementById('input_labelHeight').value + 'mm'
}

function changeLabelWidth (event) {
  document.getElementById('previewBox').style.width = document.getElementById('input_labelWidth').value + 'mm'
}

function changePaperHeight (event) {

}

function changePaperWidth (event) {

}

function saveConfig () {
  if (document.getElementById('input_fileName').value !== '') {
    if (!fs.existsSync('C:\\Export\\SignaturenDruck\\Formate\\' + document.getElementById('input_fileName').value + '.json')) {
      console.log(setObjct())
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
    'pdfName': document.getElementById('input_pdfName').value + '.pdf',
    'preview': {
      'width': document.getElementById('input_paperWidth').value,
      'height': document.getElementById('input_paperHeight').value
    },
    'lines': document.getElementById('input_labelLines').value
  }
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
  document.getElementById('previewBox').appendChild(line)
  document.getElementById('input_labelLines').value = lineCounter
}

function removeLine () {
  if (lineCounter > 1) {
    let parent = document.getElementById('previewBox')
    let toDelete = parent.childNodes[lineCounter + 1]
    toDelete.parentNode.removeChild(toDelete)
    lineCounter--
    document.getElementById('input_labelLines').value = lineCounter
  }
}

// adds event listener to the labelSize line add and remove buttons
document.getElementById('btn_addLine').addEventListener('click', addLine)
document.getElementById('btn_removeLine').addEventListener('click', removeLine)
// adds event listener to the labelSize inputs
document.getElementById('input_labelHeight').addEventListener('change', changeLabelHeight)
document.getElementById('input_labelWidth').addEventListener('change', changeLabelWidth)
// adds event listener to the save button
document.getElementById('btn_save').addEventListener('click', saveConfig)
// adds event listener to the close button
document.getElementById('btn_close').addEventListener('click', close)
