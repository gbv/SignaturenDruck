// requires remote from electron to retrieve global var
const { remote } = require('electron')
const config = remote.getGlobal('config')
// requires the dataExtractK10plus-module
const DataExtractK10plus = require('./dataExtractK10plus.js')
// requires the shelfmark class
const Shelfmark = require('../shelfmark.js')
const getLabelSize = require('../getLabelSize.js')
const createMultipleLines = require('../createMultipleLines.js')

module.exports = function (allLines) {
  let obj = {
    all: []
  }
  let sig = new Shelfmark()
  let extract = new DataExtractK10plus()
  let ppnAktuell = ''
  let plainTxt = ''

  allLines.map((line) => {
    let first4 = extract.firstFour(line)
    if (first4 === '0100') {
      sig.ppn = ppnAktuell = extract.ppn(line)
    } else if (first4.substring(0, 1) === 'E' && first4.substring(1, 4) >= 1 && first4.substring(1, 4) <= 999) {
      sig.exNr = extract.exNr(line)
    } else if (first4 === '7100') {
      plainTxt = extract.txt(line)
      let big = getLabelSize(plainTxt)
      if (big === false) {
        sig.bigLabel = false
      }
      let txt = plainTxt.split(config.get('newLineAfter'))
      sig.txtLength = txt.length
      if (config.get('mode.useMode') && config.get('mode.defaultMode') === 'thulbMode') {
        if (txt.length === 6) {
          sig.txt = txt
          sig.txtOneLine = plainTxt
        } else {
          sig.txt = [plainTxt]
          sig.txtOneLine = plainTxt
        }
      } else {
        sig.txt = txt
        sig.txtOneLine = plainTxt
      }
    } else if (first4 === '7903') {
      sig.date = extract.date(line)
    }
    if (sig.allSet()) {
      if (config.get('mode.useMode') && config.get('mode.defaultMode') === 'thulbMode') {
        if (sig.txtLength < 3) {
          sig.txt = createMultipleLines(plainTxt)
          sig.txtLength = sig.txt.length
        }
      }
      obj.all.push(sig.shelfmark)
      sig = new Shelfmark()
      sig.ppn = ppnAktuell
    }
  })
  return obj
}
