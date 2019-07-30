// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the fs-module
const fs = require('fs')

// requires the lodash-module
const _ = require('lodash')

// requires the username-module
const username = require('username')

// required for ipc calls to the main process
const { ipcRenderer, remote } = require('electron')
const config = remote.getGlobal('config')

const moment = require('moment')

const formats = require('./classes/Formats')

window.onload = function () {
  formats.addStyleFiles()
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
  _.each(printInformation, data => {
    for (let i = 1; i <= data.count; i++) {
      let div = document.createElement('div')
      data.data.removeIndent ? div.className = 'innerBox noIndent' : div.className = 'innerBox'
      div.id = data.id + '_' + i
      let lines = _.find(data.data.modes, { 'format': formatInformation.name }).lines
      for (let j = 0; j < formatInformation.lines && j < lines.length; j++) {
        let p = document.createElement('p')
        p.className = 'line_' + (j + 1)
        lines[j] === '' ? p.appendChild(document.createElement('br')) : p.innerHTML = lines[j]
        div.appendChild(p)
      }
      document.getElementById('toPrint').appendChild(div)
    }
  })
  ipcRenderer.send('readyToPrint', formatInformation, printImmediately, last)
}

function removeCoverLabel () {
  let coverLabel = document.getElementById('coverLabel')
  coverLabel.parentNode.removeChild(coverLabel)
}

function fillCoverLabel () {
  addUsername()
  addDate()
}

function addUsername () {
  document.getElementById('currentUsername').innerHTML = username.sync()
}

function addDate () {
  document.getElementById('currentDate').innerHTML = moment().format('DD.MM.YYYY')
}
