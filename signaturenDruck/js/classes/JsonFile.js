const fs = require('fs')
const _ = require('lodash')
const loadDataFromFile = require('../loadDataFromFile')

class JsonFile {
  /*
 ----- Class getter and setter -----
  */
  get file () {
    return this._file
  }

  set file (value) {
    this._file = value
  }
  /*
  ----- End Class getter and setter -----
   */

  /*
  ----- Constructor -----
   */
  constructor (file) {
    this._file = file
    this.createJsonFile(file)
  }
  /*
  ----- End Constructor -----
   */

  static readFile (file) {
    return fs.readFileSync(file)
  }

  createJsonFile (file) {
    fs.writeFileSync(file, '', 'utf8')
  }

  writeToJsonFile (source) {
    fs.writeFileSync(this.file, JSON.stringify(setIds(getUnique(loadDataFromFile(source.split(/\r\n|\n/))))), 'utf8')
  }

}

/*
----- Private Area -----
 */
function setIds (object) {
  let i = 1
  return _.forEach(object, (value) => {
    value.id = i
    i++
  })
}

function getUnique (object) {
  return _.map(
    _.uniq(
      _.map(object.all, (obj) => {
        return JSON.stringify(obj)
      })
    ), (obj) => {
      return JSON.parse(obj)
    }
  )
}

/*
----- End Private Area ----
 */

module.exports = JsonFile