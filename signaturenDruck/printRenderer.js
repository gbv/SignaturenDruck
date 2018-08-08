// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// to work with files
const fs = require('fs')

// requires lodash
const _ = require('lodash')

// // to access the local config file
// const Store = require('electron-store')
// const config = new Store({cwd: 'C:\\Export\\'})

const username = require('username')

// required for ipc calls to the main process
const ipc = require('electron').ipcRenderer

window.onload = function () {
  ipc.on('toPrint', function (event, data) {
    console.log('on printRenderer', event, data)
    main(data)
  })
}

// function changeStyle () {
//   let newConfig = loadConfig()
//   let shelfmark = document.getElementsByClassName('shelfmark')
//   let width = newConfig.big.label.width
//   let height = newConfig.big.label.height
//   let unit = newConfig.einheit
//   for (let i = 0; i < shelfmark.length; i++) {
//     shelfmark[i].style.width = '' + width + unit
//     shelfmark[i].style.height = '' + height + unit
//   }
// }

// function loadConfig () {
//   return config.store
// }

function main (ids) {
  let file = fs.readFileSync('signaturen.json', 'utf8')
  console.log('ids: ', ids)
  addUsername()
  addDate()
  // needs to sum up all the counts per id
  let countAll = 0
  let idNr = 1
  _.forEach((ids), function (value) {
    if (value.count >= 1 && value.count <= 99) {
      countAll += Number(value.count)
    } else {
      if (value.count > 99) {
        countAll += 99
        value.count = 99
      } else {
        countAll += 1
        value.count = 1
      }
    }
  })
  let size = _.groupBy(_.forEach(ids, function (value) { return value }), 'size')
  console.log(size)
  if (size.small) {
    // ipc.send("printSize", "small");
    _.forEach(size.small, function (value) {
      console.log(value)
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
              div.className = 'shelfmark indent'
              console.log('short object', objct)
            } else {
              div.className = 'shelfmark center'
            }
            div.id = id
            if (objct.short && length == 1) {
              console.log(shelfmark.txt)
              let text = shelfmark.txt[0]
              let textSplit = text.split(' ')
              let countSpaces = textSplit.length
              let i = 0
              let j = 0
              while (countSpaces >= 2) {
                shelfmark.txt = []
                shelfmark.txt[j] = textSplit[i] + ' ' + textSplit[i + 1]
                countSpaces -= 2
                i += 2
                j++
                console.log(countSpaces)
              }
              if (countSpaces == 1) {
                shelfmark.txt[j] = textSplit[i]
              }
            }
            console.log('nr. of lines: ', shelfmark.txt.length)
            let lineCount = shelfmark.txt.length
            shelfmark.txt.forEach(element => {
              if (lineCount === 1) {
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
            console.log('idNr: ', idNr, 'countAll: ', countAll)
            if (idNr < countAll) {
              let pdfPageBreak = document.createElement('div')
              // pdfPageBreak.className = 'html2pdf__page-break'
              document.getElementById('toPrint').appendChild(pdfPageBreak)
              idNr++
            }
          }
        }
      })
    })
  }
  if (size.big) {
    // ipc.send("printSize", "big");
    _.forEach(size.big, function (value) {
      console.log(value)
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
            console.log('idNr: ', idNr, 'countAll: ', countAll)
            if (idNr < countAll) {
              let pdfPageBreak = document.createElement('div')
              // pdfPageBreak.className = 'html2pdf__page-break'
              document.getElementById('toPrint').appendChild(pdfPageBreak)
              idNr++
            }
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
