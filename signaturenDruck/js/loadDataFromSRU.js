// requires lodash
const _ = require('lodash')

const {net} = require('electron')

// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})

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
    objSRU.date = dateFromLine
    objSRU.exNr = exNr
    objSRU.plainTxt = shelfmark
    if (objSRU.txtLength < 3) {
      createMultipleLines()
    }
    if (shelfmark.split(config.get('newLineAfter')).length === 6) {
      _.forEach(shelfmark.split(config.get('newLineAfter')), function (value) {
        objSRU.txtOneLine += value + ' '
      })
    } else {
      let txt = [shelfmark]
      objSRU.txt = txt
      objSRU.txtOneLine = shelfmark
    }
    function createMultipleLines () {
      let txt = objSRU.txtOneLine
      let indxSlash = txt.indexOf('/')
      let indxColon = txt.indexOf(':')
      let i = 0
      objSRU.txt = []
      objSRU.txt[0] = txt
      if (indxSlash !== -1) {
        setSigTxt0and1(indxSlash, txt)
        i = 1
      }
      if (indxColon !== -1) {
        if (i === 0) {
          setSigTxt0and1(indxColon, txt)
        } else {
          let i = 0
          let txt = []
          let length = objSRU.txt.length
          objSRU.txt.forEach(element => {
            let indx = element.indexOf(':')
            if (indx !== -1) {
              let j = 0
              while (j < i) {
                txt[j] = objSRU.txt[j]
                j++
              }
              let k = i
              txt[k] = element.substring(0, indx)
              k++
              txt[k] = element.substring(indx)
              k++
              while (k <= length) {
                txt[k] = objSRU.txt[k - 1]
                k++
              }
              objSRU.txt = txt
            }
            i++
          })
        }
      }
      i = 0
      txt = []
      let length = objSRU.txt.length
      objSRU.txt.forEach(element => {
        let elementParts = element.split(' ')
        if (elementParts.length >= 3) {
          let j = 0
          while (j < i) {
            txt[j] = objSRU.txt[j]
            j++
          }
          let k = i
          txt[k] = elementParts[0] + ' ' + elementParts[1]
          k++
          txt[k] = element.substring(txt[k - 1].length)
          k++
          while (k <= length) {
            txt[k] = objSRU.txt[k - 1]
            k++
          }
          objSRU.txt = txt
        }
        i++
      })
    }
    function setSigTxt0and1 (indx, txt) {
      objSRU.txt[0] = txt.substring(0, indx + 1)
      objSRU.txt[1] = txt.substring(indx + 1)
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
