const { net } = require('electron')
const _ = require('lodash')
const parser = require('xml2json')
const Shelfmark = require('../shelfmark.js')

class DataFromSRU {
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

  loadData (barcode) {
    let url = config.get('SRU.SRUAddress') + config.get('SRU.QueryPart1') + barcode + config.get('SRU.QueryPart2')
    let request = net.request(url)
    let allData = ''
    let data = ''
    let sig = new Shelfmark()
    return new Promise(function (resolve, reject) {
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          allData += chunk
        })
        response.on('end', () => {
          let options = {
            object: true
          }
          data = parser.toJson(allData, options)
          sig.error = getError(data)
          if (sig.error === '') {
            sig.id = 99 // gets overwritten at a later stage
            sig.ppn = getPPN(data)
            sig.date = getDate(data)
            sig.txtOneLine = getTxt(data)
            sig.txt = sig.txtOneLine.split(config.get('newLineAfter'))
            sig.txtLength = sig.txt.length
            sig.exNr = getExNr(data)
            sig.location = getLocation(data)
            sig.loanIndication = getLoanIndication(data)
          }

          resolve(sig.shelfmark)
        })
      })
      request.end()
    })
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

module.exports = DataFromSRU
