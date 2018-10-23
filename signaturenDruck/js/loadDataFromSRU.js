// requires lodash
const _ = require('lodash')

const {net} = require('electron')

// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})
const createMultipleLines = require('./createMultipleLines.js')

module.exports = function (barcode) {
  let url = config.get('SRUaddress') + '?version=1.1&operation=searchRetrieve&query=pica.bar=' + barcode + '&maximumRecords=1&recordSchema=picaxml'
  let request = net.request(url)
  let allData = ''
  let field209A = false
  let isBarcodeLine = false
  let isPpnLine = false
  let isDateLine = false
  let exNr = ''
  let shelfmark = ''
  let pufferShelfmark = ''
  let pufferExNr = ''
  let ppnFromLine = ''
  let dateFromLine = ''
  let barcodeFromLine = ''
  let objSRU = {
    'PPN': '',
    'id': '',
    'bigLabel': true,
    'txt': [],
    'txtLength': '',
    'date': '',
    'exNr': '',
    'plainTxt': '',
    'txtOneLine': '',
    'error': ''
  }
  return new Promise(function (resolve, reject) {
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        allData += chunk
      })
      response.on('end', () => {
        allData = allData.split(/\r\n|\n/)
        allData.map((line) => {
          if (!recordCheck(line)) {
            resolve(objSRU)
          }
          setPPN(line)
          setDate(line)
          setShelfmark(line)
          setBarcode(line)
          if (barcode === barcodeFromLine) {
            setObjct()
            resolve(objSRU)
            barcodeFromLine = ''
          }
        })
      })
    })
    request.end()
  })

  function setPPN (line) {
    if (/(<datafield tag="003@")/.test(line)) {
      isPpnLine = true
    } else if (isPpnLine) {
      ppnFromLine = line.replace(/^(.*)(0">)(.*)(<\/subfield>)$/, '$3')
      isPpnLine = false
    }
  }
  function setDate (line) {
    if (/(<datafield tag="201B")/.test(line)) {
      isDateLine = true
    } else if (isDateLine) {
      if (/(code="0">)/.test(line)) {
        dateFromLine = line.replace(/^(.*)(0">)(.*)(<\/subfield>)$/, '$3')
        isDateLine = false
      }
    }
  }
  function setShelfmark (line) {
    if (/(<datafield tag="209A")/.test(line)) {
      pufferExNr = line.replace(/^(.*)(occurrence=")(\d{2})(")(.*)$/, '$3')
      field209A = true
    } else {
      if (field209A && /(<\/datafield>)/.test(line)) {
        field209A = false
      } else if (field209A) {
        if (/code="a">/.test(line)) {
          pufferShelfmark = line.replace(/^(.*)(a">)(.*)(<\/subfield>)$/, '$3')
        } else if (/code="x">00/.test(line)) {
          exNr = pufferExNr
          shelfmark = pufferShelfmark
        }
      }
    }
  }
  function setBarcode (line) {
    if (/(<datafield tag="209G")/.test(line)) {
      isBarcodeLine = true
    } else if (isBarcodeLine && /(<\/datafield>)/.test(line)) {
      isBarcodeLine = false
    } else if (isBarcodeLine) {
      barcodeFromLine = line.replace(/^(.*)(code="a">)(.*)(<\/subfield>)$/, '$3')
    }
  }
  function setObjct () {
    objSRU.PPN = ppnFromLine
    objSRU.id = 99
    objSRU.bigLabel = true
    objSRU.txt = shelfmark.split(config.get('newLineAfter'))
    objSRU.txtLength = objSRU.txt.length
    objSRU.txtOneLine = shelfmark
    objSRU.date = dateFromLine
    objSRU.exNr = exNr
    objSRU.plainTxt = shelfmark
    if (config.get('thulbMode')) {
      if (objSRU.txtLength < 3) {
        objSRU.txt = createMultipleLines(shelfmark)
      }
    }
  }
  function recordCheck (line) {
    if (/<zs:numberOfRecords>0<\/zs:numberOfRecords>/.test(line)) {
      objSRU.error = 'Barcode wurde nicht gefunden'
      return false
    } else {
      return true
    }
  }
}
