// required for ipc calls to the main process
const ipc = require('electron').ipcRenderer

const fs = require('fs')

let objct = {
  manual: []
}

let id = 0
let numberOf = 1
let formats = []
let selectOptions = []

window.onload = function () {
  loadFormats()
  pushFormatsToSelect()
  createByFormat()
}

function createByFormat () {
  let format = formats[document.getElementById('formatSelect').value]
  console.log(format)
  createLines(format.lines)

  function createLines (numberOfLines) {
    let box = document.getElementById('editorBox')
  }
}

function pushFormatsToSelect () {
  let select = document.getElementById('formatSelect')
  selectOptions.forEach(format => {
    let option = document.createElement('option')
    option.value = format
    option.innerHTML = format
    select.appendChild(option)
  })
}

function loadFormats () {
  let files = fs.readdirSync('C:\\Export\\SignaturenDruck\\Formate')
  for (let file of files) {
    let fileName = file.split('.json')[0]
    selectOptions.push(fileName)
    formats[fileName] = JSON.parse(fs.readFileSync('C:\\Export\\SignaturenDruck\\Formate\\' + file, 'utf8'))
  }
}
