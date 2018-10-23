// requires lodash
const _ = require('lodash')

// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})
// requires the dataExtract-module
const DataExtract = require('./dataExtract.js')
// requires the shelfmark class
const Shelfmark = require('./shelfmark.js')
const getLabelSize = require('./getLabelSize.js')
const createMultipleLines = require('./createMultipleLines.js')

module.exports = function (allLines) {
  let obj = {
    all: []
  }
  let sig = new Shelfmark()
  let extract = new DataExtract()
  let ppnAktuell = ''
  let plainTxt = ''

  allLines.map((line) => {
    let first4 = extract.firstFour(line)
    if (first4 === '0100') {
      sig.ppn = ppnAktuell = extract.ppn(line)
    } else if (first4 >= 7001 && first4 <= 7099) {
      sig.exNr = extract.exNr(line)
    } else if (first4 === '7100') {
      plainTxt = extract.txt(line)
      let big = getLabelSize(plainTxt)
      if (big === false) {
        sig.bigLabel = false
      }
      let txt = plainTxt.split(config.get('newLineAfter'))
      sig.txtLength = txt.length
      if (config.get('thulbMode')) {
        if (txt.length === 6) {
          sig.txt = txt
          _.forEach(txt, function (value) {
            sig.txtOneLine += value + ' '
          })
        } else {
          let txt = [plainTxt]
          sig.txt = txt
          sig.txtOneLine = plainTxt
        }
      } else {
        sig.txt = txt
        sig.txtOneLine = plainTxt
      }
    } else if (first4 === '7901') {
      sig.date = extract.date(line)
    }
    if (sig.allSet()) {
      if (config.get('thulbMode')) {
        if (sig.txtLength < 3) {
          sig.txt = createMultipleLines(plainTxt)
        }
      }
      obj.all.push(sig.shelfmark)
      sig = new Shelfmark()
      sig.ppn = ppnAktuell
    }
  })
  return obj
}
