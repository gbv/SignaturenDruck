const username = require('username')

const USERBUILD = true
const defaultPathC = 'C:\\SignaturenDruck'
const defaultPathUser = 'C:\\Users\\' + username.sync() + '\\SignaturenDruck'

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

  constructor () {
    if (USERBUILD) {
      this._path = defaultPathUser
    } else {
      this._path = defaultPathC
    }
  }
  /*
  ----- End Constructor -----
   */
}

module.exports = Config
