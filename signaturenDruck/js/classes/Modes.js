const fs = require('fs')
const C = require('./Config')
const defaultProgramPath = new C().defaultPath

class Modes {
  /*
  ----- Class getter and setter -----
   */
  get selectOptions () {
    return this._selectOptions
  }

  get modes () {
    return this._modes
  }
  /*
  ----- End Class getter and setter -----
   */

  /*
  ----- Constructor -----
   */
  constructor () {
    this._selectOptions = []
    this._modes = []
    this.loadModes()
  }
  /*
  ----- End Constructor -----
   */

  loadModes () {
    const files = fs.readdirSync(defaultProgramPath + '\\Modi')
    for (const file of files) {
      const fileName = file.split('.json')[0]
      this._selectOptions.push(fileName)
      this._modes[fileName] = JSON.parse(fs.readFileSync(defaultProgramPath + '\\Modi\\' + file, 'utf8'))
    }
  }
}

module.exports = Modes
