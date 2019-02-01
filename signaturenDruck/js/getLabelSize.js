// requires remote from electron to retrieve global var
const { remote } = require('electron')
const config = remote.getGlobal('config')

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
