const fs = require('fs')
const { remote } = require('electron')
const defaultProgramPath = remote.getGlobal('defaultProgramPath')
// if (config === undefined) {
//   const config = remote.getGlobal('config')
// }
// if (!config.get('SRU.useSRU')) {
//   const defaultProgramPath = remote.getGlobal('defaultProgramPath')
// } else {
//   defaultProgramPath = global.defaultProgramPath
// }

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
    let files = fs.readdirSync(defaultProgramPath + '\\Modi')
    for (let file of files) {
      let fileName = file.split('.json')[0]
      this._selectOptions.push(fileName)
      this._modes[fileName] = JSON.parse(fs.readFileSync(defaultProgramPath + '\\Modi\\' + file, 'utf8'))
    }
  }
}

module.exports = Modes
