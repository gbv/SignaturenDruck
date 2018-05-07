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

window.onload = function () {
    preview([2,3,6]);
};

function changeStyle() {
    let newConfig = loadConfig();
    let shelfmark = document.getElementsByClassName("shelfmark");
    let width = newConfig.gross.label.width;
    let height = newConfig.gross.label.height;
    let unit = newConfig.einheit;
    for (let i = 0; i < shelfmark.length; i++) {
        shelfmark[i].style.width = "" + width + unit;
        shelfmark[i].style.height = "" + height + unit;
    }
}

function loadConfig() {
    return config.store;
}

function preview(id) {
    fs.readFile("signaturen.json", "utf8", function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
            let idCount = id.length;
            let idNr = 1;
            id.forEach(element => {
                let sig = "";
                _.forEach(JSON.parse(data), function(key, value){
                    let found = _.find(key, {"id": element});
                    if (found !== undefined) {
                        sig = found;
                    }
                });
                if (sig != "") {
                    let length = sig.txtLength;
                    let id = sig.id;
                    let i = 1;
                    let div = document.createElement("div");
                    let line = document.createElement("p");
                    // if (length > 3) {
                    //     console.log("added stuff");
                    // }
                    // let myNode = document.getElementById("previewBox");
                    // while (myNode.firstChild) {
                    //     myNode.removeChild(myNode.firstChild);
                    // }
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
                }
                if (idNr < idCount) {
                    let pdfPageBreak = document.createElement("div");
                    pdfPageBreak.className = "html2pdf__page-break";
                    document.getElementById("toPrint").appendChild(pdfPageBreak);
                }
                idNr++;
            });
        }
        createPDF();
    });
}

function createPDF() {
    let newConfig = config.store;
    var element = document.getElementById("toPrint");
    html2pdf(element, {
        margin:       1,
        filename:     "C://Export/myfile.pdf",
        image:        { type: "png", quality: 0.99 },
        html2canvas:  { dpi: 300, letterRendering: true },
        jsPDF:        { unit: newConfig.einheit, format: [newConfig.gross.label.width + 0.5, newConfig.gross.label.height + 0.5], orientation: "landscape" }
    });
}