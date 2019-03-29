// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the fs-module
const fs = require('fs')

// requires the lodash-module
const _ = require('lodash')

// required for ipc calls to the main process
const { ipcRenderer, remote } = require('electron')

const fontManager = require('font-manager')

const printerList = remote.getCurrentWindow().webContents.getPrinters()
const defaultProgramPath = remote.getGlobal('defaultProgramPath')
const config = remote.getGlobal('config')

let lineCounter = 1

let currentFormat = ''
let fonts = []
let formats = []
let selectOptions = []
let parts = []

window.onload = function () {
  setFontsList()
  setPrinterSelect()
  getFormats()
  setFormatsSelect()
  changeLineSpace()
  addTableLine()
  document.getElementById('line_1').style.fontFamily = document.getElementById('fontLine_1').value
}

ipcRenderer.on('newModeFormat', function (event, data) {
  if (data === '') {
    lineCounter = 1
    document.getElementById('input_labelLines').value = 1
    document.getElementById('input_fileName').value = ''
    document.getElementById('input_example').value = config.get('example.shelfmark')
  } else {
    document.getElementById('input_fileName').value = data.format
    document.getElementById('input_example').value = data.exampleShelfmark
    while (document.getElementById('tableLinesBody').childNodes.length < data.nrOfLines) {
      addLine()
    }
    let i = 0
    while (i < data.nrOfLines) {
      if (data.lines[i] !== '') {
        document.getElementById('line_' + (i + 1)).innerHTML = data.lines[i]
        parts.push(data.lines[i])
      } else {
        document.getElementById('line_' + (i + 1)).innerHTML = '<br/>'
        parts.push('<br/>')
      }
      i++
    }
  }
})

function setFontsList () {
  let fontsList = []
  fonts = fontManager.getAvailableFontsSync()

  fonts.forEach(element => {
    fontsList.push(element.family)
  })

  fonts = _.uniq(fontsList)
  fonts.sort()
}

function setPrinterSelect () {
  let list = getPrinterNameList()
  let select = document.getElementById('selectPrinter')
  let option = document.createElement('option')
  option.value = ''
  option.innerHTML = '--auswählen--'
  option.selected = true
  select.appendChild(option)
  list.forEach(element => {
    option = document.createElement('option')
    option.value = element
    option.innerHTML = element
    select.appendChild(option)
  })
}

// TODO that's not good it's hard coded
function getFormats () {
  let files = fs.readdirSync(defaultProgramPath + '\\Formate')
  for (let file of files) {
    let fileName = file.split('.json')[0]
    selectOptions.push(fileName)
    formats[fileName] = JSON.parse(fs.readFileSync(defaultProgramPath + '\\Formate\\' + file, 'utf8'))
  }
}

function setFormatsSelect () {
  let select = document.getElementById('selectFormat')
  selectOptions.forEach(element => {
    let option = document.createElement('option')
    option.value = element
    option.innerHTML = element
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

function loadDataFromFormat (formatName) {
  let format = formats[formatName]
  currentFormat = format
  document.getElementById('input_fileName').value = format.name
  document.getElementById('selectPrinter').value = format.printer
  document.getElementById('input_paperHeight').value = Number(format.paper.height)
  document.getElementById('input_paperWidth').value = Number(format.paper.width)
  document.getElementById('input_labelHeight').value = Number(format.label.height.split('mm')[0])
  changeLabelHeight()
  document.getElementById('input_labelWidth').value = Number(format.label.width.split('mm')[0])
  changeLabelWidth()
  document.getElementById('input_example').value = currentFormat.example.shelfmark
  let i = document.getElementById('input_labelLines').value
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
  document.getElementById('input_labelLines').value = Number(format.lines)
  document.getElementById('lineSpace').value = Number(format.lineSpace)
  changeLineSpace()
  let centerHor = document.getElementById('centerHor')
  if (format.centerHor) {
    if (!centerHor.checked) {
      centerHor.click()
    }
  } else {
    if (centerHor.checked) {
      centerHor.click()
    }
  }
  let centerVer = document.getElementById('centerVer')
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
  document.getElementById('marginTop').value = format.marginTop
  for (let i = 1; i <= format.lines; i++) {
    let k = i - 1
    document.getElementById('fontLine_' + i).value = format.linesData[k].font
    let evt = { 'target': { 'id': '' } }
    evt.target.id = '_' + i
    changeLineFont(evt)
    document.getElementById('fontSizeLine_' + i).value = format.linesData[k].fontSize
    changeLineFontSize(evt)
    let chkbx = document.getElementById('bold_' + i)
    if (format.linesData[k].bold) {
      if (!chkbx.checked) {
        chkbx.click()
      }
    } else {
      if (chkbx.checked) {
        chkbx.click()
      }
    }
    chkbx = document.getElementById('italic_' + i)
    if (format.linesData[k].italic) {
      if (!chkbx.checked) {
        chkbx.click()
      }
    } else {
      if (chkbx.checked) {
        chkbx.click()
      }
    }
    document.getElementById('indent_' + i).value = format.linesData[k].indent
    changeLineIndent(evt)
  }
}

function changeLabelHeight (event) {
  document.getElementById('previewBox').style.height = document.getElementById('input_labelHeight').value + 'mm'
}

function changeLabelWidth (event) {
  document.getElementById('previewBox').style.width = document.getElementById('input_labelWidth').value + 'mm'
}

function saveConfig () {
  if (document.getElementById('input_fileName').value !== '') {
    if (document.getElementById('selectPrinter').value !== '') {
      if (!fs.existsSync(defaultProgramPath + '\\Formate\\' + document.getElementById('input_fileName').value + '.json')) {
        writeToFiles()
        alert('Das Format wurde hinzugefügt.')
        close()
      } else {
        let override = confirm('Wollen Sie die Änderungen übernehmen?')
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
    let objct = setObjct()
    fs.writeFileSync(defaultProgramPath + '\\FormateCSS\\' + document.getElementById('input_fileName').value + '.css', createCSS(objct), 'utf8')
    fs.writeFileSync(defaultProgramPath + '\\Formate\\' + document.getElementById('input_fileName').value + '.json', JSON.stringify(objct), 'utf8')
    ipcRenderer.send('newConfig')
  }
}

function setObjct () {
  let newConfig = {
    'name': document.getElementById('input_fileName').value,
    'printer': document.getElementById('selectPrinter').value,
    'label': {
      'width': document.getElementById('input_labelWidth').value + 'mm',
      'height': document.getElementById('input_labelHeight').value + 'mm'
    },
    'pdfName': document.getElementById('input_fileName').value + '.pdf',
    'paper': {
      'width': document.getElementById('input_paperWidth').value,
      'height': document.getElementById('input_paperHeight').value
    },
    'lines': document.getElementById('input_labelLines').value,
    'example': {
      'shelfmark': document.getElementById('input_example').value,
      'parts': parts
    },
    'centerHor': document.getElementById('centerHor').checked,
    'centerVer': document.getElementById('centerVer').checked,
    'lineSpace': document.getElementById('lineSpace').value,
    'linesData': '',
    'marginTop': document.getElementById('marginTop').value
  }

  if (currentFormat.splitByRegEx && document.getElementById('chkbx_regEx').checked) {
    newConfig.splitByRegEx = currentFormat.splitByRegEx
  }

  let linesData = []
  let i = 0
  while (i < newConfig.lines) {
    let lineData = {
      'id': i + 1,
      'font': document.getElementById('fontLine_' + (i + 1)).value,
      'fontSize': document.getElementById('fontSizeLine_' + (i + 1)).value,
      'bold': document.getElementById('bold_' + (i + 1)).checked,
      'italic': document.getElementById('italic_' + (i + 1)).checked,
      'indent': document.getElementById('indent_' + (i + 1)).value
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
    marginLeftValue = marginLeftValue - 2

    let marginTopAdjustmentValue = document.getElementById('marginTop').value
    if (marginTopAdjustmentValue === '') {
      marginTopAdjustmentValue = 0
    }
    str += '@media print {\n#toPrint.format_' + obj.name + ' > .innerBox {\nmargin: ' + marginTopValue + 'mm 0mm 0mm ' + marginLeftValue + 'mm;\n}\n'
    str += '#toPrint.format_' + obj.name + ' > .innerBox > .line_1 {\nmargin-top: ' + marginTopAdjustmentValue + 'mm;\n}\n'
    str += '}'
    return str

    function fromMilliToMicro (str) {
      return (str.split('mm')[0] * 1000)
    }
  }
  function linesStyle (str) {
    for (let line of obj.linesData) {
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
  let line = document.createElement('p')
  lineCounter++
  line.id = 'line_' + lineCounter
  line.class = ''
  document.getElementById('innerBox').appendChild(line)
  document.getElementById('input_labelLines').value = lineCounter
  addTableLine(lineCounter)
  changeLineSpace()
}

function removeLine () {
  if (lineCounter > 1) {
    removeTableLine(lineCounter)
    let parent = document.getElementById('innerBox')
    let toDelete = parent.childNodes[lineCounter + 1]
    toDelete.parentNode.removeChild(toDelete)
    lineCounter--
    document.getElementById('input_labelLines').value = lineCounter
  }
}

function changeLineSpace () {
  let lines = document.getElementById('innerBox').children.length
  let i = 1
  while (i <= lines) {
    document.getElementById('line_' + i).style.marginBottom = document.getElementById('line_' + i).style.marginTop = document.getElementById('lineSpace').value + 'px'
    i++
  }
}

function addTableLine (id) {
  if (id === undefined) {
    id = 0
  } else {
    id = id - 1
  }
  let table = document.getElementById('tableLinesBody')
  let row = table.insertRow(id)
  row.className = 'rowLine_' + (id + 1)
  let cell = row.insertCell(0)
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
  let cell = row.insertCell(1)
  let selectDiv = document.createElement('div')
  selectDiv.className = 'select'
  let select = document.createElement('select')
  select.id = 'fontLine_' + (id + 1)
  fonts.forEach(element => {
    let font = document.createElement('option')
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
  let cell = row.insertCell(2)
  let input = document.createElement('input')
  input.id = 'fontSizeLine_' + (id + 1)
  input.type = 'number'
  input.value = 14
  input.className = 'input'
  input.addEventListener('input', changeLineFontSize)
  cell.appendChild(input)
}

function addTableLineBold (id, row) {
  let cell = row.insertCell(3)
  let input = document.createElement('input')
  input.id = 'bold_' + (id + 1)
  input.type = 'checkbox'
  input.addEventListener('click', changeLineBold)
  cell.appendChild(input)
}

function addTableLineItalic (id, row) {
  let cell = row.insertCell(4)
  let input = document.createElement('input')
  input.id = 'italic_' + (id + 1)
  input.type = 'checkbox'
  input.addEventListener('click', changeLineItalic)
  cell.appendChild(input)
}

function addTableLineIndent (id, row) {
  let cell = row.insertCell(5)
  let input = document.createElement('input')
  input.id = 'indent_' + (id + 1)
  input.type = 'number'
  input.value = 0
  input.className = 'input'
  input.addEventListener('input', changeLineIndent)
  cell.appendChild(input)
}

function changeLineIndent (event) {
  let elemId = getId(event)
  document.getElementById('line_' + elemId).style.marginLeft = document.getElementById('indent_' + elemId).value + '%'
}

function changeLineItalic (event) {
  let elemId = getId(event)
  if (document.getElementById('line_' + elemId).style.fontStyle === 'italic') {
    document.getElementById('line_' + elemId).style.fontStyle = 'normal'
  } else {
    document.getElementById('line_' + elemId).style.fontStyle = 'italic'
  }
}

function changeLineBold (event) {
  let elemId = getId(event)
  if (document.getElementById('line_' + elemId).style.fontWeight === 'bold') {
    document.getElementById('line_' + elemId).style.fontWeight = 'inherit'
  } else {
    document.getElementById('line_' + elemId).style.fontWeight = 'bold'
  }
}

function changeLineFont (event) {
  let elemId = getId(event)
  document.getElementById('line_' + elemId).style.fontFamily = '"' + document.getElementById('fontLine_' + elemId).value + '"'
}

function getId (event) {
  let htmlElement = event.target.id
  let parts = htmlElement.split('_')
  return parts[1]
}

function changeLineFontSize (event) {
  let elemId = getId(event)

  document.getElementById('line_' + elemId).style.fontSize = document.getElementById('fontSizeLine_' + elemId).value + 'pt'
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
  let nameList = []
  let i = 0
  _.forEach(printerList, function (key) {
    nameList[i] = key.name
    i++
  })
  return nameList
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
