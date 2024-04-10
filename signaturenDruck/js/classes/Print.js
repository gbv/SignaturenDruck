const _ = require('lodash')
const fs = require('fs')
const jsonfile = require('./JsonFile')

class Print {
  get dataAll () {
    return this._dataAll.all
  }

  constructor (file, formats, manualSignature) {
    this.formats = formats
    this.manualSignature = manualSignature
    this.jsonFile = ''
    if (fs.existsSync(file)) {
      this.jsonFile = JSON.parse(jsonfile.readFile(file))
    }
    this._dataAll = {
      all: []
    }
    this.elements = document.querySelectorAll('[name=toPrint]')
    this.getSelectedElementsToPrint()
  }

  getSelectedElementsToPrint () {
    const wak = []
    _.each(this.elements, (k, v) => {
      const dataStructure = {
        id: '',
        count: '1',
        format: '',
        isShort: false,
        data: ''
      }
      if (k.checked) {
        const parentRow = k.parentNode.parentNode
        dataStructure.id = v
        dataStructure.count = setCount(parentRow)
        dataStructure.format = setFormat.bind(this, parentRow)()
        dataStructure.isShort = setShort(parentRow)
        dataStructure.data = setData.bind(this, k, parentRow)()
        wak.push(dataStructure)
      }
    })
    this._dataAll.all = setFormatInformation.bind(this, _.groupBy(wak, 'format.name'))()
  }
}

function setShort (parentRow) {
  if (parentRow.getElementsByClassName('shortShelfmarkCell')[0].firstChild !== null) return parentRow.getElementsByClassName('shortShelfmarkCell')[0].firstChild.checked
  else return false
}
function setCount (parentRow) {
  return parseInt(parentRow.getElementsByClassName('printCountCell')[0].firstChild.value)
}

function setFormat (parentRow) {
  return this.formats[parentRow.getElementsByClassName('select')[0].firstChild.value.toString()]
}

function setFormatInformation (arr) {
  const b = []
  _.each(arr, (v, k) => {
    const structure = {
      formatInformation: '',
      printInformation: ''
    }
    structure.formatInformation = this.formats[k]
    structure.printInformation = v
    b.push(structure)
  })
  return b
}

function setData (current, parentRow) {
  const ppn = parentRow.id.split('-')
  const id = current.id.split('_')
  if (ppn[0] === 'manual') return this.manualSignature[id[2]]
  else return _.find(this.jsonFile, { id: parseInt(id[1]), PPN: ppn[0] })
}

module.exports = Print
