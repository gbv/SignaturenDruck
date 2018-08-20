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

ipc.on('toPrint', function (event, data, dataMan) {
  main(data, dataMan)
  ipc.send('printed', true)
})

function main (ids, dataMan) {
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
    document.getElementById('userCard').className += ' small'
    document.getElementById('currentUsername').className += ' small'
    document.getElementById('currentDate').className += ' small'
    _.forEach(size.small, function (value) {
      let objct = value
      if (objct.manual) {
        let manualId = objct.id.split('m_')[1]
        let shelfmark = dataMan[manualId]
        for (let count = 0; count < objct.count; count++) {
          let length = shelfmark.lines
          let id = objct.id
          let i = 1
          let div = document.createElement('div')
          let line = document.createElement('p')
          if (objct.short || length != 1) {
            div.className = 'shelfmark indent small'
          } else {
            div.className = 'shelfmark center small'
          }
          div.id = id
          let text = dataMan[manualId].lineTxts
          let lineCount = length
          text.forEach(element => {
            if ((lineCount == 1) && (text.length == 1)) {
              line.className = 'shelfmarkLine_' + i + ' oneLine' + ' small'
            } else {
              line.className = 'shelfmarkLine_' + i + ' small'
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
      } else {
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
              if (objct.short && length == 1) {
                let text = shelfmark.txt[0]
                let indxSlash = text.indexOf('/')
                let indxColon = text.indexOf(':')
                shelfmark.txt = []
                shelfmark.txt[0] = text
                let i = 0
                if (indxSlash !== -1) {
                  shelfmark.txt[0] = text.substring(0, indxSlash + 1)
                  shelfmark.txt[1] = text.substring(indxSlash + 1)
                  i = 1
                }
                if (indxColon !== -1) {
                  if (i === 0) {
                    shelfmark.txt[0] = text.substring(0, indxColon + 1)
                    shelfmark.txt[1] = text.substring(indxColon + 1)
                    i = 1
                  } else {
                    let i = 0
                    let txt = []
                    let length = shelfmark.txt.length
                    shelfmark.txt.forEach(element => {
                      let indx = element.indexOf(':')
                      if (indx !== -1) {
                        let j = 0
                        while (j < i) {
                          txt[j] = shelfmark.txt[j]
                          j++
                        }
                        let k = i
                        txt[k] = element.substring(0, indx)
                        k++
                        txt[k] = element.substring(indx)
                        k++
                        while (k <= length) {
                          txt[k] = shelfmark.txt[k - 1]
                          k++
                        }
                        shelfmark.txt = txt
                      }
                      i++
                    })
                  }
                }
                i = 0
                let txt = []
                let length = shelfmark.txt.length
                shelfmark.txt.forEach(element => {
                  let elementParts = element.split(' ')
                  if (elementParts.length >= 3) {
                    let j = 0
                    while (j < i) {
                      txt[j] = shelfmark.txt[j]
                      j++
                    }
                    let k = i
                    txt[k] = elementParts[0] + ' ' + elementParts[1]
                    k++
                    txt[k] = element.substring(txt[k - 1].length)
                    k++
                    while (k <= length) {
                      txt[k] = shelfmark.txt[k - 1]
                      k++
                    }
                    shelfmark.txt = txt
                  }
                  i++
                })
              }
              let text = shelfmark.txt
              let lineCount = shelfmark.txt.length
              text.forEach(element => {
                if ((lineCount === 1) && (text.length === 1)) {
                  line.className = 'shelfmarkLine_' + i + ' oneLine' + ' small'
                } else {
                  line.className = 'shelfmarkLine_' + i + ' small'
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
      }
    })
  }
  if (size.big) {
    _.forEach(size.big, function (value) {
      let objct = value
      if (objct.manual) {
        let manualId = objct.id.split('m_')[1]
        let shelfmark = dataMan[manualId]
        let id = shelfmark.id
        let i = 1
        let div = document.createElement('div')
        let line = document.createElement('p')
        div.className = 'shelfmark indent'
        div.id = id
        shelfmark.lineTxts.forEach(element => {
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
      } else {
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
      }
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
