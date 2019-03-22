const { remote } = require('electron')
const _ = require('lodash')
const Shelfmark = require('../shelfmark.js')
const Modes = require('./Modes.js')
const config = remote.getGlobal('config')
const Formats = require('../classes/Formats')
const FormatLinesByMode = require('../classes/FormatLinesByMode')

class ShelfmarksFromSRUData {
  /*
 ----- Class getter and setter -----
   */
  get data () {
    return this._data
  }

  /*
  ----- End Class getter and setter -----
   */

  /*
  ----- Constructor -----
   */
  constructor () {
    this._data = ''
  }
  /*
  ----- End Constructor -----
   */

  getShelfmark (xml) {
    let sig = new Shelfmark()
    let mode = new Modes()
    let formats = new Formats()
    let formatArray = formats.formats

    sig.error = getError(xml)
    if (sig.error === '') {
      sig.id = 99 // gets overwritten at a later stage
      sig.ppn = getPPN(xml)
      sig.date = getDate(xml)
      sig.txtOneLine = getTxt(xml)
      sig.exNr = getExNr(xml)
      sig.location = getLocation(xml)
      sig.loanIndication = getLoanIndication(xml)
      let allSubModeData = mode.modes[config.get('mode.defaultMode')].subModes
      _.forEach(allSubModeData, function (value) {
        let data = {
          'format': '',
          'lines': ''
        }
        data.format = value.format
        if (value.useRegEx) {
          let regex = new RegExp(value.regEx)
          if (regex.test(sig.txtOneLine) && sig.defaultSubMode === '') {
            sig.defaultSubMode = value.id
          }
          let lines = sig.txtOneLine.match(regex)
          if (lines !== null) {
            lines.shift()
          }
          data.lines = lines
          if (data.lines !== null) {
            data.lines = FormatLinesByMode.formatLines(sig.location, data.lines, value.result)
          }
        } else {
          data.lines = sig.txtOneLine.split(value.delimiter)
          if (sig.defaultSubMode === '') {
            sig.defaultSubMode = value.id
          }
          if (data.lines !== null) {
            data.lines = FormatLinesByMode.formatLines(sig.location, data.lines, value.result, formatArray[value.format].lines)
          }
        }
        sig.subModes.push(data)
      })
    }

    return sig.shelfmark
  }
}

function getPPN (object) {
  return _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '003@' })['subfield']['$t']
}

function getDate (object) {
  let parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '201B' })
  return _.find(parent['subfield'], { 'code': '0' })['$t']
}

function getTxt (object) {
  let parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A' })
  return _.find(parent['subfield'], { 'code': 'a' })['$t']
}

function getExNr (object) {
  return _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A' })['occurrence']
}

function getLocation (object) {
  let parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A' })
  return _.find(parent['subfield'], { 'code': 'f' })['$t']
}

function getLoanIndication (object) {
  let parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A' })
  return _.find(parent['subfield'], { 'code': 'd' })['$t']
}

function getError (object) {
  if (object['zs:searchRetrieveResponse']['zs:numberOfRecords'] > 0) {
    return ''
  } else {
    return 'Barcode wurde nicht gefunden'
  }
}

module.exports = ShelfmarksFromSRUData
