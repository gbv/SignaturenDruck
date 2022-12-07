// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const SystemFonts = require('system-font-families').default

const systemFonts = new SystemFonts()

// requires the fs-module
const fs = require('fs')

// requires the lodash-module
const _ = require('lodash')

// required for ipc calls to the main process
const { ipcRenderer } = require('electron')

const Store = require('electron-store')
const C = require('./classes/Config')
const defaultProgramPath = new C().defaultPath
const config = new Store({ cwd: defaultProgramPath })

let lineCounter = 1

let currentFormat = ''
let fonts = []
const formats = []
const selectOptions = []
let parts = []
let subModeData
let printerList = []

window.onload = function () {
  printerList = config.get('print.printerList')
  setFontsList()
  setPrinterSelect()
  getFormats()
  setFormatsSelect()
  changeLineSpace()
  addTableLine()
  document.getElementById('line_1').style.fontFamily = getValueOfElemId('fontLine_1')
}

ipcRenderer.on('newModeFormat', function (event, data) {
  if (data === '') {
    lineCounter = 1
    setValueOfElemId('input_labelLines', 1)
    setValueOfElemId('input_fileName', '')
    setValueOfElemId('input_example', config.get('example.shelfmark'))
  } else {
    subModeData = data
    setValueOfElemId('input_fileName', data.name)
    setValueOfElemId('input_example', data.example.shelfmark)
    loadFormatByName(subModeData.prevName)
    while (document.getElementById('tableLinesBody').childNodes.length < data.lines) {
      addLine()
    }
    let i = 0
    while (i < data.lines) {
      if (data.lines[i] !== '') {
        document.getElementById('line_' + (i + 1)).innerHTML = data.example.parts[i]
        parts.push(data.example.parts[i])
      } else {
        document.getElementById('line_' + (i + 1)).innerHTML = '<br/>'
        parts.push('<br/>')
      }
      i++
    }
  }
})

function loadFormatByName (name) {
  if (name !== '') {
    _.forEach(document.getElementById('selectFormat').options, function (value) {
      if (value.value === name) {
        document.getElementById('selectFormat').selectedIndex = value.index
        loadDataFromFormat(value.value)
      }
    })
  }
}

function setFontsList () {
  /*
  fonts = fontManager.getAvailableFontsSync()
  */

  const fontsList = systemFonts.getFontsSync()

  /*
  fonts.forEach(element => {
    fontsList.push(element.family)
  })
  */
  fonts = _.uniq(fontsList)
  fonts.sort()
}

function setPrinterSelect () {
  const list = printerList
  const select = document.getElementById('selectPrinter')
  let option = document.createElement('option')
  setOption(option, '--auswählen--', '', true)
  select.appendChild(option)
  list.forEach(element => {
    option = document.createElement('option')
    setOption(option, element, element)
    select.appendChild(option)
  })
}

// TODO that's not good it's hard coded
function getFormats () {
  const files = fs.readdirSync(defaultProgramPath + '\\Formate')
  for (const file of files) {
    const fileName = file.split('.json')[0]
    selectOptions.push(fileName)
    formats[fileName] = JSON.parse(fs.readFileSync(defaultProgramPath + '\\Formate\\' + file, 'utf8'))
  }
}

function setFormatsSelect () {
  const select = document.getElementById('selectFormat')
  selectOptions.forEach(element => {
    const option = document.createElement('option')
    setOption(option, element, element)
    select.appendChild(option)
  })
  select.onchange = function () {
    if (select.value !== '') {
      loadDataFromFormat(select.value)
    } else {
      currentFormat = ''
    }
  }
}

function setOption (option, innerHTML, value, selected = false) {
  option.innerHTML = innerHTML
  option.value = value
  option.selected = selected
}

function loadDataFromFormat (formatName) {
  const format = formats[formatName]
  let i = document.getElementById('input_labelLines').value
  if (!subModeData) {
    setValueOfElemId('input_fileName', format.name)
    setValueOfElemId('input_labelLines', Number(format.lines))
    currentFormat = format
    setValueOfElemId('input_example', currentFormat.example.shelfmark)
  } else {
    setValueOfElemId('input_fileName', subModeData.name)
    setValueOfElemId('input_labelLines', subModeData.lines)
    setValueOfElemId('input_example', subModeData.example.shelfmark)
    format.lines = subModeData.lines
    currentFormat = formats[subModeData.name]
    /*
    if (!currentFormat) {
      currentFormat = formats[subModeData.prevName]
    }
    */
    if (!currentFormat || currentFormat === '') {
      currentFormat = subModeData
    }
    currentFormat.example = subModeData.example
  }
  setValueOfElemId('selectPrinter', format.printer)
  setValueOfElemId('input_paperHeight', Number(format.paper.height))
  setValueOfElemId('input_paperWidth', Number(format.paper.width))
  setValueOfElemId('input_labelHeight', Number(format.label.height.split('mm')[0]))
  changeLabelHeight()
  setValueOfElemId('input_labelWidth', Number(format.label.width.split('mm')[0]))
  changeLabelWidth()
  while (i < format.lines) {
    addLine()
    i++
  }
  while (i > format.lines) {
    removeLine()
    i--
  }
  i = 0
  parts = []
  while (i < currentFormat.lines) {
    if (currentFormat.example.parts[i] !== '') {
      document.getElementById('line_' + (i + 1)).innerHTML = currentFormat.example.parts[i]
      parts.push(currentFormat.example.parts[i])
    } else {
      document.getElementById('line_' + (i + 1)).innerHTML = '<br/>'
      parts.push('<br/>')
    }
    i++
  }
  document.getElementById('lineSpace').value = Number(format.lineSpace)
  changeLineSpace()
  const centerHor = document.getElementById('centerHor')
  if (format.centerHor) {
    if (!centerHor.checked) {
      centerHor.click()
    }
  } else {
    if (centerHor.checked) {
      centerHor.click()
    }
  }
  const centerVer = document.getElementById('centerVer')
  if (format.centerVer) {
    if (!centerVer.checked) {
      centerVer.click()
    }
  } else {
    if (centerVer.checked) {
      centerVer.click()
    }
  }
  document.getElementById('centerHor').checked = format.centerHor
  document.getElementById('centerVer').checked = format.centerVer
  setValueOfElemId('marginTop', format.marginTop)
  for (let i = 1; i <= format.lines; i++) {
    const k = i - 1
    if (format.linesData[k]) {
      setValueOfElemId('fontLine_' + i, format.linesData[k].font)
    }
    const evt = { target: { id: '' } }
    evt.target.id = '_' + i
    changeLineFont(evt)
    if (format.linesData[k]) {
      setValueOfElemId('fontSizeLine_' + i, format.linesData[k].fontSize)
    }
    changeLineFontSize(evt)
    let chkbx = document.getElementById('bold_' + i)
    if (format.linesData[k] && format.linesData[k].bold) {
      if (!chkbx.checked) {
        chkbx.click()
      }
    } else {
      if (chkbx.checked) {
        chkbx.click()
      }
    }
    chkbx = document.getElementById('italic_' + i)
    if (format.linesData[k] && format.linesData[k].italic) {
      if (!chkbx.checked) {
        chkbx.click()
      }
    } else {
      if (chkbx.checked) {
        chkbx.click()
      }
    }
    if (format.linesData[k]) {
      setValueOfElemId('indent_' + i, format.linesData[k].indent)
    }
    changeLineIndent(evt)
  }
}

function changeLabelHeight (event) {
  document.getElementById('previewBox').style.height = getValueOfElemId('input_labelHeight') + 'mm'
}

function changeLabelWidth (event) {
  document.getElementById('previewBox').style.width = getValueOfElemId('input_labelWidth') + 'mm'
}

function saveConfig () {
  if (document.getElementById('input_fileName').value !== '') {
    if (document.getElementById('selectPrinter').value !== '') {
      if (subModeData && subModeData.prevName !== '') {
        removePrevNameFiles()
      }
      if (!fs.existsSync(defaultProgramPath + '\\Formate\\' + getValueOfElemId('input_fileName') + '.json')) {
        writeToFiles()
        alert('Das Format wurde hinzugefügt.')
        close()
      } else {
        const override = confirm('Wollen Sie die Änderungen übernehmen?')
        if (override) {
          writeToFiles()
          alert('Das Format wurde angepasst.')
          close()
        } else {
          document.getElementById('selectFormat').focus()
        }
      }
    } else {
      alert('Es muss ein Druckername angegeben werden.')
      document.getElementById('selectPrinter').focus()
    }
  } else {
    alert('Es wurde kein Format ausgewählt!')
    document.getElementById('selectFormat').focus()
  }

  function writeToFiles () {
    const objct = setObjct()
    fs.writeFileSync(defaultProgramPath + '\\FormateCSS\\' + getValueOfElemId('input_fileName') + '.css', createCSS(objct), 'utf8')
    fs.writeFileSync(defaultProgramPath + '\\Formate\\' + getValueOfElemId('input_fileName') + '.json', JSON.stringify(objct, null, 2), 'utf8')
    ipcRenderer.send('newConfig')
  }
}

function removePrevNameFiles () {
  removeFile(defaultProgramPath + '\\Formate\\' + subModeData.prevName + '.json')
  removeFile(defaultProgramPath + '\\FormateCSS\\' + subModeData.prevName + '.css')

  function removeFile (path) {
    fs.unlink(path, function (err) {
      if (err) {
        throw err
      }
    })
  }
}

function setObjct () {
  const newConfig = {
    name: getValueOfElemId('input_fileName'),
    printer: getValueOfElemId('selectPrinter'),
    label: {
      width: getValueOfElemId('input_labelWidth') + 'mm',
      height: getValueOfElemId('input_labelHeight') + 'mm'
    },
    pdfName: getValueOfElemId('input_fileName') + '.pdf',
    paper: {
      width: getValueOfElemId('input_paperWidth'),
      height: getValueOfElemId('input_paperHeight')
    },
    lines: getValueOfElemId('input_labelLines'),
    example: {
      shelfmark: getValueOfElemId('input_example'),
      parts: parts
    },
    centerHor: document.getElementById('centerHor').checked,
    centerVer: document.getElementById('centerVer').checked,
    lineSpace: getValueOfElemId('lineSpace'),
    linesData: '',
    marginTop: getValueOfElemId('marginTop')
  }
  const linesData = []
  let i = 0
  while (i < newConfig.lines) {
    const lineData = {
      id: i + 1,
      font: getValueOfElemId('fontLine_' + (i + 1)),
      fontSize: getValueOfElemId('fontSizeLine_' + (i + 1)),
      bold: document.getElementById('bold_' + (i + 1)).checked,
      italic: document.getElementById('italic_' + (i + 1)).checked,
      indent: getValueOfElemId('indent_' + (i + 1))
    }
    linesData[i] = lineData
    i++
  }

  newConfig.linesData = linesData

  return newConfig
}

// TODO perhaps in an extra class? - it's too much for this file - maybe there is a library?
function createCSS (obj) {
  let contentCSS = ''
  contentCSS = label(contentCSS)
  contentCSS = centerHor(contentCSS)
  contentCSS = centerVer(contentCSS)
  contentCSS = lineSpace(contentCSS)
  contentCSS = linesStyle(contentCSS)
  contentCSS = printCenterLabel(contentCSS)

  return contentCSS

  function printCenterLabel (str) {
    let marginTopValue = (obj.paper.height - fromMilliToMicro(obj.label.height)) / 2000
    let marginLeftValue = (obj.paper.width - fromMilliToMicro(obj.label.width)) / 2000
    if (marginTopValue <= 1) {
      marginTopValue = 0
    }
    /*
    with electron 3.0.4 and printToPDF(marginsType 1) there is a margin of 2mm by default
    even with @print margin 0mm
    thats why we substract 2
    */
    marginLeftValue = marginLeftValue - 1

    let marginTopAdjustmentValue = getValueOfElemId('marginTop')
    if (marginTopAdjustmentValue === '') {
      marginTopAdjustmentValue = 0
    }
    str += '@media print {\n#toPrint.format_' + obj.name + ' > .innerBox {\nmargin: ' + marginTopValue + 'mm 0mm 0mm ' + marginLeftValue + 'mm;\n}\n'
    str += 'body {\nmargin: 0px;\n}\n'
    str += '#toPrint.format_' + obj.name + ' > .innerBox > .line_1 {\nmargin-top: ' + marginTopAdjustmentValue + 'mm;\n}\n'
    str += '}'
    return str

    function fromMilliToMicro (str) {
      return (str.split('mm')[0] * 1000)
    }
  }
  function linesStyle (str) {
    for (const line of obj.linesData) {
      str += '.format_' + obj.name + ' > .innerBox > .line_' + line.id + ' {\n'
      str += 'font-family: "' + line.font + '";\n'
      str += 'font-size: ' + line.fontSize + 'pt;\n'
      if (line.bold) {
        str += 'font-weight: bold;\n'
      } else {
        str += 'font-weight: normal;\n'
      }
      if (line.italic) {
        str += 'font-style: italic;\n'
      } else {
        str += 'font-style: normal;\n'
      }
      str += 'margin-left: ' + line.indent + '%;\n'
      str += '}\n'
    }
    return str
  }
  function lineSpace (str) {
    str += '.format_' + obj.name + ' > .innerBox > p {\nmargin: ' + obj.lineSpace + 'px 0px ' + obj.lineSpace + 'px 0px;\n}\n'
    return str
  }
  function centerVer (str) {
    if (obj.centerVer) {
      str += '.format_' + obj.name + ' {\nalign-items: center;\n}\n'
      str += '#toPrint.format_' + obj.name + '> .innerBox {\nheight: ' + obj.label.height + ';\nwidth: ' + obj.label.width + ';\ndisplay: flex;\njustify-content: center;\nflex-direction: column;\n}\n'
    } else {
      str += '.format_' + obj.name + ' {\nalign-items: initial;\n}\n'
      str += '#toPrint.format_' + obj.name + '.innerBox {\nheight: ' + obj.label.height + ';\nwidth: ' + obj.label.width + ';\n}\n'
    }
    return str
  }
  function centerHor (str) {
    if (obj.centerHor) {
      str += '.format_' + obj.name + ' {\ntext-align: center;\n'
    } else {
      str += '.format_' + obj.name + ' {\ntext-align: initial;\n'
    }
    str += 'white-space: nowrap;\noverflow: hidden;\n}\n'
    return str
  }
  function label (str) {
    str += '#previewBox.format_' + obj.name + ' {\nwidth: ' + obj.label.width + ';\nheight: ' + obj.label.height + ';\n}\n'
    return str
  }
}

function close () {
  ipcRenderer.send('closeEditorWindow')
}

function addLine () {
  const line = document.createElement('p')
  lineCounter++
  line.id = 'line_' + lineCounter
  line.class = ''
  document.getElementById('innerBox').appendChild(line)
  setValueOfElemId('input_labelLines', lineCounter)
  addTableLine(lineCounter)
  changeLineSpace()
}

function removeLine () {
  if (lineCounter > 1) {
    removeTableLine(lineCounter)
    const parent = document.getElementById('innerBox')
    const toDelete = parent.childNodes[lineCounter + 1]
    toDelete.parentNode.removeChild(toDelete)
    lineCounter--
    setValueOfElemId('input_labelLines', lineCounter)
  }
}

function changeLineSpace () {
  const lines = document.getElementById('innerBox').children.length
  let i = 1
  while (i <= lines) {
    document.getElementById('line_' + i).style.marginBottom = document.getElementById('line_' + i).style.marginTop = getValueOfElemId('lineSpace') + 'px'
    i++
  }
}

function addTableLine (id) {
  if (id === undefined) {
    id = 0
  } else {
    id = id - 1
  }
  const table = document.getElementById('tableLinesBody')
  const row = table.insertRow(id)
  row.className = 'rowLine_' + (id + 1)
  const cell = row.insertCell(0)
  cell.innerHTML = id + 1
  addTableLineFontSelect(id, row)
  addTableLineFontSize(id, row)
  addTableLineBold(id, row)
  addTableLineItalic(id, row)
  addTableLineIndent(id, row)
}

function removeTableLine (id) {
  document.getElementById('tableLinesBody').deleteRow(id - 1)
}

function addTableLineFontSelect (id, row) {
  const cell = row.insertCell(1)
  const selectDiv = document.createElement('div')
  selectDiv.className = 'select'
  const select = document.createElement('select')
  select.id = 'fontLine_' + (id + 1)
  fonts.forEach(element => {
    const font = document.createElement('option')
    if (element === 'Arial Narrow') {
      font.selected = true
    }
    font.value = element
    font.innerHTML = element
    select.appendChild(font)
  })
  select.addEventListener('input', changeLineFont)
  selectDiv.appendChild(select)
  cell.appendChild(selectDiv)
}

function addTableLineFontSize (id, row) {
  const cell = row.insertCell(2)
  const input = document.createElement('input')
  input.id = 'fontSizeLine_' + (id + 1)
  input.type = 'number'
  input.value = 14
  input.className = 'input'
  input.addEventListener('input', changeLineFontSize)
  cell.appendChild(input)
}

function addTableLineBold (id, row) {
  const cell = row.insertCell(3)
  const input = document.createElement('input')
  input.id = 'bold_' + (id + 1)
  input.type = 'checkbox'
  input.addEventListener('click', changeLineBold)
  cell.appendChild(input)
}

function addTableLineItalic (id, row) {
  const cell = row.insertCell(4)
  const input = document.createElement('input')
  input.id = 'italic_' + (id + 1)
  input.type = 'checkbox'
  input.addEventListener('click', changeLineItalic)
  cell.appendChild(input)
}

function addTableLineIndent (id, row) {
  const cell = row.insertCell(5)
  const input = document.createElement('input')
  input.id = 'indent_' + (id + 1)
  input.type = 'number'
  input.value = 0
  input.className = 'input'
  input.addEventListener('input', changeLineIndent)
  cell.appendChild(input)
}

function changeLineIndent (event) {
  const elemId = getId(event)
  document.getElementById('line_' + elemId).style.marginLeft = getValueOfElemId('indent_' + elemId) + '%'
}

function changeLineItalic (event) {
  const elemId = getId(event)
  if (document.getElementById('line_' + elemId).style.fontStyle === 'italic') {
    document.getElementById('line_' + elemId).style.fontStyle = 'normal'
  } else {
    document.getElementById('line_' + elemId).style.fontStyle = 'italic'
  }
}

function changeLineBold (event) {
  const elemId = getId(event)
  if (document.getElementById('line_' + elemId).style.fontWeight === 'bold') {
    document.getElementById('line_' + elemId).style.fontWeight = 'inherit'
  } else {
    document.getElementById('line_' + elemId).style.fontWeight = 'bold'
  }
}

function changeLineFont (event) {
  const elemId = getId(event)
  document.getElementById('line_' + elemId).style.fontFamily = '"' + getValueOfElemId('fontLine_' + elemId) + '"'
}

function getId (event) {
  const htmlElement = event.target.id
  const parts = htmlElement.split('_')
  return parts[1]
}

function changeLineFontSize (event) {
  const elemId = getId(event)

  document.getElementById('line_' + elemId).style.fontSize = getValueOfElemId('fontSizeLine_' + elemId) + 'pt'
}

function centerHor () {
  if (!document.getElementById('centerHor').checked) {
    document.getElementById('previewBox').style.textAlign = 'initial'
  } else {
    document.getElementById('previewBox').style.textAlign = 'center'
  }
}

function centerVer () {
  if (!document.getElementById('centerVer').checked) {
    document.getElementById('previewBox').style.alignItems = 'initial'
  } else {
    document.getElementById('previewBox').style.alignItems = 'center'
  }
}

function getPrinterNameList () {
  const nameList = []
  let i = 0
  _.forEach(printerList, function (key) {
    nameList[i] = key.name
    i++
  })
  return nameList
}

function setValueOfElemId (elemId, value) {
  document.getElementById(elemId).value = value
}

function getValueOfElemId (elemId) {
  return document.getElementById(elemId).value
}

// adds event listener to the labelSize inputs
document.getElementById('input_labelHeight').addEventListener('input', changeLabelHeight)
document.getElementById('input_labelWidth').addEventListener('input', changeLabelWidth)
// adds event listener to the save button
document.getElementById('btn_save').addEventListener('click', saveConfig)
// adds event listener to the close button
document.getElementById('btn_close').addEventListener('click', close)
// adds event listener to the lineSpace input
document.getElementById('lineSpace').addEventListener('input', changeLineSpace)
// adds event listener to the centerHor input
document.getElementById('centerHor').addEventListener('click', centerHor)
// adds event listener to the centerVer input
document.getElementById('centerVer').addEventListener('click', centerVer)
