// requires remote from electron to retrieve global var
const { remote } = require('electron')
const config = remote.getGlobal('config')
const _ = require('lodash')
// requires the dataExtractOld-module
const DataExtractOld = require('./dataExtractOld.js')
// requires the shelfmark class
const Shelfmark = require('../shelfmark.js')
const Modes = require('../classes/Modes')
const Formats = require('../classes/Formats')
const FormatLinesByMode = require('../classes/FormatLinesByMode')
const LocationCheck = require('../classes/LocationCheck')

module.exports = function (allLines) {
  let obj = {
    all: []
  }
  let sig = new Shelfmark()
  let extract = new DataExtractOld()
  let ppnAktuell = ''
  let plainTxt = ''
  let mode = new Modes()
  let formats = new Formats()
  let formatArray = formats.formats

  allLines.map((line) => {
    let first4 = extract.firstFour(line)
    if (first4 === '0100') {
      sig.ppn = ppnAktuell = extract.ppn(line)
    } else if (first4 >= 7001 && first4 <= 7099) {
      sig.exNr = extract.exNr(line)
    } else if (first4 === '7100') {
      plainTxt = extract.txt(line)
      sig.location = extract.location(line)
      sig.loanIndication = extract.loanIndication(line)
      sig.txtOneLine = plainTxt
      let allSubModeData = mode.modes[config.get('mode.defaultMode')].subModes
      _.forEach(allSubModeData, function (value) {
        let data = {
          'format': '',
          'lines': ''
        }
        data.format = value.format
        if (config.get('filterByLoc') && !LocationCheck.locDoesMatch(value.locRegEx, sig.location)) {
          data.lines = null
        } else {
          if (value.useRegEx) {
            let regex = new RegExp(value.regEx)
            if (regex.test(plainTxt) && sig.defaultSubMode === '') {
              sig.defaultSubMode = value.id
            }
            let lines = plainTxt.match(regex)
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
    } else if (first4 === '7901') {
      sig.date = extract.date(line)
    }
    if (sig.allSet()) {
      obj.all.push(sig.shelfmark)
      sig = new Shelfmark()
      sig.ppn = ppnAktuell
    }
  })
  return obj
}
