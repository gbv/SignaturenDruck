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
const ipc = require('electron').ipcRenderer

const XRegExp = require('xregexp')

// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})

let formats = []

window.onload = function () {
  addStyleLinks()
  loadFormats()

  function addStyleLinks () {
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
}

ipc.on('toPrint', function (event, format, data, dataMan) {
  main(format, data, dataMan)
})

function main (format, data, dataMan) {
  let file = ''
  if (fs.existsSync('signaturen.json')) {
    file = fs.readFileSync('signaturen.json', 'utf8')
  }
  addUsername()
  addDate()

  createPage(format, data, dataMan, file)
}

function createPage (format, data, dataMan, file) {
  addStyle(format)
  _.forEach(data, function (value) {
    for (let count = 0; count < value.count; count++) {
      let div = document.createElement('div')
      div.className = 'innerBox'
      div.id = value.id + '.' + count
      let linesData = getData(value.id, formats[format])
      if (String(value.id).includes('m_')) {
        if (dataMan[value.id.split('m_')[1]].removeIndent) {
          div.className = 'innerBox noIndent'
        }
      }
      if (Number(formats[format].lines) === 1) {
        let p = document.createElement('p')
        p.className = 'line_1'
        if (Array.isArray(linesData)) {
          if (config.get('thulbMode')) {
            p.innerHTML = linesData[0].split(config.get('newLineAfter')).join(' ')
          } else {
            p.innerHTML = linesData[0]
          }
        } else {
          p.innerHTML = linesData
        }
        div.appendChild(p)
        document.getElementById('toPrint').appendChild(div)
      } else {
        let i = 1
        createLines(div, formats[format].lines, value.id, count)
        document.getElementById('toPrint').appendChild(div)
        if (Array.isArray(linesData)) {
          linesData.forEach(lineTxt => {
            let line = document.getElementById(value.id + '.' + count + '_line_' + i)
            if (lineTxt !== '') {
              line.innerHTML = lineTxt
            }
            i++
          })
        } else {
          let line = document.getElementById(value.id + '.' + count + '_line_' + i)
          if (config.get('thulbMode')) {
            line.innerHTML = linesData.split(config.get('newLineAfter')).join(' ')
          } else {
            line.innerHTML = linesData
          }
        }
      }
    }
  })

  function createLines (innerBox, formatLines, id, count) {
    for (let i = 1; i <= formatLines; i++) {
      let line = document.createElement('p')
      line.id = id + '.' + count + '_line_' + i
      line.className = 'line_' + i
      let emptyLine = document.createElement('br')
      line.appendChild(emptyLine)
      innerBox.appendChild(line)
    }
  }

  function getData (id, format) {
    let lines = format.lines
    if (id.includes('m_')) {
      if (Number(lines) === 1) {
        return dataMan[id.split('m_')[1]].lineTxts.join(' ')
      } else {
        return dataMan[id.split('m_')[1]].lineTxts
      }
    } else {
      let oneLine = _.find(JSON.parse(file), { 'id': Number(id) }).txtOneLine
      let delimiter = format.lineDelimiter
      if (format.splitByRegEx) {
        let regExString = ''
        format.splitByRegEx.forEach(element => {
          regExString += element
        })
        let regEx = XRegExp(regExString, 'x')
        let lines = XRegExp.exec(oneLine, regEx)
        if (lines !== null) {
          if (lines.length > 1) {
            lines.shift()
          }
          return lines
        } else {
          return oneLine
        }
      } else {
        if (delimiter === '') {
          return oneLine
        } else {
          return oneLine.split(delimiter)
        }
      }
    }
  }

  function addStyle (fileName) {
    document.getElementById('toPrint').className = 'format_' + fileName
  }
}

function addUsername () {
  document.getElementById('currentUsername').innerHTML = username.sync()
}

function addDate () {
  let today = new Date()
  let dd = today.getDate()
  let mm = today.getMonth() + 1
  let yyyy = today.getFullYear()

  if (dd < 10) {
    dd = '0' + dd
  }

  if (mm < 10) {
    mm = '0' + mm
  }

  today = dd + '.' + mm + '.' + yyyy
  document.getElementById('currentDate').innerHTML = today
}

function loadFormats () {
  let files = fs.readdirSync('C:\\Export\\SignaturenDruck\\Formate')
  for (let file of files) {
    let fileName = file.split('.json')[0]
    formats[fileName] = JSON.parse(fs.readFileSync('C:\\Export\\SignaturenDruck\\Formate\\' + file, 'utf8'))
  }
}
