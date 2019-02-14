const _ = require('lodash')
const fs = require('fs')
const XRegExp = require('xregexp')
const { remote } = require('electron')
const config = remote.getGlobal('config')

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

  changePreview (id, file, formats) {
    this.removeSignaturePreview()

    let format = document.getElementById('templateSelect_' + id).value
    let formatName = document.getElementById('templateSelect_' + id).value
    this.myNode.className = 'format_' + format

    if (!String(id).includes('m_')) {
      let found = _.find(JSON.parse(Preview.readFile(file)), {'id': Number(id)})
      this.searchAndShow(found, formats[formatName].lines, this.getLinesByFormat(formats[formatName], found.txtOneLine))
      document.getElementsByClassName('innerBox')[0].className = 'innerBox'
    } else {
      let cleanId = id.split('m_')[1]
      this.checkIfNoIndent(cleanId, formats[formatName].lines)
    }
  }

  removeSignaturePreview () {
    this.myNode.className = ''
    removeOld(this.myNode)
  }

  getLinesByFormat (format, shelfmarkRAW) {
    let delimiter = format.lineDelimiter
    if (format.splitByRegEx) {
      let regExString = ''
      format.splitByRegEx.forEach(element => {
        regExString += element
      })
      let regEx = XRegExp(regExString, 'x')
      let lines = XRegExp.exec(shelfmarkRAW, regEx)
      if (lines === null) {
        return shelfmarkRAW
      } else {
        if (lines.length > 1) {
          lines.shift()
        }
        return lines
      }
    } else {
      if (delimiter === '') {
        return shelfmarkRAW
      } else {
        return shelfmarkRAW.split(delimiter)
      }
    }
  }

  searchAndShow (found, formatLines, linesArray) {
    let lines = found.txtLength
    let id = found.id
    let oneLine = found.txtOneLine
    if (found !== undefined) {
      if (lines <= 2 && config.get('mode.useMode') && config.get('mode.defaultMode') === 'thulbMode') {
        if (document.getElementById('short_' + id).checked) {
          this.showData(found.txt, formatLines)
        } else {
          this.showData(oneLine, formatLines)
        }
      } else {
        if (Number(formatLines) === 1) {
          this.showData(oneLine, formatLines)
        } else {
          this.showData(linesArray, formatLines)
        }
      }
    }
  }

  checkIfNoIndent (cleanId, formatLines) {
    this.showData(this._manualSignature[cleanId].lineTxts, formatLines)
    if (this._manualSignature[cleanId].removeIndent) {
      document.getElementsByClassName('innerBox')[0].className = 'innerBox noIndent'
    } else {
      document.getElementsByClassName('innerBox')[0].className = 'innerBox'
    }
  }

  showData (shelfmark, formatLines) {
    let i = 1
    let line
    let innerBox = document.createElement('div')
    innerBox.className = 'innerBox'
    createPreviewLines(innerBox, formatLines)
    this.myNode.appendChild(innerBox)
    if (Array.isArray(shelfmark)) {
      shelfmark.forEach(element => {
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
    } else {
      line = document.getElementById('line_' + i)
      if (config.get('mode.useMode') && config.get('mode.defaultMode') === 'thulbMode') {
        line.innerHTML = shelfmark.split(config.get('newLineAfter')).join(' ')
      } else {
        line.innerHTML = shelfmark
      }
    }
  }

}

/*
Private Area
 */
function removeOld(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function createPreviewLines(innerBox, formatLines)
{
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