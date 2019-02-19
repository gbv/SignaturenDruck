const _ = require('lodash')
const jsonfile = require('./JsonFile')

class Print {
  get dataAll () {
    return this._dataAll
  }
  constructor (file, formats, manuelSignature) {
    this.formats = formats
    this.manualSignature = manuelSignature
    this.jsonFile = JSON.parse(jsonfile.readFile(file))
    this._dataAll = {
      all: []
    }
    this.elements = document.querySelectorAll('[name=toPrint]')
  }

  getSelectedElementsToPrint () {
    _.each(this.elements, (k, v) => {
      let dataStructure = {
        id: '',
        count: '1',
        removeIndent: false,
        format: '',
        isShort: false,
        data: ''
      }
      if (k.checked) {
        let parentRow = k.parentNode.parentNode
        dataStructure.id = v
        dataStructure.isShort = setShort(parentRow)
        dataStructure.count = setCount(parentRow)
        dataStructure.format = setFormat.bind(this,parentRow)()
        dataStructure.data = setData.bind(this, parentRow)()
        console.warn(dataStructure)
      }
    })
  }
}

function setShort (parentRow) {
  if (parentRow.getElementsByClassName('shortShelfmarkCell')[0].firstChild !== null)  return parentRow.getElementsByClassName('shortShelfmarkCell')[0].firstChild.checked
  else return false
}
function setCount (parentRow) {
  return parentRow.getElementsByClassName('printCountCell')[0].firstChild.value
}

function setFormat (parentRow) {
  return this.formats[parentRow.getElementsByClassName('select')[0].firstChild.value.toString()]
}

function setData (parentRow) {
  let id = parentRow.id.split('-')
  if(id[0] === 'manual') return this.manualSignature[id[1]]
  else return _.find(this.jsonFile, {id: parseInt(id[1]) + 1, PPN: id[0]})
}

module.exports = Print