// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the fs-module
const fs = require('fs')

// requires the lodash-module
const _ = require('lodash')

// required for ipc calls to the main process
const ipc = require('electron').ipcRenderer


window.onload = function () {}

function close () {
  ipc.send('closeConfigWindow')
}

// adds event listener to the close button
document.getElementById('btn_close').addEventListener('click', close)
