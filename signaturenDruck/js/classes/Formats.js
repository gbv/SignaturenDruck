const fs = require('fs')
const C = require('./Config')
const THULBBUILD = true
const defaultProgramPath = new C(THULBBUILD).defaultPath

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
    const files = fs.readdirSync(defaultProgramPath + '\\FormateCSS')
    for (const file of files) {
      if (file.endsWith('.css')) {
        const fileName = file.split('.css')[0]
        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.type = 'text/css'
        cssLink.href = defaultProgramPath + '/FormateCSS/' + fileName + '.css'
        document.head.appendChild(cssLink)
      }
    }
  }

  loadFormats () {
    const files = fs.readdirSync(defaultProgramPath + '\\Formate')
    let failedFormats = ''
    for (const file of files) {
      if (file.endsWith('.json')) {
        const fileName = file.split('.json')[0]
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
