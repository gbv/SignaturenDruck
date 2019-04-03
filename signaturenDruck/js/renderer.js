// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the fs-module
const fs = require('fs')

// required for ipc calls to the main process
const { ipcRenderer, remote } = require('electron')

const config = remote.getGlobal('config')
const sigJSONFile = remote.getGlobal('sigJSONFile')

const swal = require('sweetalert2')

const T = require('./classes/Table')
const P = require('./classes/Print')
const ShelfmarksFromSRUData = require('./classes/ShelfmarksFromSRUData')

let objSRU = {
  all: []
}

let displayModalOnSuccess = true
let table = new T(sigJSONFile)

// function on window load
window.onload = function () {
  if (config.get('devMode')) {
    document.getElementById('devMode').style.display = 'block'
  }

  document.getElementById('modalTxt').innerHTML = config.get('modal.modalTxt')
  let fileSelected = document.getElementById('fileToRead')
  if (config.get('SRU.useSRU') === false) {
    if (fs.existsSync(config.get('defaultDownloadPath'))) {
      table.readDownloadFile(config.get('defaultDownloadPath'))
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
      table.readDownloadFile(fileSelected.files[0].path)
      document.getElementById('defaultPath').innerHTML = fileSelected.files[0].path
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

// function to send objMan to the manual window
function openManualSignaturesWindow () {
  (table.manualSignature.length === 0) ? table.manualSignature = [] : null
  ipcRenderer.send('openManualSignaturesWindow', table.manualSignature)
}

// ipc listener to add new manual data to the table
ipcRenderer.on('addManualSignatures', function (event, data) {
  table.clearManualSignaturesTable()
  if (data !== undefined && data !== null && data.length !== 0) {
    table.manualSignature = data
    table.addManualSignaturesToTable(data)
  }
})

// ipc listener to remove the manual data
ipcRenderer.on('removeManualSignatures', function (event) {
  clearManualShelfmarks()
})

// ipc listener to add provided data to the SRU obj
ipcRenderer.on('addSRUdata', function (event, xml, barcode) {
  let data = new ShelfmarksFromSRUData()
  let shelfmark = data.getShelfmark(xml, barcode)
  if (shelfmark.error !== '') {
    swal.fire('Achtung', shelfmark.error, 'error')
      .then(() => {})
  } else {
    let index = objSRU.all.length
    objSRU.all[index] = shelfmark
    objSRU.all[index].id = index + 1
    table.readSRUData(objSRU.all)
    if (document.getElementById('chkbx_printImmediatly').checked) {
      let node = document.getElementById('print_' + (index + 1))
      node.click()
      printButton()
    }
    table.clearManualSignaturesTable()
    if (table.manualSignature !== undefined && table.manualSignature !== null && table.manualSignature.length !== 0) {
      table.addManualSignaturesToTable(table.manualSignature)
    }
  }
})

// refresh table by given file
function refreshDownloadFile () {
  table.refreshDownloadFile()
}

function clearManualShelfmarks () {
  table.manualSignature = []
  table.clearManualSignaturesTable()
}

// clear written local signature - json file
function clearDownloadFileTable () {
  objSRU.all = []
  clearManualShelfmarks()
  table.clearDownloadFile()
}

// TODO Refactor
// remove download file
function deleteFile () {
  if (document.getElementById('fileToRead').files[0]) {
    deleteFromPath(document.getElementById('fileToRead').files[0].path)
  } else {
    deleteFromPath(config.get('defaultDownloadPath'))
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
  const print = new P(sigJSONFile, table.formats, table.manualSignature)
  ipcRenderer.send('print', print.dataAll)
}

// function to invert the print-selection
function invertPrintingSelection () {
  let elems = document.querySelectorAll('[name=toPrint]')
  for (let i = 0; i < elems.length; i++) {
    elems[i].checked = !elems[i].checked
  }
}

// function to invert the short-selection
function invertShortSelection () {
  let elems = document.querySelectorAll('[name=shortShelfmark]')
  for (let i = 0; i < elems.length; i++) {
    elems[i].click()
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
      document.getElementById('print_' + elemValue).checked = date === pickedDateFormated
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
document.getElementById('btn_deleteList').addEventListener('click', clearDownloadFileTable)
// adds event listener to the deleteFile button
document.getElementById('btn_deleteFile').addEventListener('click', deleteFile)
// adds event listener to the print button
document.getElementById('btn_print').addEventListener('click', printButton)
// adds event listener to the close button
document.getElementById('btn_close').addEventListener('click', closeButton)
// adds event listener to the refresh button
document.getElementById('btn_refresh').addEventListener('click', refreshDownloadFile)
// adds event listener to the short column
document.getElementById('columnShort').addEventListener('click', invertShortSelection)
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
