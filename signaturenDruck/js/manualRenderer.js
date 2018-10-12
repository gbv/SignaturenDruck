// required for ipc calls to the main process
const ipc = require('electron').ipcRenderer

let objct = {
  manual: []
}

let id = 0
let max = 1

window.onload = function () {
  let radioButtons = document.getElementsByName('numberOfLines')
  for (let i = 0; radioButtons[ i ]; i++) {
    radioButtons[ i ].onclick = f
  }

  for (let i = 1; i <= 6; i++) {
    f()
    document.getElementById('line_' + i).addEventListener('keyup', function (event) {
      if (document.getElementById('line_' + i).value !== '') {
        document.getElementById('line' + i).innerHTML = document.getElementById('line_' + i).value
      } else {
        document.getElementById('line' + i).innerHTML = ' '
      }
    })
  }

  document.getElementById('countCurrent').innerHTML = 1
  document.getElementById('countMax').innerHTML = 1
  focusFirst()
}

ipc.on('objMan', function (event, objMan) {
  if (objMan !== null) {
    objct.manual = objMan
    id = objMan.length
    max = objMan.length + 1
    setCounters()
    document.getElementById('btn_previous').disabled = false
  }
})

function f () {
  let radioButtons = document.getElementsByName('numberOfLines')
  for (let i = 0, length = radioButtons.length; i < length; i++) {
    if (radioButtons[i].checked) {
      showInputs(radioButtons[i].value)
      document.getElementById('previewBox').classList = ''
      if (radioButtons[i].value === 1) {
        document.getElementById('previewBox').className = 'small center'
      } else if (radioButtons[i].value === 3) {
        document.getElementById('previewBox').className = 'small indent'
      } else {
        document.getElementById('previewBox').className = 'big indent'
      }
      toggleChkbx()
      break
    }
  }
}

function focusFirst () {
  document.getElementById('line_1').focus()
}

function showInputs (i) {
  removeLines()
  clearInput()
  show(i)
}

function show (i) {
  let j = 1
  let prevBox = document.getElementById('previewBox')
  let line
  while (j <= i) {
    line = document.createElement('p')
    line.id = 'line' + j
    line.className = 'previewLine'
    line.innerHTML = ' '
    prevBox.appendChild(line)
    document.getElementById('line_' + j).style.display = 'inline-block'
    j++
  }
  i++
  while (i <= 6) {
    document.getElementById('line_' + i).style.display = 'none'
    i++
  }
}

function clearInput () {
  let i = 1
  while (i <= 6) {
    if (document.getElementById('line_' + i)) {
      document.getElementById('line_' + i).value = ''
      document.getElementById('line_' + i).placeholder = 'Zeile ' + i
    }
    i++
  }
}

function removeLines () {
  let i = 1
  while (i <= 6) {
    if (document.getElementById('line' + i)) {
      document.getElementById('line' + i).outerHTML = ' '
    }
    i++
  }
}

function setCounters () {
  document.getElementById('countCurrent').innerHTML = id + 1
  document.getElementById('countMax').innerHTML = max
}

function next () {
  let i = 0
  let isEmpty = true
  while (i < getNumberOfLines()) {
    if (document.getElementById('line_' + (i + 1)).value !== '') {
      isEmpty = false
    }
    i++
  }
  if (!isEmpty) {
    saveCurrent()
    id++
    if (id === 1) {
      document.getElementById('btn_previous').disabled = false
    }
    if (objct.manual[id] !== undefined) {
      getData()
    } else {
      removeLines()
      show(getNumberOfLines())
      toggleChkbx()
      clearInput()
      max++
      focusFirst()
    }
    setCounters()
  }
}

function previous () {
  saveCurrent()
  if (id === 1) {
    document.getElementById('btn_previous').disabled = true
  }
  id--
  getData()
  setCounters()
}

function deleteData () {
  reset()
  changeOrder()

  function reset () {
    objct.manual[id] = {}
    removeLines()
    show(getNumberOfLines())
    clearInput()
  }
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
      document.getElementById('btn_previous').disabled = true
    }
    if (objct.manual[id] !== undefined) {
      getData()
    } else {
      removeLines()
      show(getNumberOfLines())
      clearInput()
    }
  }
}

function deleteAndExit () {
  objct.manual = null
  ipc.send('closeManual')
}

function saveAndExit () {
  saveCurrent()
  let indx = objct.manual.length - 1
  let lastLength
  let isEmpty = true
  let i = 0
  if (objct.manual[indx] === undefined) {
    while ((objct.manual[indx] === undefined) && (indx > 0)) {
      indx--
    }
  }
  lastLength = objct.manual[indx].lineTxts.length
  while (i < lastLength) {
    if ((objct.manual[indx].lineTxts[i] !== '') && (objct.manual[indx].lineTxts !== undefined)) {
      isEmpty = false
    }
    i++
  }
  if (isEmpty) {
    delete objct.manual[indx]
  }
  ipc.send('saveManual', objct.manual)
}

function getData () {
  clearInput()
  removeLines()
  setLines()
  toggleChkbx()
  show(getNumberOfLines())
  f()
  loadData()
  toggleIndent()
}

function loadData () {
  let i = 1
  while (i <= objct.manual[id].lines) {
    let txt = objct.manual[id].lineTxts[i - 1]
    document.getElementById('line_' + i).value = txt
    if (txt === '' || txt === ' ') {
      document.getElementById('line' + i).innerHTML = ' '
    } else {
      document.getElementById('line' + i).innerHTML = txt
    }
    i++
  }
  if (objct.manual[id].removeIndent) {
    document.getElementById('chkbx_removeIndent').checked = true
  }
}

function setLines () {
  let radioButtons = document.getElementsByName('numberOfLines')
  for (let i = 0, length = radioButtons.length; i < length; i++) {
    if (radioButtons[i].value === objct.manual[id].lines) {
      radioButtons[i].checked = true
    }
  }
}

function getNumberOfLines () {
  let numberOfLines = document.getElementsByName('numberOfLines')
  let numberOfLinesValue = 1
  for (let i = 0; i < numberOfLines.length; i++) {
    if (numberOfLines[i].checked) {
      numberOfLinesValue = numberOfLines[i].value
    }
  }
  return numberOfLinesValue
}

function toggleChkbx () {
  let chkbx = document.getElementById('chkbx_removeIndent')
  chkbx.disabled = false
  chkbx.checked = false
}

function saveCurrent () {
  let lineTxts = []
  let numberOfLinesValue = getNumberOfLines()
  let i = 0
  let oneLineTxt = ''
  let removeIndent = false
  if (document.getElementById('chkbx_removeIndent').checked) {
    removeIndent = true
  }
  while (i < (numberOfLinesValue)) {
    let k = i + 1
    lineTxts[i] = document.getElementById('line_' + k).value
    oneLineTxt += document.getElementById('line_' + k).value + ' '
    i++
  }
  objct.manual[id] = {
    'id': id,
    'size': document.getElementById('previewBox').className.split(' ')[0],
    'lines': numberOfLinesValue,
    'lineTxts': lineTxts,
    'oneLineTxt': oneLineTxt,
    'removeIndent': removeIndent
  }
}

function toggleIndent () {
  let chkbx = document.getElementById('chkbx_removeIndent')
  let previewClassList = document.getElementById('previewBox').classList
  if (Number(getNumberOfLines()) !== 1) {
    if (chkbx.checked) {
      previewClassList.remove('indent')
    } else {
      previewClassList.add('indent')
    }
  } else {
    if (chkbx.checked) {
      document.getElementById('line1').style.textAlign = 'left'
    } else {
      document.getElementById('line1').style.textAlign = 'center'
    }
  }
}

document.getElementById('btn_next').addEventListener('click', next)
document.getElementById('btn_previous').addEventListener('click', previous)
document.getElementById('btn_delete').addEventListener('click', deleteData)
document.getElementById('btn_deleteAndExit').addEventListener('click', deleteAndExit)
document.getElementById('btn_saveAndExit').addEventListener('click', saveAndExit)
document.getElementById('chkbx_removeIndent').addEventListener('change', toggleIndent)
