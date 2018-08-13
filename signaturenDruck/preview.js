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
          let textSplit = text.split(' ')
          let countSpaces = textSplit.length
          let i = 0
          let j = 0
          while (countSpaces >= 2) {
            sig.txt = []
            sig.txt[j] = textSplit[i] + ' ' + textSplit[i + 1]
            countSpaces -= 2
            i += 2
            j++
          }
          if (countSpaces == 1) {
            sig.txt[j] = textSplit[i]
          }
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
