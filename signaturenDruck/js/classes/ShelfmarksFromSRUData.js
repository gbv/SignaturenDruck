const _ = require('lodash')
const Shelfmark = require('../shelfmark.js')
const Modes = require('./Modes.js')
const Store = require('electron-store')
const C = require('./Config')
const defaultProgramPath = new C().defaultPath
const config = new Store({ cwd: defaultProgramPath })
const Formats = require('../classes/Formats')
const FormatLinesByMode = require('./FormatLinesByMode')
const LocationCheck = require('./LocationCheck')

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

  getShelfmark (xml, key, dataMode) {
    const sig = new Shelfmark()
    const mode = new Modes()
    const formats = new Formats()
    const formatArray = formats.formats
    sig.error = getError(xml, key, dataMode)

    if (sig.error === '') {
      const occ = getOccurrence(xml, key)
      sig.id = 99 // gets overwritten at a later stage
      if (dataMode === 'PPN') {
        sig.ppn = getPPN(xml)
      } else {
        sig.ppn = getEPN(xml)
      }
      sig.date = getDate(xml, occ)
      sig.txtOneLine = getTxt(xml, occ)
      sig.exNr = getExNr(xml, occ)
      sig.location = getLocation(xml, occ)
      sig.loanIndication = getLoanIndication(xml, occ)
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
            if (regex.test(sig.txtOneLine) && sig.defaultSubMode === '') {
              sig.defaultSubMode = value.id
            }
            const lines = sig.txtOneLine.match(regex)
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
  const all = _.filter(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '209G' })
  // search all 209G for a matching barcode
  let found = _.find(all, function (o) {
    // if there are multiple subfield entries
    if (o.subfield.length > 1) {
      // return the subield entry with the matching barcode
      return _.forEach(o.subfield, function (data) {
        if (data['#text'] === barcode) {
          return o
        }
      })
    } else { // if there is just one subfield entry
      if (o.subfield['#text'] === barcode) {
        return o
      }
    }
  })
  // if the barcode did not match, we take the occurrence of the first 209A entry
  if (found === undefined) {
    const test = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '209A' })
    // if we found something
    if (test !== undefined) {
      found = test
    }
  }
  return found.occurrence
}

function getPPN (object) {
  const data = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '003@' })
  if (data !== undefined) {
    return String(data.subfield['#text'])
  } else {
    return ''
  }
}

function getEPN (object) {
  const data = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '203@' })
  if (data !== undefined) {
    return String(data.subfield['#text'])
  } else {
    return ''
  }
}

function getDate (object, occ) {
  const parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '201B', occurrence: occ })
  const data = _.find(parent.subfield, { code: '0' })
  if (data !== undefined) {
    return data['#text']
  } else {
    return ''
  }
}

function getTxt (object, occ) {
  const parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '209A', occurrence: occ })
  const data = _.find(parent.subfield, { code: 'a' })
  if (data !== undefined) {
    return data['#text']
  } else {
    return ''
  }
}

function getExNr (object, occ) {
  const data = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '209A', occurrence: occ })
  if (data !== undefined) {
    return data.occurrence
  } else {
    return ''
  }
}

function getLocation (object, occ) {
  const parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '209A', occurrence: occ })
  const data = _.find(parent.subfield, { code: 'f' })
  if (data !== undefined) {
    return data['#text']
  } else {
    return ''
  }
}

function getLoanIndication (object, occ) {
  const parent = _.find(object['zs:searchRetrieveResponse']['zs:records']['zs:record']['zs:recordData'].record.datafield, { tag: '209A', occurrence: occ })
  const data = _.find(parent.subfield, { code: 'd' })
  if (data !== undefined) {
    return data['#text']
  } else {
    return ''
  }
}

function getError (object, key, mode) {
  try {
    if (object && object['zs:searchRetrieveResponse'] && object['zs:searchRetrieveResponse']['zs:numberOfRecords'] > 0) {
      return ''
    } else {
      return mode + ': <b>' + key + '</b> wurde nicht gefunden.'
    }
  } catch (e) {
    return e.message
  }
}

module.exports = ShelfmarksFromSRUData
