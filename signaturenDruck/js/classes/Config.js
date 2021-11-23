const username = require('username')

const defaultPath = 'C:\\SignaturenDruck'
const defaultPathThulb = 'C:/Users/' + username.sync() + '/SignaturenDruck/'

class Config {
  /*
 ----- Class getter and setter -----
  */
  get defaultPath () {
    return this._path
  }

  set defaultPath (value) {
    this._path = value
  }
  /*
 ----- End Class getter and setter -----
  */
  /*
  ----- Constructor -----
   */

  constructor (thulbBuild) {
    if (thulbBuild) {
      this._path = defaultPathThulb
    } else {
      this._path = defaultPath
    }
  }
  /*
  ----- End Constructor -----
   */
}

module.exports = Config
