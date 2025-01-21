const _ = require('lodash')
const xpath = require('xpath')
const dom = require('@xmldom/xmldom').DOMParser
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
    
    const srudom = new dom()
    
    try {
        var sru = srudom.parseFromString(xml, 'text/xml')
        var selectzs = xpath.useNamespaces({"zs": "http://www.loc.gov/zing/srw/"})
        if (selectzs("number(/zs:searchRetrieveResponse/zs:numberOfRecords)", sru) === 1) {
            sig.error = ''
        } else {
            sig.error = key + ' wurde nicht gefunden. (Modus ' + dataMode + ')' // more than one hit should never happen
        }
     } catch (e) {
        sig.error = e.message
     }

    if (sig.error === '') {

      sig.id = 99 // gets overwritten at a later stage

      switch (selectzs("string(//zs:record/zs:recordSchema)", sru)) {
       case 'picaxml':
       case 'info:srw/schema/5/picaXML-v1.0':
          var selectpica = xpath.useNamespaces({"zs": "http://www.loc.gov/zing/srw/", "pica": "info:srw/schema/5/picaXML-v1.0"})
          if (dataMode === 'PPN') {
            sig.ppn = selectpica("string(//pica:datafield[@tag='003@']/pica:subfield[@code='0'])", sru)
            var occ = selectpica("string(//pica:datafield[(@tag='209G') and (pica:subfield[@code='a']='"+key+"')]/@occurrence)", sru)
          } else {
            sig.ppn = key
            var occ = selectpica("string(//pica:datafield[(@tag='203@') and (pica:subfield[@code='0']='"+key+"')]/@occurrence)", sru)
          }
          sig.date = selectpica("string(//pica:datafield[(@tag='201B') and (@occurrence='"+occ+"')]/pica:subfield[@code='0'])", sru)
          sig.txtOneLine = selectpica("string(//pica:datafield[(@tag='209A') and (@occurrence='"+occ+"')]/pica:subfield[@code='a'])", sru)
          sig.exNr = occ
          sig.location = selectpica("string(//pica:datafield[(@tag='200A') and (@occurrence='"+occ+"')]/pica:subfield[@code='f'])", sru)
          sig.loanIndication = selectpica("string(//pica:datafield[(@tag='200A') and (@occurrence='"+occ+"')]/pica:subfield[@code='d'])", sru)
          break
 
       case 'raw':  // FOLIO "Quesnelia"
          if (dataMode === 'PPN') {
            sig.ppn = xpath.select("string(//bareHoldingsItems[barcode='"+key+"']/hrid)", sru)
            sig.date = xpath.select("string(//bareHoldingsItems[barcode='"+key+"']/../notes[holdingsNoteType/name='Letzte Änderung CBS']/note)", sru)
            sig.txtOneLine = [
                   xpath.select("string(//bareHoldingsItems[barcode='"+key+"']/effectiveCallNumberComponents/prefix)", sru),
                   xpath.select("string(//bareHoldingsItems[barcode='"+key+"']/effectiveCallNumberComponents/callNumber)", sru),
                   xpath.select("string(//bareHoldingsItems[barcode='"+key+"']/effectiveCallNumberComponents/suffix)", sru)
                   ].join(" ")
            sig.location = xpath.select("string(//bareHoldingsItems[barcode='"+key+"']/../permanentLocation/name)", sru)
            sig.exNr = sig.location
            sig.loanIndication = xpath.select("string(//bareHoldingsItems[barcode='"+key+"']/status/name)", sru)
          } else {
            sig.error = 'SRU: EPN-Suche für FOLIO raw nicht implementiert'
          }
          break

       default:
          sig.error = 'SRU: Unbekanntes Datenschema'
          
      }
      
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

module.exports = ShelfmarksFromSRUData
