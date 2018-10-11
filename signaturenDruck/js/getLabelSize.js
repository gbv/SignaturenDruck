// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})

module.exports = function labelSize (txt) {
  let numberOfSeperators = getCountOfSeparators(txt, config.get('newLineAfter'))
  let numberOfWhitespaces = getCountOfSeparators(txt, ' ')
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
