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

ipc.on('toPrint', function (event, data) {
  main(data)
})

function main (ids) {
  let file = fs.readFileSync('signaturen.json', 'utf8')
  addUsername()
  addDate()

  _.forEach((ids), function (value) {
    if ((value.count < 1) || (value.count > 99)) {
      if (value.count > 99) {
        value.count = 99
      } else {
        value.count = 1
      }
    }
  })
  let size = _.groupBy(_.forEach(ids, function (value) { return value }), 'size')
  if (size.small) {
    _.forEach(size.small, function (value) {
      let objct = value
      _.forEach(JSON.parse(file), function (key, value) {
        let shelfmark = ''
        let found = _.find(key, {'id': Number(objct.id)})
        if (found !== undefined) {
          shelfmark = found
        }
        if (shelfmark != '') {
          for (let count = 0; count < objct.count; count++) {
            let length = shelfmark.txtLength
            let id = shelfmark.id
            let i = 1
            let div = document.createElement('div')
            let line = document.createElement('p')
            if (objct.short || length != 1) {
              div.className = 'shelfmark indent small'
            } else {
              div.className = 'shelfmark center small'
            }
            div.id = id
            let text = shelfmark.txt
            if (objct.short && length == 1) {
              text = shelfmark.txt[0]
              let textSplit = text.split(' ')
              let countSpaces = textSplit.length
              let i = 0
              let j = 0
              text = []
              while (countSpaces >= 2) {
                text[j] = textSplit[i] + ' ' + textSplit[i + 1]
                countSpaces -= 2
                i += 2
                j++
              }
              if (countSpaces == 1) {
                text[j] = textSplit[i]
              }
            }
            let lineCount = shelfmark.txt.length
            text.forEach(element => {
              if ((lineCount === 1) && (text.length === 1)) {
                line.className = 'shelfmarkLine_' + i + ' oneLine'
              } else {
                line.className = 'shelfmarkLine_' + i
              }
              if (element == '') {
                let emptyLine = document.createElement('br')
                line.appendChild(emptyLine)
              } else {
                line.innerHTML = element
              }
              div.appendChild(line)
              line = document.createElement('p')
              i++
            })
            document.getElementById('toPrint').appendChild(div)
          }
        }
      })
    })
  }
  if (size.big) {
    _.forEach(size.big, function (value) {
      let objct = value
      _.forEach(JSON.parse(file), function (key, value) {
        let shelfmark = ''
        let found = _.find(key, {'id': Number(objct.id)})
        if (found !== undefined) {
          shelfmark = found
        }
        if (shelfmark != '') {
          for (let count = 0; count < objct.count; count++) {
            let id = shelfmark.id
            let i = 1
            let div = document.createElement('div')
            let line = document.createElement('p')
            div.className = 'shelfmark indent'
            div.id = id
            shelfmark.txt.forEach(element => {
              line.className = 'shelfmarkLine_' + i
              if (element == '') {
                let emptyLine = document.createElement('br')
                line.appendChild(emptyLine)
              } else {
                line.innerHTML = element
              }
              div.appendChild(line)
              line = document.createElement('p')
              i++
            })
            document.getElementById('toPrint').appendChild(div)
          }
        }
      })
    })
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
