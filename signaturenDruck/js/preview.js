const _ = require('lodash')
const fs = require('fs')
const XRegExp = require('xregexp')
const { remote } = require('electron')
const config = remote.getGlobal('config')
const defaultProgramPath = remote.getGlobal('defaultProgramPath')
const printerList = remote.getCurrentWindow().webContents.getPrinters()
const loadDataFromFile = require('./loadDataFromFile')

class preview {

  constructor (file, objMan) {
    createFile(file)
    this.file = file
    this.myNode = document.getElementById('previewBox')
    this.formats = []
    this.objMan = objMan
    this.printerFound = []
    this.selectOptions = []
    this.formats = []
  }

  static readFile (file) {
    return fs.readFileSync(file)
  }

  writeToFile (source) {
    fs.writeFileSync(this.file, JSON.stringify(this.setIds(this.getUnique(loadDataFromFile(source.split(/\r\n|\n/))))), 'utf8')
  }

  changePreview (id) {
    this.removeOld()

    let format = document.getElementById('templateSelect_' + id).value
    let formatName = document.getElementById('templateSelect_' + id).value
    this.myNode.className = 'format_' + format

    if (!String(id).includes('m_')) {
      let found = _.find(JSON.parse(preview.readFile(this.file)), {'id': Number(id)})
      this.searchAndShow(found, formatName, this.getLinesByFormat(formatName, found.txtOneLine))
      document.getElementsByClassName('innerBox')[0].className = 'innerBox'
    } else {
      let cleanId = id.split('m_')[1]
      this.checkIfNoIndent(cleanId, this.formats[formatName].lines)
    }
  }

  removeOld () {
    this.myNode.className = ''
    removeOld(this.myNode)
  }

  getLinesByFormat (formatName, shelfmarkRAW) {
    let format = this.formats[formatName]
    let delimiter = format.lineDelimiter
    if (format.splitByRegEx) {
      let regExString = ''
      format.splitByRegEx.forEach(element => {
        regExString += element
      })
      let regEx = XRegExp(regExString, 'x')
      let lines = XRegExp.exec(shelfmarkRAW, regEx)
      if (lines === null) {
        return shelfmarkRAW
      } else {
        if (lines.length > 1) {
          lines.shift()
        }
        return lines
      }
    } else {
      if (delimiter === '') {
        return shelfmarkRAW
      } else {
        return shelfmarkRAW.split(delimiter)
      }
    }
  }

  searchAndShow (found, formatName, linesArray) {
    let lines = found.txtLength
    let formatLines = this.formats[formatName].lines
    let id = found.id
    let oneLine = found.txtOneLine
    if (found !== undefined) {
      if (lines <= 2 && config.get('mode.useMode') && config.get('mode.defaultMode') === 'thulbMode') {
        if (document.getElementById('short_' + id).checked) {
          this.showData(found.txt, formatLines)
        } else {
          this.showData(oneLine, formatLines)
        }
      } else {
        if (Number(formatLines) === 1) {
          this.showData(oneLine, formatLines)
        } else {
          this.showData(linesArray, formatLines)
        }
      }
    }
  }

  checkIfNoIndent (cleanId, formatLines) {
    this.showData(this.objMan[cleanId].lineTxts, formatLines)
    if (this.objMan[cleanId].removeIndent) {
      document.getElementsByClassName('innerBox')[0].className = 'innerBox noIndent'
    } else {
      document.getElementsByClassName('innerBox')[0].className = 'innerBox'
    }
  }

  showData (shelfmark, formatLines) {
    let i = 1
    let line
    let innerBox = document.createElement('div')
    innerBox.className = 'innerBox'
    preview.createLines(innerBox, formatLines)
    this.myNode.appendChild(innerBox)
    if (Array.isArray(shelfmark)) {
      shelfmark.forEach(element => {
        line = document.getElementById('line_' + i)
        if (line !== null) {
          if (element !== '') {
            line.innerHTML = element
          }
          i++
        } else {
          innerBox = document.getElementsByClassName('innerBox')[0]
          line = document.createElement('p')
          line.id = 'line_' + i
          line.className = 'line_' + i
          if (element !== '') {
            line.innerHTML = element
          }
          innerBox.appendChild(line)
          i++
        }
      })
    } else {
      line = document.getElementById('line_' + i)
      if (config.get('mode.useMode') && config.get('mode.defaultMode') === 'thulbMode') {
        line.innerHTML = shelfmark.split(config.get('newLineAfter')).join(' ')
      } else {
        line.innerHTML = shelfmark
      }
    }
  }

  displayData () {
    if (document.getElementById('shelfmarkTable')) {
      preview.clearTable()
    }
    if (config.get('sortByPPN')) {
      this.createTable(preview.groupByPPN(JSON.parse(preview.readFile(this.file))))
    } else {
      this.createTable(JSON.parse(preview.readFile(this.file)))
    }
  }

  createTable (obj) {
    let table = document.getElementById('shelfmarkTable').getElementsByTagName('tbody')[0]
    let i = 0
    if (config.get('sortByPPN')) {
      _.forEach(obj, (key, value) => {
        let row = table.insertRow(i)
        row.className = 'ppnRow'
        preview.createPpnRow(row, value)
        _.forEach(key, (object) => {
          i++
          row = table.insertRow(i)
          row.id = object.PPN + '-0'
          this.createTxtCell(row, 0, object.id, object.txtOneLine)
          this.createDateCell(row, 1, object.id, object.date)
          this.createExnrCell(row, 2, object.id, object.exNr)
          this.createShortShelfmarkCell(row, 3, object.id, object.bigLabel)
          this.createPrintCell(row, 4, object.id)
          preview.createPrintCountCell(row, 5, object.id)
          this.createLabelSizeCell(row, 6, object.id, object.txtLength)
        })
        i++
      })
    } else {
      let i = 0
      _.forEach(obj, (key) => {
        let current = document.getElementById(key.PPN)
        let row
        if (current) {
          let i = 0
          while (document.getElementById(key.PPN + '-' + i)) {
            i++
          }
          row = document.createElement('tr')
          row.id = key.PPN + '-' + i
          if (i === 0) {
            current = document.getElementById(key.PPN)
          } else {
            current = document.getElementById(key.PPN + '-' + (i - 1))
          }

          current.parentNode.insertBefore(row, current.nextSibling)
        } else {
          row = table.insertRow(i)
          row.className = 'ppnRow'
          preview.createPpnRow(row, key.PPN)
          i++
          row = table.insertRow(i)
          row.id = key.PPN + '-0'
        }
        this.createTxtCell(row, 0, key.id, key.txtOneLine)
        this.createDateCell(row, 1, key.id, key.date)
        this.createExnrCell(row, 2, key.id, key.exNr)
        this.createShortShelfmarkCell(row, 3, key.id, key.bigLabel)
        this.createPrintCell(row, 4, key.id)
        preview.createPrintCountCell(row, 5, key.id)
        this.createLabelSizeCell(row, 6, key.id, key.txtLength)
        i++
      })
    }
  }

  addToTable (obj) {
    let table = document.getElementById('shelfmarkTable').getElementsByTagName('tbody')[0]
    let row = table.insertRow(0)
    row.className = 'ppnRow manual'
    preview.createPpnRow(row, 'manuell')
    let i = 0
    while (obj[i] !== undefined) {
      row = table.insertRow(i + 1)
      row.className = 'manual'
      this.createTxtCell(row, 0, ('m_' + obj[i].id), obj[i].oneLineTxt)
      this.createDateCell(row, 1, ('m_' + obj[i].id))
      this.createExnrCell(row, 2, ('m_' + obj[i].id))
      this.createShortShelfmarkCell(row, 3, ('m_' + obj[i].id), obj[i].size)
      this.createPrintCell(row, 4, ('m_' + obj[i].id))
      preview.createPrintCountCell(row, 5, ('m_' + obj[i].id))
      this.createLabelSizeCell(row, 6, ('m_' + obj[i].id), obj[i].lines, obj[i].format)
      i++
    }
  }

  static clearTable () {
    let myNode = document.getElementById('shelfmarkTableBody')
    removeOld(myNode)
  }

  static createPpnRow (row, value) {
    let i = 0
    row.id = value
    preview.createCell(row, i, 'ppnCell', value)
    i++
    preview.createCell(row, i, 'dateCell')
    i++
    preview.createCell(row, i, 'isNrCell')
    i++
    preview.createCell(row, i, 'shortShelfmarkCell')
    i++
    preview.createCell(row, i, 'printCell')
    i++
    preview.createCell(row, i, 'printCountCell')
    i++
    preview.createCell(row, i, 'labelSizeCell')
  }

  static createCell (row, i, className, value) {
    let cell = row.insertCell(i)
    if (i === 0) {
      cell.innerHTML = value
    } else {
      cell.innerHTML = '<hr>'
      cell.className = className
    }
  }

  static createLines(innerBox, formatLines)
  {
    for (let i = 1; i <= formatLines; i++) {
      let line = document.createElement('p')
      line.id = 'line_' + i
      line.className = 'line_' + i
      let emptyLine = document.createElement('br')
      line.appendChild(emptyLine)
      innerBox.appendChild(line)
    }
  }

  createTxtCell (row, cellNr, id, txt) {
    let txtCell = row.insertCell(cellNr)
    txtCell.onclick = () => { this.changePreview(id) }
    txtCell.innerHTML = txt
    txtCell.className = 'txtCell'
  }

  createDateCell (row, cellNr, id, date = '-') {
    let dateCell = row.insertCell(cellNr)
    dateCell.onclick = () => { this.changePreview(id) }
    dateCell.className = 'dateCell'
    dateCell.id = 'dateCell_' + id
    dateCell.innerHTML = date
  }

  createExnrCell (row, cellNr, id, exNr = '-') {
    let isNrCell = row.insertCell(cellNr)
    isNrCell.onclick = () => { this.changePreview(id) }
    isNrCell.className = 'isNrCell'
    isNrCell.innerHTML = exNr
  }

  createShortShelfmarkCell (row, cellNr, id, size) {
    let shortShelfmarkCell = row.insertCell(cellNr)
    shortShelfmarkCell.className = 'shortShelfmarkCell'
    if (config.get('mode.useMode')) {
      if(config.get('mode.defaultMode') === 'thulbMode') {
        if (!size) {
          if (!String(id).includes('m_')) {
            let input = document.createElement('input')
            input.id = 'short_' + id
            input.type = 'checkbox'
            input.name = 'shortShelfmark'
            input.value = id
            input.onclick = () => {
              preview.changeFormat(id)
              this.changePreview(id)
            }
            shortShelfmarkCell.appendChild(input)
          } else {
            shortShelfmarkCell.onclick = () => { this.changePreview(id) }
          }
        } else {
          shortShelfmarkCell.onclick = () => { this.changePreview(id) }
        }
      } else {
        //TODO USE MODE CLASS TO GENERATE UR OWN MODE - HAS TO BE ALWAYS OWN MODE THAT WAS MADE BY THIS CLASS
      }

    } else {
      shortShelfmarkCell.onclick =  () => { this.changePreview(id) }
    }
  }

  createPrintCell (row, cellNr, id) {
    let printCell = row.insertCell(cellNr)
    let input = document.createElement('input')
    printCell.className = 'printCell'
    input.id = 'print_' + id
    input.type = 'checkbox'
    input.name = 'toPrint'
    input.value = id
    input.onclick =  () => { this.changePreview(id) }
    printCell.appendChild(input)
  }

  static createPrintCountCell (row, cellNr, id) {
    let printCountCell = row.insertCell(cellNr)
    let input = document.createElement('input')
    printCountCell.className = 'printCountCell'
    input.id = 'count_' + id
    input.className = 'input'
    input.type = 'number'
    input.max = 99
    input.min = 1
    input.name = 'printCount'
    input.value = 1
    printCountCell.appendChild(input)
  }

  createLabelSizeCell (row, cellNr, id, lines, format = '') {
    let cell = row.insertCell(cellNr)
    let div = document.createElement('div')
    div.className = 'select'
    let select = document.createElement('select')
    select.id = 'templateSelect_' + id
    this.selectOptions.forEach(element => {
      let size = document.createElement('option')
      size.value = element
      size.innerHTML = element
      if (!this.printerFound[element]) {
        size.disabled = true
      }
      select.appendChild(size)
    })
    select.onchange = () => { this.changePreview(id) }
    if (format !== '') {
      select.value = format
    } else {
      if (config.get('mode.useMode') && config.get('mode.defaultMode') === 'thulbMode') {
        if (Number(lines) <= 2) {
          if (this.printerFound['thulb_klein_1']) {
            select.value = 'thulb_klein_1'
          }
        } else if (Number(lines) === 3) {
          if (this.printerFound['thulb_klein']) {
            select.value = 'thulb_klein'
          }
        } else if (Number(lines) <= 6) {
          if (this.printerFound['thulb_gross']) {
            select.value = 'thulb_gross'
          }
        }
      } else {
        //TODO SHOULD BE DONE BY MODE CLASS TO CREATE UR OWN MODE BASED ON YOUR FORMATS
        select.value = config.get('defaultFormat')
      }
    }
    div.appendChild(select)
    cell.appendChild(div)
  }

  static changeFormat (id) {
    if (document.getElementById('short_' + id).checked) {
      document.getElementById('templateSelect_' + id).value = 'thulb_klein'
    } else {
      document.getElementById('templateSelect_' + id).value = 'thulb_klein_1'
    }
  }

  static groupByPPN (obj) {
    return _.groupBy(obj, 'PPN')
  }

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

  static isIncluded (printer, printerList) {
    return _.indexOf(printerList, printer) !== -1;
  }

  checkPrinters () {
    let printerList = this.getPrinterNameList()
    for (let format in this.formats) {
      this.printerFound[format] = preview.isIncluded(this.formats[format].printer, printerList)
    }
    let printerNotFound = []
    for (let printer in this.printerFound) {
      if (!this.printerFound[printer]) {
        printerNotFound.push(printer)
      }
    }
    let str = ''
    if (printerNotFound.length > 0) {
      if (printerNotFound.length === 1) {
        str = 'Der Drucker des Formats: "' + printerNotFound[0] + '" wurde nicht gefunden'
      } else {
        str = 'Die Drucker der folgenden Formate wurden nicht gefunden: "'
        printerNotFound.forEach(element => {
          str += element + ', '
        })
        str = str.substr(0, str.length - 2)
        str += '"'
      }
      document.getElementById('infoBox').insertAdjacentHTML('afterbegin','<div class="notification is-warning">' + str + '</div>')
    }
  }

  static addStyleFiles () {
    let files = fs.readdirSync(defaultProgramPath + '\\FormateCSS')
    for (let file of files) {
      let fileName = file.split('.css')[0]
      let cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.type = 'text/css'
      cssLink.href = defaultProgramPath + '/FormateCSS/' + fileName + '.css'
      document.head.appendChild(cssLink)
    }
  }

  loadFormats () {
    let files = fs.readdirSync(defaultProgramPath + '\\Formate')
    for (let file of files) {
      let fileName = file.split('.json')[0]
      this.selectOptions.push(fileName)
      this.formats[fileName] = JSON.parse(fs.readFileSync(defaultProgramPath + '\\Formate\\' + file, 'utf8'))
    }
  }

  getUnique (object) {
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

  setIds (object) {
    let i = 1
    return _.forEach(object, (value) => {
      value.id = i
      i++
    })
  }

  refresh () {
    this.removeOld()
    let currentFile = document.getElementById('defaultPath').innerHTML
    if (!this.readThisFile(currentFile)) {
      if (this.readThisFile(config.get('defaultDownloadPath'))) {
        document.getElementById('defaultPath').innerHTML = config.get('defaultDownloadPath')
      } else {
        document.getElementById('defaultPath').innerHTML = 'nicht vorhanden'
      }
    }
  }

  readThisFile (path) {
    if (fs.existsSync(path)) {
      this.objMan = null
      if (!fs.existsSync(this.file)) {
        createFile(this.file)
        let file = fs.readFileSync(path, 'utf-8')
        this.writeToFile(file)
        this.displayData()
        return true
      } else {
        let file = fs.readFileSync(path, 'utf-8')
        this.writeToFile(file)
        this.displayData()
        return true
      }
    }
    return false
  }
}

/*
Private Area
 */
function createFile (file) {
  fs.writeFileSync(file, '', 'utf8')
}

function removeOld(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

module.exports = preview