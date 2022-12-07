const Store = require('electron-store')
const C = require('../classes/Config')
const defaultProgramPath = new C().defaultPath
const config = new Store({ cwd: defaultProgramPath })
const _ = require('lodash')
// requires the dataExtractK10plus-module
const DataExtractK10plus = require('./dataExtractK10plus.js')
// requires the shelfmark class
const Shelfmark = require('../shelfmark.js')
const Modes = require('../classes/Modes')
const FormatLinesByMode = require('../classes/FormatLinesByMode')
const LocationCheck = require('../classes/LocationCheck')

module.exports = function (allLines, formats) {
  const obj = {
    all: []
  }
  let sig = new Shelfmark()
  const extract = new DataExtractK10plus()
  let ppnAktuell = ''
  let plainTxt = ''
  const mode = new Modes()
  const formatArray = formats

  _.forEach(allLines, function (line) {
    const first4 = extract.firstFour(line)
    if (first4 === '0100') {
      sig.ppn = ppnAktuell = extract.ppn(line)
    } else if (first4.substring(0, 1) === 'E' && first4.substring(1, 4) >= 1 && first4.substring(1, 4) <= 999) {
      sig.exNr = extract.exNr(line)
    } else if (first4 === '7100') {
      plainTxt = extract.txt(line)
      sig.location = extract.location(line)
      sig.loanIndication = extract.loanIndication(line)
      sig.txtOneLine = plainTxt
      const allSubModeData = mode.modes[config.get('mode.defaultMode')].subModes
      _.forEach(allSubModeData, function (value) {
        const data = {
          format: '',
          lines: ''
        }
        data.format = value.format
        if (config.get('filterByLoc') && !LocationCheck.locDoesMatch(value.locRegEx, sig.location)) {
          data.lines = null
        } else {
          if (value.useRegEx) {
            const regex = new RegExp(value.regEx)
            if (regex.test(plainTxt) && sig.defaultSubMode === '') {
              sig.defaultSubMode = value.id
            }
            const lines = plainTxt.match(regex)
            if (lines !== null) {
              lines.shift()
            }
            data.lines = lines
            if (data.lines !== null) {
              data.lines = FormatLinesByMode.formatLines(sig.location, data.lines, value.result)
            }
          } else {
            data.lines = plainTxt.split(value.delimiter)
            if (sig.defaultSubMode === '') {
              sig.defaultSubMode = value.id
            }
            if (data.lines !== null) {
              data.lines = FormatLinesByMode.formatLines(sig.location, data.lines, value.result, formatArray[value.format].lines)
            }
          }
        }
        sig.subModes.push(data)
      })
    } else if (first4 === '7903') {
      sig.date = extract.date(line)
      if (sig.allSet()) {
        obj.all.push(sig.shelfmark)
        sig = new Shelfmark()
        sig.ppn = ppnAktuell
      }
    }
  })
  return obj
}
