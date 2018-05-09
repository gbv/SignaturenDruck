// This file is required by the print.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// to create the pdf
const html2pdf = require("html2pdf.js");

// to work with files
const fs = require("fs");

// requires lodash
const _ = require("lodash");

// to access the local config file
const store = require("electron-store");
const config = new store({cwd: "C:\\Export\\"});

const username = require("username");

// required for ipc calls to the main process
const ipc = require("electron").ipcRenderer;

window.onload = function () {
    ipc.on("toPrint", function(event, data){
        console.log("on printRenderer", event, data);
        createPage(data);
        createBigPDF();
        createSmallPDF();
    });
};

function changeStyle() {
    let newConfig = loadConfig();
    let shelfmark = document.getElementsByClassName("shelfmark");
    let width = newConfig.big.label.width;
    let height = newConfig.big.label.height;
    let unit = newConfig.einheit;
    for (let i = 0; i < shelfmark.length; i++) {
        shelfmark[i].style.width = "" + width + unit;
        shelfmark[i].style.height = "" + height + unit;
    }
}

function loadConfig() {
    return config.store;
}

function createPage(ids) {
    let file = fs.readFileSync("signaturen.json", "utf8");
    console.log("ids: ", ids);
    addUsername();
    addDate();
    // needs to sum up all the counts per id
    let countAll = 0;
    let idNr = 1;
    _.forEach((ids), function(value){
        if (value.count >= 1 && value.count <= 99) {
            countAll += Number(value.count);
        } else {
            countAll += 1;
        }
        
    });
    console.log(countAll);
    _.forEach(ids, function(value){
        console.log("value: ", value);
        let objct = value;
        _.forEach(JSON.parse(file), function(key, value){
            let sig = "";
            let found = _.find(key, {"id": Number(objct.id)});
            if (found !== undefined) {
                sig = found;
            }
            if (sig != "") {
                for (let count = 0; count < objct.count; count++) {
                    let length = sig.txtLength;
                    let id = sig.id;
                    let i = 1;
                    let div = document.createElement("div");
                    let line = document.createElement("p");
                    div.className = "shelfmark";
                    div.id = id;
                    sig.txt.forEach(element => {
                        line.className = "shelfmarkLine_" + i;
                        if (element == "") {
                            let emptyLine = document.createElement("br");
                            line.appendChild(emptyLine);
                        } else {
                            line.innerHTML = element;
                        }
                        div.appendChild(line);
                        line = document.createElement("p");
                        i++;
                    });
                    document.getElementById("toPrint").appendChild(div);
                    console.log("idNr: ", idNr, "countAll: ", countAll);
                    if (idNr < countAll) {
                        let pdfPageBreak = document.createElement("div");
                        pdfPageBreak.className = "html2pdf__page-break";
                        document.getElementById("toPrint").appendChild(pdfPageBreak);
                        idNr++;
                    }
                }
            }
        });
    });
}

function addUsername() {
    document.getElementById("currentUsername").innerHTML = username.sync();
}

function addDate() {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth()+1;
    let yyyy = today.getFullYear();

    if(dd<10) {
        dd = "0"+dd;
    } 

    if(mm<10) {
        mm = "0"+mm;
    } 

    today = dd + "." + mm + "." + yyyy;
    document.getElementById("currentDate").innerHTML = today;
}

function createBigPDF() {
    let newConfig = config.store;
    var element = document.getElementById("toPrint");
    html2pdf(element, {
        margin:       1,
        filename:     "C://Export/myfile.pdf",
        image:        { type: "png", quality: 1 },
        html2canvas:  { dpi: 300, letterRendering: true },
        jsPDF:        { unit: newConfig.einheit, format: [newConfig.big.label.width + 0.5, newConfig.big.label.height + 0.5], orientation: "landscape" }
    });
}

function createSmallPDF() {
    let newConfig = config.store;
    var element = document.getElementById("toPrint");
    html2pdf(element, {
        margin:       1,
        filename:     "C://Export/myfile.pdf",
        image:        { type: "png", quality: 1 },
        html2canvas:  { dpi: 300, letterRendering: true },
        jsPDF:        { unit: newConfig.einheit, format: [newConfig.small.label.width + 0.5, newConfig.small.label.height + 0.5], orientation: "landscape" }
    });
}