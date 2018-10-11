// requires lodash
const _ = require('lodash')

// requires the electron-store module and initializes it
const Store = require('electron-store')
const config = new Store({cwd: 'C:\\Export\\SignaturenDruck'})
// requires the dataExtract-module
const DataExtract = require('./dataExtract.js')
// requires the shelfmark class
const Shelfmark = require('./shelfmark.js')
const getLabelSize = require('./getLabelSize.js')

module.exports = function (allLines) {
  let obj = {
    all: []
  }
  let sig = new Shelfmark()
  let extract = new DataExtract()
  let ppnAktuell = ''

  allLines.map((line) => {
    let first4 = extract.firstFour(line)
    if (first4 === '0100') {
      sig.ppn = ppnAktuell = extract.ppn(line)
    } else if (first4 >= 7001 && first4 <= 7099) {
      sig.exNr = extract.exNr(line)
    } else if (first4 === '7100') {
      let plainTxt = extract.txt(line)
      let big = getLabelSize(plainTxt)
      if (big === false) {
        sig.bigLabel = false
      }
      let txt = plainTxt.split(config.get('newLineAfter'))
      sig.txtLength = txt.length
      if (txt.length === 6) {
        sig.txt = txt
        _.forEach(txt, function (value) {
          sig.txtOneLine += value + ' '
        })
      } else {
        let txt = [plainTxt]
        sig.txt = txt
        sig.txtOneLine = plainTxt
      }
    } else if (first4 === '7901') {
      sig.date = extract.date(line)
    }
    if (sig.allSet()) {
      if (sig.txtLength < 3) {
        createMultipleLines()
      }
      obj.all.push(sig.shelfmark)
      sig = new Shelfmark()
      sig.ppn = ppnAktuell
    }
  })
  return obj

  function createMultipleLines () {
    let txt = sig.txtOneLine
    let indxSlash = txt.indexOf('/')
    let indxColon = txt.indexOf(':')
    let i = 0
    sig.txt = []
    sig.txt[0] = txt
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
        let length = sig.txt.length
        sig.txt.forEach(element => {
          let indx = element.indexOf(':')
          if (indx !== -1) {
            let j = 0
            while (j < i) {
              txt[j] = sig.txt[j]
              j++
            }
            let k = i
            txt[k] = element.substring(0, indx)
            k++
            txt[k] = element.substring(indx)
            k++
            while (k <= length) {
              txt[k] = sig.txt[k - 1]
              k++
            }
            sig.txt = txt
          }
          i++
        })
      }
    }
    i = 0
    txt = []
    let length = sig.txt.length
    sig.txt.forEach(element => {
      let elementParts = element.split(' ')
      if (elementParts.length >= 3) {
        let j = 0
        while (j < i) {
          txt[j] = sig.txt[j]
          j++
        }
        let k = i
        txt[k] = elementParts[0] + ' ' + elementParts[1]
        k++
        txt[k] = element.substring(txt[k - 1].length)
        k++
        while (k <= length) {
          txt[k] = sig.txt[k - 1]
          k++
        }
        sig.txt = txt
      }
      i++
    })
  }

  function setSigTxt0and1 (indx, txt) {
    sig.txt[0] = txt.substring(0, indx + 1)
    sig.txt[1] = txt.substring(indx + 1)
  }
}
