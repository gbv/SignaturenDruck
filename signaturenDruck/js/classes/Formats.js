const fs = require('fs')
const { remote } = require('electron')
const defaultProgramPath = remote.getGlobal('defaultProgramPath')

class Formats {
  /*
  ----- Class getter and setter -----
   */
  get selectOptions () {
    return this._selectOptions
  }

  get formats () {
    return this._formats
  }
  /*
  ----- End Class getter and setter -----
   */

  /*
  ----- Constructor -----
   */
  constructor () {
    this._selectOptions = []
    this._formats = []
    Formats.addStyleFiles()
    this.loadFormats()
  }
  /*
  ----- End Constructor -----
   */

  static addStyleFiles () {
    let files = fs.readdirSync(defaultProgramPath + '\\FormateCSS')
    for (let file of files) {
      if (file.endsWith('.css')) {
        let fileName = file.split('.css')[0]
        let cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.type = 'text/css'
        cssLink.href = defaultProgramPath + '/FormateCSS/' + fileName + '.css'
        document.head.appendChild(cssLink)
      }
    }
  }

  loadFormats () {
    let files = fs.readdirSync(defaultProgramPath + '\\Formate')
    let failedFormats = ''
    for (let file of files) {
      if (file.endsWith('.json')) {
        let fileName = file.split('.json')[0]
        try {
          this._formats[fileName] = JSON.parse(fs.readFileSync(defaultProgramPath + '\\Formate\\' + file, 'utf8'))
          this._selectOptions.push(fileName)
        } catch (e) {
          if (failedFormats === '') {
            failedFormats += fileName
          } else {
            failedFormats += ', ' + fileName
          }
        }
      }
    }
    if (failedFormats !== '') {
      alert('Folgende Formate sind fehlerhaft und stehen nicht zur Verfügung:\n\n  ' + failedFormats)
    }
  }
}

module.exports = Formats
