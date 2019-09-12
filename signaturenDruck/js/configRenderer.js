// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the fs-module
const fs = require('fs')

// requires the lodash-module
const _ = require('lodash')

const moment = require('moment')

const FormatLinesByMode = require('./classes/FormatLinesByMode')

// required for ipc calls to the main process
const { ipcRenderer, remote } = require('electron')

const config = remote.getGlobal('config')
const defaultProgramPath = remote.getGlobal('defaultProgramPath')
const LocationCheck = require('./classes/LocationCheck')

let modeNames = []
let modesData = []
let linesData = []
let resultData = []

window.onload = function () {
  getModes()
  setModeSelect()
  displayLocFilter()
  loadExampleData()
}

function displayLocFilter () {
  if (config.get('filterByLoc')) {
    document.getElementById('locLine').style.display = 'flex'
    document.getElementById('locRegExLine').style.display = 'flex'
  } else {
    document.getElementById('locLine').style.display = 'none'
    document.getElementById('locRegExLine').style.display = 'none'
  }
}

function close () {
  ipcRenderer.send('closeConfigWindow')
}

function createPreview () {
  clearPreview()
  if (config.get('filterByLoc') && !LocationCheck.locDoesMatch(document.getElementById('input_locRegEx').value, document.getElementById('input_loc').value)) {
    alert('Der RegEx Standort erfasst nicht den festgelegten Standort!')
  } else {
    let lines = document.getElementById('linesBox').childNodes
    let data = []
    lines.forEach(function (line) {
      data.push(line.value)
    })
    if (config.get('filterByLoc')) {
      resultData = data = FormatLinesByMode.formatLines(document.getElementById('input_loc').value, linesData, data, linesData.length)
    } else {
      resultData = data = FormatLinesByMode.formatLines(config.get('example.location'), linesData, data, linesData.length)
    }
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
}

// loads and fills fields with exampleData form the config
function loadExampleData () {
  document.getElementById('input_example').value = document.getElementById('input_example').placeholder = config.get('example.shelfmark')
  document.getElementById('input_regEx').value = document.getElementById('input_regEx').placeholder = config.get('example.regex')
  document.getElementById('input_delimiter').value = document.getElementById('input_delimiter').placeholder = config.get('example.delimiter')
  if (config.get('filterByLoc')) {
    document.getElementById('input_loc').placeholder = config.get('example.location')
    document.getElementById('input_locRegEx').placeholder = '^' + config.get('example.location') + '$'
  }
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
  if (config.get('filterByLoc')) {
    if (subModeData.exampleLoc !== undefined) {
      document.getElementById('input_loc').value = subModeData.exampleLoc
    } else {
      document.getElementById('input_loc').placeholder = config.get('example.location')
    }
    if (subModeData.locRegEx !== undefined) {
      document.getElementById('input_locRegEx').value = subModeData.locRegEx
    } else {
      document.getElementById('input_locRegEx').placeholder = '^' + config.get('example.location') + '$'
    }
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
}

function displayPlaceholderInfo (lines = '') {
  let infoBox = document.getElementById('infoBox')
  infoBox.innerHTML = ''

  if (lines !== '') {
    let i = 1
    _.forEach(lines, function (value) {
      createPlaceholderLine('$' + i + ' - "' + value + '"')
      i++
    })
    if (config.get('filterByLoc')) {
      createPlaceholderLine('$LOC - "' + document.getElementById('input_loc').value + '"')
    } else {
      createPlaceholderLine('$LOC - "' + config.get('example.location') + '"')
    }
    createPlaceholderLine('$DATE - "' + moment().format('DD.MM.YYYY') + '"')
  }
}

function createPlaceholderLine (text) {
  let p = document.createElement('p')
  p.innerHTML = text
  document.getElementById('infoBox').appendChild(p)
}

// fills selectSubMode with options
function setSubModeSelect (modeName) {
  clearAll()
  let select = document.getElementById('selectSubMode')
  let option = document.createElement('option')
  select.innerHTML = ''
  setOption(option, '--neuer Untermodus--', '', true)
  select.appendChild(option)
  if (modeName !== '') {
    modesData[modeName].subModes.forEach(element => {
      option = document.createElement('option')
      setOption(option, element.format, element.format)
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
  setOption(option, '--neuer Modus--', '', true)
  select.appendChild(option)
  modeNames.forEach(element => {
    option = document.createElement('option')
    setOption(option, element, element)
    select.appendChild(option)
    select.onchange = function () {
      document.getElementById('input_modeName').value = select.value
      document.getElementById('input_subModeName').value = ''
      setSubModeSelect(select.value)
    }
  })
}

function setOption (option, innerHTML, value, selected = false) {
  option.innerHTML = innerHTML
  option.value = value
  option.selected = selected
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

function setLine (line, id, className, type) {
  line.id = id
  line.className = className
  line.type = type
}

// creates nr of input lines
function createLines (nrOfLines, array = '') {
  deleteInputLines()
  let i = 1
  while (i <= nrOfLines) {
    let line = document.createElement('input')
    setLine(line, 'input_line_' + i, 'input fullwidth', 'text')
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
  setLine(line, 'input_line_' + lineCount, 'input fullwidth', 'text')
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

function setValues (obj) {
  obj.format = getSubModeNameNew().replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_')
  obj.useRegEx = !document.getElementById('input_regEx').disabled
  obj.regEx = document.getElementById('input_regEx').value
  obj.delimiter = document.getElementById('input_delimiter').value
  obj.exampleShelfmark = document.getElementById('input_example').value
  obj.result = getResult()
  if (config.get('filterByLoc')) {
    obj.exampleLoc = document.getElementById('input_loc').value
    obj.locRegEx = document.getElementById('input_locRegEx').value
  } else {
    obj.exampleLoc = config.get('example.location')
    obj.locRegEx = ''
  }
}

function saveMode () {
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
        setValues(value)
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
      setValues(value)
      modeDataNew.subModes.push(value)
    }
  } else {
    // if mode is new
    let value = {}
    value.id = 0
    setValues(value)
    modeDataNew.subModes.push(value)
  }
  if (getModeNameOld() !== '') {
    deleteModeFile(getModeNameOld())
  }
  writeModeFile(modeDataNew)
}

function saveAndExit () {
  if (document.getElementById('input_modeName').value !== '' && document.getElementById('input_subModeName').value !== '') {
    if (getSubModeNameNew() === getSubModeNameOld()) {
      if (config.get('filterByLoc') && !LocationCheck.locDoesMatch(document.getElementById('input_locRegEx').value, document.getElementById('input_loc').value)) {
        alert('Der RegEx Standort erfasst nicht den festgelegten Standort!')
      } else {
        saveMode()
        close()
      }
    } else {
      // better disable the button if condition is not met
      alert('Für den neuen Untermodus muss noch ein Format festgelegt werden.')
    }
  } else {
    alert('Es muss ein Modusname/Untername vergeben sein.')
  }
}

function saveAndContinue () {
  if (document.getElementById('input_modeName').value !== '' && document.getElementById('input_subModeName').value !== '') {
    if (modeAlreadyExists(getModeNameNew())) {
      alert('Es liegbt bereits ein Modus mit diesem Namen vor.')
    } else {
      if (getSubModeNameNew() === getSubModeNameOld() || !subModeAlreadyExists(getSubModeNameNew())) {
        if (config.get('filterByLoc') && !LocationCheck.locDoesMatch(document.getElementById('input_locRegEx').value, document.getElementById('input_loc').value)) {
          alert('Der RegEx Standort erfasst nicht den festgelegten Standort!')
        } else {
          saveMode()

          ipcRenderer.send('createNewModeFormat', getCurrentData())
          close()
        }
      } else {
        alert('Es liegt bereits ein Untermodus mit diesem Namen vor.')
      }
    }
  } else {
    // can't save, modename/submodename empty
    alert('Es muss ein Modusname/Untername vergeben sein.')
  }
}

function getCurrentData () {
  let data = {}
  data.name = getSubModeNameNew().replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_')
  data.lines = getLineCount()
  data.example = {}
  data.example.shelfmark = document.getElementById('input_example').value
  data.example.parts = resultData
  if (config.get('filterByLoc')) {
    data.example.loc = document.getElementById('input_loc').value
  } else {
    data.example.loc = config.get('filterByLoc')
  }
  data.prevName = getSubModeNameOld()

  return data
}

function modeAlreadyExists (modeName) {
  let found = false
  if (getModeNameOld() !== modeName) {
    _.forEach(modeNames, function (value) {
      if (value === modeName) {
        found = true
      }
    })
  }
  return found
}

function subModeAlreadyExists (subModeName) {
  let found = false
  if (getModeNameOld() !== '') {
    let subModes = modesData[getModeNameOld()].subModes
    _.forEach(subModes, function (value) {
      if (value.format === subModeName) {
        found = true
      }
    })
  }
  return found
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
  fs.writeFileSync(defaultProgramPath + '\\Modi\\' + data.modeName + '.json', JSON.stringify(data, null, 2), 'utf8')
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
document.getElementById('btn_saveAndExit').addEventListener('click', saveAndExit)
