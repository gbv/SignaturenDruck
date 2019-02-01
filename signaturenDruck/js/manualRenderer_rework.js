// required for ipc calls to the main process
const { ipcRenderer, remote } = require('electron')

const fs = require('fs')

const config = remote.getGlobal('config')
const defaultProgramPath = remote.getGlobal('defaultProgramPath')

let objct = {
  manual: []
}

// currentID
let id = 0
let max = 1
let formats = []
let selectOptions = []

window.onload = function () {
  loadFormats()
  pushFormatsToSelect()
  selectDefaultFormat()
  createByFormat(getFormatSelected().lines)
}

ipcRenderer.on('objMan', function (event, objMan) {
  if (objMan !== null) {
    objct.manual = objMan
    id = objMan.length
    max = objMan.length + 1
    setCounters()
    enableBtnPrevious()
  }
})

//TODO Thats's not good it's hard coded path
function loadFormats () {
  let files = fs.readdirSync(defaultProgramPath + '\\Formate')
  for (let file of files) {
    let fileName = file.split('.json')[0]
    selectOptions.push(fileName)
    formats[fileName] = JSON.parse(fs.readFileSync(defaultProgramPath + '\\Formate\\' + file, 'utf8'))
    addStyleFile(fileName)
  }

  function addStyleFile (format) {
    let cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.type = 'text/css'
    cssLink.href = defaultProgramPath + '/FormateCSS/' + format + '.css'
    document.head.appendChild(cssLink)
  }
}

function pushFormatsToSelect () {
  let select = document.getElementById('formatSelect')
  selectOptions.forEach(format => {
    let option = document.createElement('option')
    option.value = format
    option.innerHTML = format
    select.appendChild(option)
  })
  select.onchange = function () { createByFormat(getFormatSelected().lines) }
}

function createByFormat (numberOfLines) {
  removeInputLines()
  removePreviewLines()
  createInputLines(numberOfLines)
  createPreviewLines(numberOfLines)
  applyFormatStyle()
  addEventListener(numberOfLines)

  function addEventListener (numberOfLines) {
    for (let i = 1; i <= numberOfLines; i++) {
      let input = document.getElementById('inputLine_' + i)
      let line = document.getElementById('line_' + i)
      input.addEventListener('keyup', function (event) {
        line.innerHTML = input.value
      })
    }
  }
  function applyFormatStyle () {
    let format = getFormatSelected()
    document.getElementById('previewBox').className = 'format_' + format.name
  }
  function createPreviewLines (numberOfLines) {
    let innerPreviewBox = document.getElementById('innerPreviewBox')
    let i = 1
    while (i <= numberOfLines) {
      let line = document.createElement('p')
      line.id = 'line_' + i
      line.className = 'line_' + i
      innerPreviewBox.appendChild(line)
      i++
    }
  }
  function createInputLines (numberOfLines) {
    let box = document.getElementById('editorBox')
    let i = 1
    while (i <= numberOfLines) {
      let input = document.createElement('input')
      input.id = 'inputLine_' + i
      input.className = 'input'
      input.placeholder = 'Zeile ' + i
      input.type = 'text'
      box.appendChild(input)
      if (i !== numberOfLines) {
        box.appendChild(document.createElement('br'))
      }
      i++
    }
  }
}

function removePreviewLines () {
  removeChildsOf('innerPreviewBox')
}

function removeInputLines () {
  removeChildsOf('editorBox')
}

function removeChildsOf (parent) {
  let myNode = document.getElementById(parent)
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild)
  }
}

function getFormatSelected () {
  return formats[document.getElementById('formatSelect').value]
}

function setFormatSelected () {
  document.getElementById('formatSelect').value = objct.manual[id].format
}

function disableBtnPrevious () {
  document.getElementById('btn_previous').disabled = true
}

function enableBtnPrevious () {
  document.getElementById('btn_previous').disabled = false
}

function setCounters () {
  document.getElementById('countCurrent').innerHTML = id + 1
  document.getElementById('countMax').innerHTML = max
}

function focusFirst () {
  document.getElementById('line_1').focus()
}

function loadData () {
  setFormatSelected()
  createByFormat(getFormatSelected().lines)
  let i = 1
  while (i <= objct.manual[id].lines) {
    let txt = objct.manual[id].lineTxts[i - 1]
    document.getElementById('inputLine_' + i).value = txt
    document.getElementById('line_' + i).innerHTML = txt
    i++
  }
  if (objct.manual[id].removeIndent) {
    document.getElementById('chkbx_removeIndent').checked = true
  } else {
    document.getElementById('chkbx_removeIndent').checked = false
  }
  toggleIndent()
}

function saveCurrent () {
  let lineTxts = []
  let i = 1
  let oneLineTxt = ''
  let removeIndent = false
  let format = getFormatSelected()
  if (document.getElementById('chkbx_removeIndent').checked) {
    removeIndent = true
  }
  while (i <= format.lines) {
    lineTxts.push(document.getElementById('inputLine_' + i).value)
    oneLineTxt += document.getElementById('inputLine_' + i).value + ' '
    i++
  }
  objct.manual[id] = {
    'id': id,
    'format': format.name,
    'lines': format.lines,
    'lineTxts': lineTxts,
    'oneLineTxt': oneLineTxt,
    'removeIndent': removeIndent
  }
}

function selectDefaultFormat () {
  document.getElementById('formatSelect').value = config.get('defaultFormat')
}

function next () {
  let i = 1
  let isEmpty = true
  while (i <= getFormatSelected().lines) {
    if (document.getElementById('inputLine_' + i).value !== '') {
      isEmpty = false
    }
    i++
  }
  if (!isEmpty) {
    saveCurrent()
    id++
    if (id === 1) {
      enableBtnPrevious()
    }
    if (objct.manual[id] !== undefined) {
      loadData()
    } else {
      selectDefaultFormat()
      createByFormat(getFormatSelected().lines)
      max++
      focusFirst()
    }
    setCounters()
  }
}

function previous () {
  saveCurrent()
  if (id === 1) {
    disableBtnPrevious()
  }
  id--
  loadData()
  setCounters()
}

function deleteData () {
  reset()
  changeOrder()

  function changeOrder () {
    let i = id + 1
    while (objct.manual[i] !== undefined) {
      objct.manual[i - 1] = objct.manual[i]
      objct.manual[i].id = i - 1
      i++
    }
    delete objct.manual[i - 1]
    if (id > 0) {
      id--
      max--
    }
    setCounters()
    if (id === 0) {
      disableBtnPrevious()
    }
    if (objct.manual[id] !== undefined) {
      loadData()
    } else {
      selectDefaultFormat()
      createByFormat(getFormatSelected().lines)
    }
  }
  function reset () {
    objct.manual[id] = {}
  }
}

function deleteAndExit () {
  objct.manual = null
  ipcRenderer.send('closeManualSignaturesWindow')
}

function saveAndExit () {
  saveCurrent()
  let isEmpty = true
  if (objct.manual[objct.manual.length - 1] !== undefined) {
    let i = 1
    while (i <= objct.manual[objct.manual.length - 1].lines) {
      if (objct.manual[objct.manual.length - 1].lineTxts[i - 1] !== '') {
        isEmpty = false
      }
      i++
    }
  }
  if (isEmpty) {
    delete objct.manual[objct.manual.length - 1]
  }
  ipcRenderer.send('saveManualSignatures', objct.manual)
}

function toggleIndent () {
  let chkbx = document.getElementById('chkbx_removeIndent')
  if (chkbx.checked) {
    document.getElementById('innerPreviewBox').className = 'innerBox noIndent'
  } else {
    document.getElementById('innerPreviewBox').className = 'innerBox'
  }
}

document.getElementById('btn_next').addEventListener('click', next)
document.getElementById('btn_previous').addEventListener('click', previous)
document.getElementById('btn_delete').addEventListener('click', deleteData)
document.getElementById('btn_deleteAndExit').addEventListener('click', deleteAndExit)
document.getElementById('btn_saveAndExit').addEventListener('click', saveAndExit)
document.getElementById('chkbx_removeIndent').addEventListener('change', toggleIndent)
