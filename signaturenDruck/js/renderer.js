// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires lodash
const _ = require('lodash')

// requires the fs-module
const fs = require('fs')

// required for ipc calls to the main process
const {ipcRenderer, remote} = require('electron')

const config = remote.getGlobal('config')
const sigJSONFile = remote.getGlobal('sigJSONFile')

const getLabelSize = require('./getLabelSize.js')

const preview = require('./preview')

let objMan = null
let objSRU = {
  all: []
}

let displayModalOnSuccess = true
let previewSwitch = new preview(sigJSONFile, objMan)

// function on window load
window.onload = function () {

  preview.addStyleFiles()
  previewSwitch.loadFormats()
  previewSwitch.checkPrinters()

  if (config.get('devMode')) {
    document.getElementById('devMode').style.display = 'block'
  }

  document.getElementById('modalTxt').innerHTML = config.get('modal.modalTxt')
  let fileSelected = document.getElementById('fileToRead')
  let fileTobeRead
  if (config.get('SRU.useSRU') === false) {
    if (fs.existsSync(config.get('defaultDownloadPath'))) {
      let file = fs.readFileSync(config.get('defaultDownloadPath'), 'utf-8')
      previewSwitch.writeToFile(file)
      previewSwitch.displayData()
      document.getElementById('defaultPath').innerHTML = config.get('defaultDownloadPath')
    } else {
      document.getElementById('defaultPath').innerHTML = 'nicht vorhanden'
      alert('Die Datei ' + config.get('defaultDownloadPath') + ' ist nicht vorhanden.')
    }
  } else {
    document.getElementById('dnl').style.display = 'none'
    document.getElementById('sru').style.display = 'flex'
  }

  // Check the support for the File API support
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    fileSelected.addEventListener('change', function () {
      objMan = null
      fileTobeRead = fileSelected.files[0].path
      document.getElementById('defaultPath').innerHTML = fileTobeRead
      let file = fs.readFileSync(fileTobeRead, 'utf-8')
      previewSwitch.writeToFile(file)
      previewSwitch.displayData()
    }, false)
  } else {
    alert('Files are not supported')
  }
}

// listens on printMsg, invokes the modal
ipcRenderer.on('printMsg', function (event, successfull) {
  if (successfull && displayModalOnSuccess) {
    document.getElementById('myModal').style.display = 'block'
  } else {
    document.getElementById('myModal').style.display = 'none'
    displayModalOnSuccess = false
  }
})

// ipc listener to add new manual data to the table
ipcRenderer.on('addManualSignatures', function (event, data) {
  objMan = data
  deleteOldManualSignatures()
  if (objMan !== undefined && objMan !== null && objMan.length !== 0) {
    previewSwitch.addToTable(objMan)
  }
})

// ipc listener to remove the manual data
ipcRenderer.on('removeManualSignatures', function (event) {
  objMan = null
  deleteOldManualSignatures()
})

// ipc listener to add provided data to the SRU obj
ipcRenderer.on('addSRUdata', function (event, data) {
  if (data.error !== '') {
    alert(data.error)
  } else {
    let indx = objSRU.all.length
    objSRU.all[indx] = data
    objSRU.all[indx].id = indx + 1
    objSRU.all[indx].bigLabel = getLabelSize(data.plainTxt)
    previewSwitch.writeFile(JSON.stringify(objSRU.all))
    preview.clearTable()
    previewSwitch.createTable(objSRU.all)
  }
})

function refresh () {
  previewSwitch.refresh()
}

//TODO Add to preview class
// clears the display table
function deleteList () {
  if (fs.existsSync(sigJSONFile)) {
    fs.unlink(sigJSONFile, function (err) {
      if (err) {
        throw err
      } else {
        let myNode = document.getElementById('shelfmarkTableBody')
        while (myNode.firstChild) {
          myNode.removeChild(myNode.firstChild)
        }
        objMan = null
        objSRU = {
          all: []
        }
        previewSwitch.removeOld()
        alert('Die Liste wurde gelöscht.')
      }
    })
  } else {
    let myNode = document.getElementById('shelfmarkTableBody')
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild)
    }
    previewSwitch.removeOld()
    objMan = null
    objSRU = {
      all: []
    }
    alert('Die Liste wurde gelöscht.')
  }
}

// deletes the shelfmark source file
function deleteFile () {
  if (document.getElementById('fileToRead').files[0]) {
    deleteFromPath(document.getElementById('fileToRead').files[0].path)
  } else {
    deleteFromPath(config.store.defaultPath)
  }
}

// deletes provided file
function deleteFromPath (path) {
  if (fs.existsSync(path)) {
    fs.unlink(path, function (err) {
      if (err) {
        throw err
      } else {
        alert('Die Datei wurde gelöscht.')
      }
    })
  }
}

// invokes to close the app via ipc
function closeButton () {
  ipcRenderer.send('close')
}

// gathers the data to print and invokes printing via ipc
function printButton () {
  let dataAll = {
    all: []
  }

  let elems = document.querySelectorAll('[name=toPrint]')
  for (let i = 0; i < elems.length; i++) {
    if (elems[i].checked) {
      let data = {
        'manual': false,
        'id': '',
        'count': '1',
        'removeIndent': false,
        'format': '',
        'isShort': false
      }
      dataAll.all.push(setData(data, i))
    }
  }
  ipcRenderer.send('print', _.groupBy(dataAll.all, 'format'), objMan)

  function setData (data, i) {
    setIdAndManual()
    setFormat()
    setCount()
    checkIfShort()

    return data

    function checkIfShort () {
      let shortCkbx = document.getElementById('short_' + data.id)
      if (shortCkbx) {
        if (shortCkbx.checked) {
          data.isShort = true
        }
      }
    }
    function setCount () {
      let count = document.getElementById('count_' + data.id).value
      if ((count <= 99) && (count >= 1)) {
        data.count = count
      } else if (count > 99) {
        data.count = 99
      } else if (count < 1) {
        data.count = 1
      }
    }
    function setFormat () {
      data.format = document.getElementById('templateSelect_' + data.id).value
    }
    function setIdAndManual () {
      if (elems[i].id.includes('print_m_')) {
        data.id = elems[i].id.split('print_')[1]
        data.manual = true
      } else {
        data.id = elems[i].value
      }
    }
  }
}

// funtion to delete all manual entries
function deleteOldManualSignatures () {
  let elements = document.getElementsByClassName('manual')
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0])
  }
}


// function to send objMan to the manual window
function openManualSignaturesWindow () {
  ipcRenderer.send('openManualSignaturesWindow', objMan)
}

// function to invert the print-selection
function invertPrintingSelection () {
  let elems = document.querySelectorAll('[name=toPrint]')
  for (let i = 0; i < elems.length; i++) {
    elems[i].checked = !elems[i].checked;
  }
}

// function to select shelfmarks per date
function selectByDate () {
  let datepicker = document.getElementById('datepicker')
  let pickedDate = datepicker.value
  if (pickedDate !== '') {
    let pickedDateFormated = pickedDate.replace(/(\d{2})(\d{2})-(\d{2})-(\d{2})/, '$4-$3-$2')
    let elems = document.querySelectorAll('[name=toPrint]')
    for (let i = 0; i < elems.length; i++) {
      let elemValue = elems[i].value
      let date = document.getElementById('dateCell_' + elemValue).innerHTML
      document.getElementById('print_' + elemValue).checked = date === pickedDateFormated;
    }
  }
}


// function to submit the barcode
function submitBarcode () {
  ipcRenderer.send('loadFromSRU', document.getElementById('input_barcode').value)
  document.getElementById('input_barcode').value = ''
}

// function to send with enter
function sendWithEnter (event) {
  if (event.keyCode === 13) {
    document.getElementById('btn_barcode').click()
  }
}

function openConfigWindow (event) {
  if (event.altKey && event.ctrlKey && event.keyCode === 67) {
    ipcRenderer.send('openConfigWindow')
  }
}

function openEditorWindow (event) {
  if (event.altKey && event.ctrlKey && event.keyCode === 69) {
    ipcRenderer.send('openEditorWindow')
  }
}

// adds event listener to the create manually button
document.getElementById('btn_createManualSignatures').addEventListener('click', openManualSignaturesWindow)
// adds event listener to the deleteList button
document.getElementById('btn_deleteList').addEventListener('click', deleteList)
// adds event listener to the deleteFile button
document.getElementById('btn_deleteFile').addEventListener('click', deleteFile)
// adds event listener to the print button
document.getElementById('btn_print').addEventListener('click', printButton)
// adds event listener to the close button
document.getElementById('btn_close').addEventListener('click', closeButton)
// adds event listener to the refresh button
document.getElementById('btn_refresh').addEventListener('click', refresh)
// adds event listener to the print column
document.getElementById('columnPrint').addEventListener('click', invertPrintingSelection)
// adds event listener to the datepicker
document.getElementById('datepicker').addEventListener('change', selectByDate)
// adds event listener to the barcode button
document.getElementById('btn_barcode').addEventListener('click', submitBarcode)
// adds event listener to the barcode input
document.getElementById('input_barcode').addEventListener('keyup', sendWithEnter)
// adds event listener to the window to open config window
document.addEventListener('keydown', openConfigWindow)
document.addEventListener('keydown', openEditorWindow)
