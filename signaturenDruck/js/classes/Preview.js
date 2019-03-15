const _ = require('lodash')
const fs = require('fs')
const XRegExp = require('xregexp')

class Preview {
  /*
  ----- Constructor -----
   */
  constructor () {
    this.myNode = document.getElementById('previewBox')
  }
  /*
  ----- End Constructor -----
   */

  static readFile (file) {
    return fs.readFileSync(file)
  }

  changePreview (id, file, formats, manualSignatures) {
    this.removeSignaturePreview()

    let format = document.getElementById('templateSelect_' + id).value
    let formatName = document.getElementById('templateSelect_' + id).value
    this.myNode.className = 'format_' + format

    if (!String(id).includes('m_')) {
      let found = _.find(JSON.parse(Preview.readFile(file)), { 'id': Number(id) })
      this.searchAndShow(found, formats[formatName].lines, formatName)
      document.getElementsByClassName('innerBox')[0].className = 'innerBox'
    } else {
      let cleanId = id.split('m_')[1]
      this.checkIfNoIndent(cleanId, manualSignatures, formats[formatName].lines, formatName)
    }
  }

  removeSignaturePreview () {
    this.myNode.className = ''
    removeOld(this.myNode)
  }

  searchAndShow (found, formatLines, formatName) {
    let lines = _.find(found.modes, { 'name': formatName }).lines
    if (found !== undefined) {
      this.showData(lines, formatLines)
    }
  }

  checkIfNoIndent (cleanId, manualSignatures, formatLines, formatName) {
    let lines = _.find(manualSignatures[cleanId].modes, { 'name': formatName }).lines
    this.showData(lines, formatLines)
    if (manualSignatures[cleanId].removeIndent) {
      document.getElementsByClassName('innerBox')[0].className = 'innerBox noIndent'
    } else {
      document.getElementsByClassName('innerBox')[0].className = 'innerBox'
    }
  }

  showData (lines, formatLines) {
    let i = 1
    let line
    let innerBox = document.createElement('div')
    innerBox.className = 'innerBox'
    createPreviewLines(innerBox, formatLines)
    this.myNode.appendChild(innerBox)
    lines.forEach(element => {
      line = document.getElementById('line_' + i)
      if (line !== null) {
        if (element !== '') {
          line.innerHTML = element
        }
        i++
      } else {
        innerBox = document.getElementsByClassName('innerBox')[0]
        line = document.createElement('p')
        line.id = 'line_' + i
        line.className = 'line_' + i
        if (element !== '') {
          line.innerHTML = element
        }
        innerBox.appendChild(line)
        i++
      }
    })
  }
}

/*
Private Area
 */
function removeOld (node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function createPreviewLines (innerBox, formatLines) {
  for (let i = 1; i <= formatLines; i++) {
    let line = document.createElement('p')
    line.id = 'line_' + i
    line.className = 'line_' + i
    let emptyLine = document.createElement('br')
    line.appendChild(emptyLine)
    innerBox.appendChild(line)
  }
}

module.exports = Preview
