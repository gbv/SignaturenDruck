// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the Signatur class
const Signatur = require("./signatur.js");

// requires lodash
const _ = require("lodash");

// requires the fs-module
const fs = require("fs");

// //requires jsPDF
// const jsPDF = require("jspdf");

const fileContents = document.getElementById("filecontents");

const Store = require("electron-store");
const store = new Store({cwd: "C:\\Export\\"});

window.onload = function () {
    document.getElementById("defaultPath").innerHTML = store.get("default");
    let fileSelected = document.getElementById("fileToRead");
    let fileTobeRead;
    if (fs.existsSync(store.get("default"))) {
        // fileTobeRead = fileSelected.files[0];
        fs.readFile(store.get("default"), "utf-8", (err, data) => {
            if (err) {
                alert("An error ocurred reading the file :" + err.message);
                return;
            }
            const allLines = data.split(/\r\n|\n/);
            writeToFile(allLines);
        });
    }

    //Check the support for the File API support
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        fileSelected.addEventListener("change", function () {
            fileTobeRead = fileSelected.files[0];
            var fileReader = new FileReader();
            fileReader.onload = function () {
                const file = event.target.result;
                const allLines = file.split(/\r\n|\n/);
                writeToFile(allLines);
            };
            fileReader.readAsText(fileTobeRead);
        }, false);
    }
    else {
        alert("Files are not supported");
    }
};

function writeToFile(allLines) {
    var obj = {
        all: []
    };
    var sig = new Signatur();
    var ppnAktuell = "";
    var id = 1;
    sig.id = id;
    // Reading line by line
    allLines.map((line) => {
        let first4 = firstFour(line);
        if (first4 == "0100") {
            sig.ppn = ppnAktuell = extractPPN(line);
            lineOutput("PPN: " + sig.ppn);
        } else if (first4 >= 7001 && first4 <= 7099) {
            sig.exNr = extractExNr(line);
            lineOutput("ExemplarNr: " + sig.exNr);
        } else if (first4 == 7100) {
            sig.txt = extractTxt(line);
            sig.txtLength = sig.txt.length;
            lineOutput("SignaturenText: " + sig.txt);
        } else if (first4 == 7901) {
            sig.date = extractDate(line);
            lineOutput("BearbeitetAm: " + sig.date);
        }
        if (sig.allSet()) {
            lineOutput("");
            obj.all.push(sig.Signatur);
            sig = new Signatur();
            id++;
            sig.id = id;
            sig.ppn = ppnAktuell;
        }
    });
    // write every Signatur to signaturen.json
    writeSignaturesToFile(JSON.stringify(getUnique(obj)));
}

// adds the line to the Outputwindow
function lineOutput(line) {
    fileContents.innerText += line + "\n";
}

// returns the first 4 chars
function firstFour(str) {
    return str.substring(0, 4);
}

//extracts the PPN
function extractPPN(str) {
    // regex definiert 2 gruppen
    let regex = /^(\d{4}\s\s*)(.*)(\s*)$/;

    // es wird mit hilfe des regex die PPN ausgelesen
    return str.replace(regex, "$2");
}

// extracts the exNr
function extractExNr(str) {
    // regex definiert 2 gruppen
    let regex = /^(\d{4})(.*)$/;

    // es wird mit hilfe des regex die ExemplarNr ausgelesen
    return str.replace(regex, "$1");
}

// extracts the signature text
function extractTxt(str) {
    // removes the first 4 numbers and following spaces
    let regex = /^(\d{4}\s\s*)(.*)(\s*)$/;
    str = str.replace(regex, "$2");

    // removes @ and everything that follows
    regex = /^(.[^@]*)(.*)$/;
    str = str.replace(regex, "$1");

    regex = /^((!\w*\s*\w*!\s*)*)(.*)(\s*)$/;
    str = str.replace(regex, "$3");

    str = str.split(":");

    // es wird mit hilfe des regex die Signatur ausgelesen
    return str;
}

// extracts the date
function extractDate(str) {
    // regex definiert 3 gruppen
    let regex = /^(\d{4}\s\s*)(\d{2}-\d{2}-\d{2})(.*)$/;

    // es wird mit hilfe des regex das BearbeitetAm Datum ausgelesen
    return str.replace(regex, "$2");
}

// removes duplicates
function getUnique(obj) {
    return _.map(
        _.uniq(
            _.map(obj.all, function(obj){
                return JSON.stringify(obj);
            })
        ), function(obj) {
            return JSON.parse(obj);
        }
    );
}

function groupByPPN(obj) {
    return _.groupBy(obj, "PPN");
}

// // function to test the PDF generation
// function testPDF() {
//     var doc = new jsPDF("l", "mm", [200, 200]);
//     doc.text("This is just a test", 5, 5);
//     doc.addPage(200, 100);
//     doc.text("This is a second page", 5, 5);
//     doc.save("test.pdf");
// }

function writeSignaturesToFile(json) {
    json = JSON.stringify(groupByPPN(JSON.parse(json)));
    fs.writeFile("signaturen.json", json, "utf8", function (err){
        if (err){
            throw err;
        } else {
            console.log("signaturen.json wurde erstellt");
        }
    });
}

