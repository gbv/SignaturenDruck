const { remote } = require('electron')
const _ = require('lodash')
const Shelfmark = require('../shelfmark.js')
const Modes = require('./Modes.js')
const config = remote.getGlobal('config')
const Formats = require('../classes/Formats')
const FormatLinesByMode = require('../classes/FormatLinesByMode')
const LocationCheck = require('../classes/LocationCheck')

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

  getShelfmark (xml, barcode) {
    let sig = new Shelfmark()
    let mode = new Modes()
    let formats = new Formats()
    let formatArray = formats.formats
    let occ = getOccurrence(xml, barcode)

    sig.error = getError(xml)
    if (sig.error === '') {
      sig.id = 99 // gets overwritten at a later stage
      sig.ppn = getPPN(xml)
      sig.date = getDate(xml, occ)
      sig.txtOneLine = getTxt(xml, occ)
      sig.exNr = getExNr(xml, occ)
      sig.location = getLocation(xml, occ)
      sig.loanIndication = getLoanIndication(xml, occ)
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
        }
        sig.subModes.push(data)
      })
    }

    return sig.shelfmark
  }
}

function getOccurrence (object, barcode) {
  // get all 209G entries
  let all = _.filter(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209G' })
  // search all 209G for a matching barcode
  let found = _.find(all, function (o) {
    // if there are multiple subfield entries
    if (o.subfield.length > 1) {
      // return the subield entry with the matching barcode
      return _.forEach(o.subfield, function (data) {
        if (data['$t'] === barcode) {
          return o
        }
      })
    } else { // if there is just one subfield entry
      if (o.subfield['$t'] === barcode) {
        return o
      }
    }
  })
  // if the barcode did not match, we take the occurrence of the first 209A entry
  if (found === undefined) {
    let test = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A' })
    // if we found something
    if (test !== undefined) {
      found = test
    }
  }
  return found.occurrence
}

function getPPN (object) {
  let data = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '003@' })
  if (data !== undefined) {
    return data['subfield']['$t']
  } else {
    return ''
  }
}

function getDate (object, occ) {
  let parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '201B', 'occurrence': occ })
  let data = _.find(parent['subfield'], { 'code': '0' })
  if (data !== undefined) {
    return data['$t']
  } else {
    return ''
  }
}

function getTxt (object, occ) {
  let parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A', 'occurrence': occ })
  let data = _.find(parent['subfield'], { 'code': 'a' })
  if (data !== undefined) {
    return data['$t']
  } else {
    return ''
  }
}

function getExNr (object, occ) {
  let data = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A', 'occurrence': occ })
  if (data !== undefined) {
    return data['occurrence']
  } else {
    return ''
  }
}

function getLocation (object, occ) {
  let parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A', 'occurrence': occ })
  let data = _.find(parent['subfield'], { 'code': 'f' })
  if (data !== undefined) {
    return data['$t']
  } else {
    return ''
  }
}

function getLoanIndication (object, occ) {
  let parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData']['record']['datafield'], { 'tag': '209A', 'occurrence': occ })
  let data = _.find(parent['subfield'], { 'code': 'd' })
  if (data !== undefined) {
    return data['$t']
  } else {
    return ''
  }
}

function getError (object) {
  try {
    if (object['zs:searchRetrieveResponse']['zs:numberOfRecords'] > 0) {
      return ''
    } else {
      return 'Barcode wurde nicht gefunden'
    }
  } catch (e) {
    return e.message
  }
}

module.exports = ShelfmarksFromSRUData
