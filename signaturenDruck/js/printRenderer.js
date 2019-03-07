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

const moment = require('moment')

const formats = require('./classes/Formats')

window.onload = function () {
  formats.addStyleFiles()
}

ipcRenderer.on('toPrint', function (event, formatInformation, printInformation) {
  addUsername()
  addDate()
  createPage(formatInformation, printInformation)
})

function createPage (formatInformation, printInformation) {
  document.getElementById('toPrint').className = 'format_' + formatInformation.name
  let emptyLine = document.createElement('br')
  _.each(printInformation, data => {
    for (let i = 1; i <= data.count; i++) {
      let div = document.createElement('div')
      data.removeIndent !== undefined ? div.className = 'innerBox noIndent' : div.className = 'innerBox'
      div.id = data.id + '_' + i
      if (formatInformation.lines > 1) {
        _.each(data.data.txt, (line, i) => {
          let p = document.createElement('p')
          p.className = 'line_' + (parseInt(i) + 1)
          line === '' ? p.appendChild(emptyLine) : p.innerHTML = line
          div.appendChild(p)
        })
      } else {
        let p = document.createElement('p')
        p.className = 'line_1'
        p.innerHTML = data.data.txtOneLine
        div.appendChild(p)
      }
      document.getElementById('toPrint').appendChild(div)
    }
  })
}

function addUsername () {
  document.getElementById('currentUsername').innerHTML = username.sync()
}

function addDate () {
  document.getElementById('currentDate').innerHTML = moment().format('DD.MM.YYYY')
}
