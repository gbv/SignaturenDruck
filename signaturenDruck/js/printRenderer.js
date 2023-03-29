// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the lodash-module
const _ = require('lodash')

// required for ipc calls to the main process
const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const C = require('./classes/Config')
const defaultProgramPath = new C().defaultPath
const config = new Store({ cwd: defaultProgramPath })

const moment = require('moment')

const formats = require('./classes/Formats')

window.onload = function () {
  const match = process.argv.filter(s => s.includes('--format-name:'))
  const formatName = match[0].split('format-name:')[1]
  formats.addStyleFile(formatName)
}

ipcRenderer.on('toPrint', function (event, formatInformation, printInformation, printImmediately, last) {
  createPage(formatInformation, printInformation, printImmediately, last)
})

function createPage (formatInformation, printInformation, printImmediately, last) {
  document.getElementById('toPrint').className = 'format_' + formatInformation.name
  if (config.get('print.printCoverLabel')) {
    fillCoverLabel()
  } else {
    removeCoverLabel()
  }
  if (config.get('print.reverseOrder')) {
    printInformation.reverse()
  }
  _.each(printInformation, data => {
    for (let i = 1; i <= data.count; i++) {
      const capsuleDiv = document.createElement('div')
      capsuleDiv.className = 'capsule'
      capsuleDiv.id = 'capsule_' + data.id + '_' + i
      document.getElementById('toPrint').appendChild(capsuleDiv)
      const div = document.createElement('div')
      data.data.removeIndent ? div.className = 'innerBox noIndent' : div.className = 'innerBox'
      div.id = data.id + '_' + i
      const lines = _.find(data.data.modes, { format: formatInformation.name }).lines
      for (let j = 0; j < formatInformation.lines && j < lines.length; j++) {
        const p = document.createElement('p')
        p.className = 'line_' + (j + 1)
        lines[j] === '' ? p.appendChild(document.createElement('br')) : p.innerHTML = lines[j]
        div.appendChild(p)
      }
      document.getElementById('capsule_' + data.id + '_' + i).appendChild(div)
    }
  })
  ipcRenderer.send('readyToPrint', formatInformation, printImmediately, last)
}

function removeCoverLabel () {
  const coverLabel = document.getElementById('coverLabel')
  coverLabel.parentNode.removeChild(coverLabel)
}

function fillCoverLabel () {
  addUsername()
  addDate()
}

function addUsername () {
  document.getElementById('currentUsername').innerHTML = config.get('username')
}

function addDate () {
  document.getElementById('currentDate').innerHTML = moment().format('DD.MM.YYYY')
}
