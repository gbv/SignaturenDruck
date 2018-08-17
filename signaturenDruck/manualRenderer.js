(function () {
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
})()

// required for ipc calls to the main process
const ipc = require('electron').ipcRenderer

let objct = {
  manual: []
}

let id = 0

function f () {
  let radioButtons = document.getElementsByName('numberOfLines')
  for (let i = 0, length = radioButtons.length; i < length; i++) {
    if (radioButtons[i].checked) {
      showInputs(radioButtons[i].value)
      console.log(radioButtons[i].value)
      document.getElementById('previewBox').classList = ''
      if (radioButtons[i].value == 1) {
        console.log('small center')
        document.getElementById('previewBox').className = 'small center'
      } else if (radioButtons[i].value == 3) {
        console.log('small indent')
        document.getElementById('previewBox').className = 'small indent'
      } else {
        console.log('big indent')
        document.getElementById('previewBox').className = 'big indent'
      }
    }
  }
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
    }
    i++
  }
}

function removeLines () {
  let i = 1
  while (i <= 6) {
    if (document.getElementById('line' + i)) {
      document.getElementById('line' + i).outerHTML = ''
    }
    i++
  }
}

function next () {
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
    clearInput()
  }
}

function previous () {
  saveCurrent()
  if (id === 1) {
    document.getElementById('btn_previous').disabled = true
  }
  id--
  getData()
  console.log('prev', objct.manual)
}

function deleteData () {
  console.log('before', objct.manual)
  reset()
  changeOrder()
  console.log('after', objct.manual)

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
    }
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
  let lastLength = objct.manual[indx].lineTxts.length
  let isEmpty = true
  let i = 0
  while (i < lastLength) {
    if (objct.manual[indx].lineTxts[i] !== '') {
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
  show(getNumberOfLines())
  f()
  loadData()
}

function loadData () {
  let i = 1
  while (i <= objct.manual[id].lines) {
    let txt = objct.manual[id].lineTxts[i - 1]
    document.getElementById('line_' + i).value = txt
    document.getElementById('line' + i).innerHTML = txt
    i++
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

function saveCurrent () {
  let lineTxts = []
  let numberOfLinesValue = getNumberOfLines()
  let i = 0
  let oneLineTxt = ''
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
    'oneLineTxt': oneLineTxt
  }
}

document.getElementById('btn_next').addEventListener('click', next)
document.getElementById('btn_previous').addEventListener('click', previous)
document.getElementById('btn_delete').addEventListener('click', deleteData)
document.getElementById('btn_deleteAndExit').addEventListener('click', deleteAndExit)
document.getElementById('btn_saveAndExit').addEventListener('click', saveAndExit)
