const Store = require('electron-store')
const C = require('./classes/Config')
const THULBBUILD = true
const defaultProgramPath = new C(THULBBUILD).defaultPath
const config = new Store({ cwd: defaultProgramPath })

module.exports = function labelSize (txt) {
  const numberOfSeperators = getCountOfSeparators(txt, config.get('newLineAfter'))
  const numberOfWhitespaces = getCountOfSeparators(txt, ' ')
  if ((numberOfSeperators >= 2) && (numberOfSeperators > numberOfWhitespaces)) {
    return true
  } else {
    return false
  }
}

// returns number of separators
function getCountOfSeparators (txt, separator) {
  return txt.split(separator).length
}
