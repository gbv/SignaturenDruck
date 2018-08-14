// required for file stuff
const fs = require('fs')
// requires lodash
const _ = require('lodash')

module.exports = function (id) {
  let isSmall = false
  let isShort = false
  if (document.getElementById('short_' + id)) {
    isSmall = true
    if (document.getElementById('short_' + id).checked) {
      isShort = true
    }
  }
  if (isSmall) {
    let previewBox = document.getElementById('previewBox')
    previewBox.classList.remove('big')
    previewBox.classList.remove('indent')
    previewBox.classList.add('small')
    previewBox.classList.add('center')
    if (isShort) {
      previewBox.classList.remove('center')
      previewBox.classList.add('indent')
    }
  } else {
    let previewBox = document.getElementById('previewBox')
    previewBox.classList.remove('small')
    previewBox.classList.remove('center')
    previewBox.classList.add('big')
    previewBox.classList.add('indent')
  }
  let myNode = document.getElementById('previewBox')
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild)
  }
  let file = fs.readFileSync('signaturen.json', 'utf8')
  _.forEach(JSON.parse(file), function (key, value) {
    let sig = ''
    let found = _.find(key, { 'id': Number(id) })
    if (found !== undefined) {
      sig = found
    }
    if (sig != '') {
      let length = sig.txtLength
      let id = sig.id
      let i = 1
      let div = document.createElement('div')
      let line = document.createElement('p')
      div.className = 'shelfmark center'
      if (isSmall) {
        if (isShort || length != 1) {
          div.className = 'shelfmark indent'
        }
      }
      div.id = id
      if (document.getElementById('short_' + id)) {
        if (document.getElementById('short_' + id).checked && length == 1) {
          let text = sig.txt[0]
          let indxSlash = text.indexOf('/')
          let indxColon = text.indexOf(':')
          sig.txt = []
          sig.txt[0] = text
          let i = 0
          if (indxSlash !== -1) {
            sig.txt[0] = text.substring(0, indxSlash + 1)
            sig.txt[1] = text.substring(indxSlash + 1)
            i = 1
          }
          if (indxColon !== -1) {
            if (i === 0) {
              sig.txt[0] = text.substring(0, indxColon + 1)
              sig.txt[1] = text.substring(indxColon + 1)
              i = 1
            } else {
              let i = 0
              let txt = []
              let length = sig.txt.length
              sig.txt.forEach(element => {
                let indx = element.indexOf(':')
                if (indx !== -1) {
                  let j = 0
                  while (j < i) {
                    txt[j] = sig.txt[j]
                    j++
                  }
                  let k = i
                  txt[k] = element.substring(0, indx)
                  k++
                  txt[k] = element.substring(indx)
                  k++
                  while (k <= length) {
                    txt[k] = sig.txt[k - 1]
                    k++
                  }
                  sig.txt = txt
                }
                i++
              })
            }
          }
          i = 0
          let txt = []
          let length = sig.txt.length
          sig.txt.forEach(element => {
            let elementParts = element.split(' ')
            if (elementParts.length >= 3) {
              let j = 0
              while (j < i) {
                txt[j] = sig.txt[j]
                j++
              }
              let k = i
              txt[k] = elementParts[0] + ' ' + elementParts[1]
              k++
              txt[k] = element.substring(txt[k - 1].length)
              k++
              while (k <= length) {
                txt[k] = sig.txt[k - 1]
                k++
              }
              sig.txt = txt
            }
            i++
          })
        }
      }
      sig.txt.forEach(element => {
        line.className = 'previewLine'
        line.id = 'line' + i
        if (element == '') {
          let emptyLine = document.createElement('br')
          line.appendChild(emptyLine)
        } else {
          line.innerHTML = element
        }
        document.getElementById('previewBox').appendChild(line)
        line = document.createElement('p')
        i++
      })
    }
  })
}
