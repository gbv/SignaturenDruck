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
const _ = require('lodash')

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
      swal.fire('Achtung', 'Die Datei <b>' + config.get('defaultDownloadPath') + '</b> ist nicht vorhanden.', 'info')
    }
  } else {
    document.getElementById('dnl').style.display = 'none'
    document.getElementById('sru').style.display = 'flex'
    if (config.get('SRU.printImmediately')) {
      document.getElementById('chkbx_printImmediately').checked = true
    }
    if (!config.get('SRU.QueryPart1EPN')) {
      document.getElementById('select_dataMode').disabled = true
      swal.fire('Achtung', 'In der config.json fehlt der Eintrag: <b>SRU.QueryPart1EPN</b>\n\ndaher wurde die Suche via EPN deaktiviert.', 'info')
    }
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
    swal.fire('Erfolg!', 'Es wurden alle Signaturen gedruckt.', 'success')
  }
})

ipcRenderer.on('couldNotDelete', function (event, path) {
  swal.fire('Achtung', 'PDFs konnten nicht automatisch gelöscht werden!<br/>Die PDFs liegen unter:<br/><strong>' + path + '</strong>', 'info')
})

// function to send objMan to the manual window
function openManualSignaturesWindow (edit = false) {
  (table.manualSignature.length === 0) ? table.manualSignature = [] : null
  ipcRenderer.send('openManualSignaturesWindow', table.manualSignature, edit)
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
ipcRenderer.on('addSRUdata', function (event, xml, barcode, mode) {
  let data = new ShelfmarksFromSRUData()
  let shelfmark = data.getShelfmark(xml, barcode, mode)
  if (shelfmark.error !== '') {
    swal.fire('Achtung', shelfmark.error, 'error')
      .then(() => {})
  } else {
    if (shelfmark.PPN) {
      let index = objSRU.all.length
      objSRU.all[index] = shelfmark
      objSRU.all[index].id = index + 1
      table.readSRUData(objSRU.all)
      if (document.getElementById('chkbx_printImmediately').checked) {
        let node = document.getElementById('print_' + (index + 1))
        node.click()
        printButton(event, true)
      }
      table.clearManualSignaturesTable()
      if (table.manualSignature !== undefined && table.manualSignature !== null && table.manualSignature.length !== 0) {
        table.addManualSignaturesToTable(table.manualSignature)
      }
    } else {
      swal.fire('Achtung', 'Signatur mit ' + mode + ': ' + barcode + ' wurde nicht gefunden.', 'info')
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
        swal.fire('Achtung', 'Die Datei wurde gelöscht.', 'info')
      }
    })
  }
}

// invokes to close the app via ipc
function closeButton () {
  ipcRenderer.send('close')
}

// gathers the data to print and invokes printing via ipc
function printButton (event, printImmediately = false) {
  if (printImmediately) {
    ipcRenderer.send('print', getPrintData(), printImmediately)
  } else {
    if (isSomethingToPrint()) {
      swal.fire('Bitte warten', 'Die Signaturen werden gedruckt.', 'info')
      ipcRenderer.send('print', getPrintData())
    } else {
      swal.fire('Nichts zu drucken', 'Es wurde keine Signatur ausgewählt!', 'info')
    }
  }
}

// returns true if there is something to print
function isSomethingToPrint () {
  let elems = document.querySelectorAll('[name=toPrint]')
  let somethingToPrint = false
  _.forEach(elems, function (elem) {
    if (elem.checked) {
      somethingToPrint = true
    }
  })
  return somethingToPrint
}

// returns printData
function getPrintData () {
  return new P(sigJSONFile, table.formats, table.manualSignature).dataAll
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
  ipcRenderer.send('loadFromSRU', document.getElementById('input_barcode').value, document.getElementById('select_dataMode').value)
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

function changePlaceholder () {
  let selectValue = document.getElementById('select_dataMode').value
  let input = document.getElementById('input_barcode')
  if (selectValue === 'PPN') {
    input.placeholder = 'Barcode'
  } else {
    input.placeholder = 'EPN'
  }
}

// adds eventlistener to the PPN / EPN select
document.getElementById('select_dataMode').addEventListener('change', changePlaceholder)
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
