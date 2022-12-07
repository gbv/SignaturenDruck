const fs = require('fs')
const _ = require('lodash')
const Store = require('electron-store')
const C = require('./Config')
const defaultProgramPath = new C().defaultPath
const config = new Store({ cwd: defaultProgramPath })
let loadDataFromFile

if (config.get('useK10plus')) {
  loadDataFromFile = require('../K10plus/loadDataFromFileK10plus')
} else {
  loadDataFromFile = require('../preK10plus/loadDataFromFileOld')
}

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
  }
  /*
  ----- End Constructor -----
   */

  static readFile (file) {
    return fs.readFileSync(file)
  }

  static createJsonFile (file) {
    fs.writeFileSync(file, '', 'utf8')
  }

  writeToJsonFile (source, formats, sru = false) {
    if (sru) fs.writeFileSync(this.file, JSON.stringify(source), 'utf8')
    else fs.writeFileSync(this.file, JSON.stringify(setIds(getUnique(loadDataFromFile(source.split(/\r\n|\n/), formats)))), 'utf8')
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
