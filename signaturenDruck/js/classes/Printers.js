const _ = require('lodash')
const { remote } = require('electron')
const printerList = remote.getCurrentWindow().webContents.getPrinters()
class Printers {
  /*
 ----- Class getter and setter -----
  */
  get printers () {
    return this._printers
  }
  /*
  ----- End Class getter and setter -----
   */

  /*
  ----- Constructor -----
   */
  constructor (formats) {
    this._printers = []
    this.formats = formats
    this.checkPrinters()
  }
  /*
  ----- End Constructor -----
   */

  // function to get the printerList
  getPrinterNameList () {
    let nameList = []
    let i = 0
    _.forEach(printerList, function (key) {
      nameList[i] = key.name
      i++
    })
    return nameList
  }

  checkPrinters () {
    let printerList = this.getPrinterNameList()
    let printerNameError = []
    for (let format in this.formats) {
      if (this.formats.hasOwnProperty(format)) {
        this._printers[format] = Printers.isIncluded(this.formats[format].printer, printerList)
        if (/(\s-\s?)/.test(this.formats[format].printer) || /(\s?-\s)/.test(this.formats[format].printer)) {
          printerNameError.push(format)
        }
      }
    }
    let printerNotFound = []
    for (let printer in this.printers) {
      if (this.printers.hasOwnProperty(printer)) {
        if (!this.printers[printer]) {
          printerNotFound.push(printer)
        }
      }
    }
    let str = ''
    if (printerNotFound.length > 0 || printerNameError.length > 0) {
      if (printerNotFound.length === 1) {
        str = 'Der Drucker des Formats: "' + printerNotFound[0] + '" wurde nicht gefunden'
      } else if (printerNotFound.length > 1) {
        str = 'Die Drucker der folgenden Formate wurden nicht gefunden: "'
        printerNotFound.forEach(element => {
          str += element + ', '
        })
        str = str.substr(0, str.length - 2)
        str += '"'
      }
      if (str !== '') {
        str += '<br/>'
      }
      if (printerNameError.length === 1) {
        str += 'Der Druckername des Formats: "' + printerNameError[0] + '" enthält ein "-", dies kann zu einem Problem beim drucken führen.'
      } else if (printerNameError.length > 1) {
        str += 'Die Druckernamen der folgenden Formate enthalten ein "-": <br/>"'
        printerNameError.forEach(element => {
          str += element + ', '
        })
        str = str.substr(0, str.length - 2)
        str += '"<br/>'
        str += 'Dies kann zu einem Problem beim drucken führen.'
      }
      document.getElementById('infoBox').insertAdjacentHTML('afterbegin', '<div class="notification is-warning">' + str + '</div>')
    }
  }

  static isIncluded (printer, printerList) {
    return _.indexOf(printerList, printer) !== -1
  }
}

module.exports = Printers
