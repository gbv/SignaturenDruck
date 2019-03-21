// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the fs-module
const fs = require('fs')

// requires the lodash-module
const _ = require('lodash')

const FormatLinesByMode = require('./classes/FormatLinesByMode')

// required for ipc calls to the main process
const { ipcRenderer, remote } = require('electron')

const config = remote.getGlobal('config')
const defaultProgramPath = remote.getGlobal('defaultProgramPath')

let modeNames = []
let modesData = []
let linesData = []
let resultData = []

window.onload = function () {
  getModes()
  setModeSelect()
  loadExampleData()
}

function close () {
  ipcRenderer.send('closeConfigWindow')
}

function createPreview () {
  clearPreview()
  let lines = document.getElementById('linesBox').childNodes
  let data = []
  lines.forEach(function (line) {
    data.push(line.value)
  })
  resultData = data = FormatLinesByMode.formatLines(config.get('example.location'), linesData, data, linesData.length)
  _.forEach(data, function (value) {
    let d = document.createElement('div')
    let p = document.createElement('p')
    if (value === '') {
      value = '<br/>'
    }
    p.innerHTML = value
    d.appendChild(p)
    document.getElementById('preview').appendChild(d)
  })
}

// loads and fills fields with exampleData form the config
function loadExampleData () {
  document.getElementById('input_example').value = document.getElementById('input_example').placeholder = config.get('example.shelfmark')
  document.getElementById('input_regEx').value = document.getElementById('input_regEx').placeholder = config.get('example.regex')
  document.getElementById('input_delimiter').value = document.getElementById('input_delimiter').placeholder = config.get('example.delimiter')
}

function loadSubModeData () {
  let mode = document.getElementById('selectMode').value
  let subMode = document.getElementById('selectSubMode').value
  let subModeData = _.find(modesData[mode].subModes, { 'format': subMode })
  if (subModeData.useRegEx) {
    enableRegex()
  } else {
    enableDelimiter()
  }
  document.getElementById('input_example').value = subModeData.exampleShelfmark
  document.getElementById('input_regEx').value = subModeData.regEx
  document.getElementById('input_delimiter').value = subModeData.delimiter

  createLines(subModeData.result.length, subModeData.result)
  let lines
  if (subModeData.useRegEx) {
    lines = subModeData.exampleShelfmark.match(subModeData.regEx)
    lines.shift()
  } else {
    lines = subModeData.exampleShelfmark.split(subModeData.delimiter)
  }
  linesData = lines
  displayPlaceholderInfo(lines)
  createPreview()
  // formatShelfmark(subModeData.result)

  // create preview
}

function displayPlaceholderInfo (lines = '') {
  let infoBox = document.getElementById('infoBox')
  infoBox.innerHTML = ''

  if (lines !== '') {
    let i = 1
    _.forEach(lines, function (value) {
      let p = document.createElement('p')
      p.innerHTML = '$' + i + ' - "' + value + '"'
      document.getElementById('infoBox').appendChild(p)
      i++
    })
    let p = document.createElement('p')
    p.innerHTML = '$LOC - "' + config.get('example.location') + '"'
    document.getElementById('infoBox').appendChild(p)
  }
}

// fills selectSubMode with options
function setSubModeSelect (modeName) {
  clearAll()
  let select = document.getElementById('selectSubMode')
  let option = document.createElement('option')
  select.innerHTML = ''
  option.value = ''
  option.innerHTML = '--neuer Untermodus--'
  option.selected = true
  select.appendChild(option)
  if (modeName !== '') {
    modesData[modeName].subModes.forEach(element => {
      option = document.createElement('option')
      option.value = element.format
      option.innerHTML = element.format
      select.appendChild(option)
      select.onchange = function () {
        document.getElementById('input_subModeName').value = select.value
        if (select.value !== '') {
          loadSubModeData(select.value)
        }
      }
    })
  }
}

// fills selectMode with options
function setModeSelect () {
  clearAll()
  let select = document.getElementById('selectMode')
  let option = document.createElement('option')
  select.innerHTML = ''
  option.value = ''
  option.innerHTML = '--neuer Modus--'
  option.selected = true
  select.appendChild(option)
  modeNames.forEach(element => {
    option = document.createElement('option')
    option.value = element
    option.innerHTML = element
    select.appendChild(option)
    select.onchange = function () {
      document.getElementById('input_modeName').value = select.value
      document.getElementById('input_subModeName').value = ''
      setSubModeSelect(select.value)
    }
  })
}

// gets modeNames && modesData
function getModes () {
  let files = fs.readdirSync(defaultProgramPath + '\\Modi')
  for (let file of files) {
    let fileName = file.split('.json')[0]
    modeNames.push(fileName)
    modesData[fileName] = JSON.parse(fs.readFileSync(defaultProgramPath + '\\Modi\\' + file, 'utf8'))
  }
}

// creates nr of input lines
function createLines (nrOfLines, array = '') {
  deleteInputLines()
  let i = 1
  while (i <= nrOfLines) {
    let line = document.createElement('input')
    line.id = 'input_line_' + i
    line.className = 'input fullwidth'
    line.type = 'text'
    if (array === '') {
      line.value = '$' + i
    }
    document.getElementById('linesBox').appendChild(line)
    i++
  }
  setLineCount(i - 1)
  if (array !== '' && array !== undefined && array !== null) {
    let i = 1
    _.forEach(array, function (value) {
      document.getElementById('input_line_' + i).value = value
      i++
    })
  }
}

function setLineCount (count) {
  document.getElementById('input_labelLines').value = count
}

// delete inputLines
function deleteInputLines () {
  document.getElementById('linesBox').innerHTML = ''
}

// creates shelfmark array
function formatShelfmark (data = '') {
  let shelfmark = document.getElementById('input_example').value
  document.getElementById('linesBox').innerHTML = ''
  let lines
  if (document.getElementById('radioBtn_useRegEx').checked) {
    lines = formatWithRegEx(shelfmark)
  } else {
    lines = formatWithDelimiter(shelfmark)
  }
  if (lines !== null) {
    linesData = lines
    createLines(lines.length)
    displayPlaceholderInfo(lines)
    createPreview()
  }
}

// creates shelfmark array with regex
function formatWithRegEx (shelfmark) {
  let regex = new RegExp(document.getElementById('input_regEx').value)
  let lines = shelfmark.match(regex)
  if (lines !== null) {
    lines.shift()
  }
  return lines
}

// creates shelfmark array with delimiter
function formatWithDelimiter (shelfmark) {
  let lines = shelfmark.split(document.getElementById('input_delimiter').value)
  return lines
}

function enableRegex () {
  document.getElementById('input_regEx').disabled = false
  document.getElementById('input_delimiter').disabled = true
}

function enableDelimiter () {
  document.getElementById('input_delimiter').disabled = false
  document.getElementById('input_regEx').disabled = true
}

function getLineCount () {
  return document.getElementById('input_labelLines').value
}

function addLine () {
  let line = document.createElement('input')
  let lineCount = getLineCount()
  lineCount++
  line.id = 'input_line_' + lineCount
  line.className = 'input fullwidth'
  line.type = 'text'
  document.getElementById('linesBox').appendChild(line)
  setLineCount(lineCount)
}

function removeLine () {
  let lineCount = getLineCount()
  if (lineCount > 1) {
    let parent = document.getElementById('linesBox')
    let toDelete = parent.childNodes[lineCount - 1]
    toDelete.parentNode.removeChild(toDelete)
    lineCount--
    setLineCount(lineCount)
  }
}

function clearDisplayPlaceholderInfo () {
  document.getElementById('infoBox').innerHTML = ''
}

function clearLines () {
  document.getElementById('linesBox').innerHTML = ''
  setLineCount(0)
}

function clearPreview () {
  document.getElementById('preview').innerHTML = ''
}

function clearAll () {
  clearDisplayPlaceholderInfo()
  clearLines()
  clearPreview()
}

function refresh () {
  createPreview()
}

function saveAndContinue () {
  if (document.getElementById('input_modeName').value !== '' && document.getElementById('input_subModeName').value !== '') {
    refresh()
    let modeDataNew = {
      modeName: '',
      subModes: []
    }
    // set modeName
    modeDataNew.modeName = getModeNameNew().replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_')
    // if modeNameOld != ''
    if (modesData[getModeNameOld()] !== undefined) {
      let subModesData = modesData[getModeNameOld()].subModes
      _.forEach(subModesData, function (value) {
        // if subMode gets updated
        if (value.format === getSubModeNameOld()) {
          value.format = getSubModeNameNew().replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_')
          value.useRegEx = !document.getElementById('input_regEx').disabled
          value.regEx = document.getElementById('input_regEx').value
          value.delimiter = document.getElementById('input_delimiter').value
          value.exampleShelfmark = document.getElementById('input_example').value
          value.result = getResult()
          modeDataNew.subModes.push(value)
        } else {
          // subModeData is untouched
          modeDataNew.subModes.push(value)
        }
      })
      // if subMode is new
      if (getSubModeNameOld() === '') {
        let value = {}
        value.id = subModesData.length
        value.format = getSubModeNameNew().replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_')
        value.useRegEx = !document.getElementById('input_regEx').disabled
        value.regEx = document.getElementById('input_regEx').value
        value.delimiter = document.getElementById('input_delimiter').value
        value.exampleShelfmark = document.getElementById('input_example').value
        value.result = getResult()
        modeDataNew.subModes.push(value)
      }
    } else {
      // if mode is new
      let value = {}
      value.id = 0
      value.format = getSubModeNameNew().replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_')
      value.useRegEx = !document.getElementById('input_regEx').disabled
      value.regEx = document.getElementById('input_regEx').value
      value.delimiter = document.getElementById('input_delimiter').value
      value.exampleShelfmark = document.getElementById('input_example').value
      value.result = getResult()
      modeDataNew.subModes.push(value)
    }
    if (getModeNameOld() !== '') {
      deleteModeFile(getModeNameOld())
    }
    writeModeFile(modeDataNew)
    let data = {}
    data.format = getSubModeNameNew().replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_')
    data.nrOfLines = getLineCount()
    data.exampleShelfmark = document.getElementById('input_example').value
    data.lines = resultData
    // console.log(modeDataNew, data, resultData)
    ipcRenderer.send('createNewModeFormat', data)
    close()
  } else {
    // speichern nicht moeglich, modusname/untermodusname leer
    alert('Es muss ein Modusname/Untername vergeben sein.')
  }
}

function deleteModeFile (modeName) {
  if (fs.existsSync(defaultProgramPath + '\\Modi\\' + modeName + '.json')) {
    fs.unlink(defaultProgramPath + '\\Modi\\' + modeName + '.json', function (err) {
      if (err) {
        throw err
      }
    })
  }
}

function writeModeFile (data) {
  fs.writeFileSync(defaultProgramPath + '\\Modi\\' + data.modeName + '.json', JSON.stringify(data), 'utf8')
}

function getResult () {
  let result = []
  let lines = document.getElementById('linesBox').childNodes
  lines.forEach(function (line) {
    result.push(line.value)
  })
  return result
}

function getModeNameOld () {
  return document.getElementById('selectMode').value
}

function getModeNameNew () {
  return document.getElementById('input_modeName').value
}

function getSubModeNameOld () {
  return document.getElementById('selectSubMode').value
}

function getSubModeNameNew () {
  return document.getElementById('input_subModeName').value
}

// adds event listener to the close button
document.getElementById('btn_close').addEventListener('click', close)
document.getElementById('btn_test').addEventListener('click', formatShelfmark)
document.getElementById('label_useRegEx').addEventListener('click', enableRegex)
document.getElementById('label_useDelimiter').addEventListener('click', enableDelimiter)
document.getElementById('btn_addLine').addEventListener('click', addLine)
document.getElementById('btn_removeLine').addEventListener('click', removeLine)
document.getElementById('btn_refresh').addEventListener('click', refresh)
document.getElementById('btn_save').addEventListener('click', saveAndContinue)
