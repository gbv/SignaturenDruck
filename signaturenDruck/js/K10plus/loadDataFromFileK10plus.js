// requires remote from electron to retrieve global var
const { remote } = require('electron')
const config = remote.getGlobal('config')
const _ = require('lodash')
// requires the dataExtractK10plus-module
const DataExtractK10plus = require('./dataExtractK10plus.js')
// requires the shelfmark class
const Shelfmark = require('../shelfmark.js')
const Modes = require('../classes/Modes')

module.exports = function (allLines) {
  let obj = {
    all: []
  }
  let sig = new Shelfmark()
  let extract = new DataExtractK10plus()
  let ppnAktuell = ''
  let plainTxt = ''
  let mode = new Modes()

  allLines.map((line) => {
    let first4 = extract.firstFour(line)
    if (first4 === '0100') {
      sig.ppn = ppnAktuell = extract.ppn(line)
    } else if (first4.substring(0, 1) === 'E' && first4.substring(1, 4) >= 1 && first4.substring(1, 4) <= 999) {
      sig.exNr = extract.exNr(line)
    } else if (first4 === '7100') {
      plainTxt = extract.txt(line)
      sig.location = extract.location(line)
      sig.loanIndication = extract.loanIndication(line)
      sig.txtOneLine = plainTxt
      let allSubModeData = mode.modes[config.get('mode.defaultMode')].subModes
      _.forEach(allSubModeData, function (value) {
        let regex = new RegExp(value.regEx)
        let data = {
          'name': '',
          'lines': ''
        }
        data.name = value.format
        if (regex.test(plainTxt) && sig.defaultSubMode === '') {
          sig.defaultSubMode = value.id
        }
        let lines = plainTxt.match(regex)
        if (lines !== null) {
          lines.shift()
        }
        data.lines = lines
        if (data.lines !== null) {
          data.lines = formatData(sig.location, data.lines, value.result)
        }
        sig.subModes.push(data)
      })
    } else if (first4 === '7903') {
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

function formatData (location, lines, linesOrdered) {
  let data = []
  let i = 0
  _.each(linesOrdered, function (value) {
    let regex1 = new RegExp(/\$\d{1,3}/)
    let regex2 = new RegExp(/\$LOC/)
    while (regex1.test(value)) {
      let matches = value.match(regex1)
      _.each(matches, function (match) {
        let group = match.split('$')[1]
        value = value.replace(match, lines[group - 1])
      })
    }
    if (regex2.test(value)) {
      value = value.replace('$LOC', location)
    }
    data[i] = value
    i++
  })
  return data
}
