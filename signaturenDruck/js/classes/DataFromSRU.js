const { net } = require('electron')
const parser = require('xml2json')
// const Shelfmark = require('../shelfmark.js')
// const Modes = require('./Modes.js')
// const config = remote.getGlobal('config')

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

  loadData (key, mode) {
    let url
    let queryPart1
    if (mode === 'PPN') {
      queryPart1 = config.get('SRU.QueryPart1')
    } else {
      queryPart1 = config.get('SRU.QueryPart1EPN')
    }
    url = config.get('SRU.SRUAddress') + queryPart1 + key + config.get('SRU.QueryPart2')
    let request = net.request(url)
    let allData = ''
    let data = ''
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

          resolve(data)
        })
      })
      request.end()
    })
  }
}

module.exports = DataFromSRU
