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

const Store = require("electron-store");
const store = new Store({cwd: "C:\\Export\\"});

const dataExtract = require("./dataExtract.js");

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
            let fileReader = new FileReader();
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
    let obj = {
        all: []
    };
    let sig = new Signatur();
    let extract = new dataExtract;
    let ppnAktuell = "";
    let id = 1;
    sig.id = id;
    // Reading line by line
    allLines.map((line) => {
        let first4 = extract.firstFour(line);
        if (first4 == "0100") {
            sig.ppn = ppnAktuell = extract.ppn(line);
        } else if (first4 >= 7001 && first4 <= 7099) {
            sig.exNr = extract.exNr(line);
        } else if (first4 == 7100) {
            let txt = extract.txt(line);
            let big = labelSize(txt);
            if (big === false) {
                sig.bigLabel = false;
            }
            txt = txt.split(":");
            sig.txt = txt;
            sig.txtLength = sig.txt.length;
        } else if (first4 == 7901) {
            sig.date = extract.date(line);
        }
        if (sig.allSet()) {
            obj.all.push(sig.Signatur);
            console.log(sig.Signatur);
            sig = new Signatur();
            id++;
            sig.id = id;
            sig.ppn = ppnAktuell;
        }
    });
    // write every Signatur to signaturen.json
    writeSignaturesToFile(JSON.stringify(getUnique(obj)));
}

function labelSize(txt) {
    let numberOfSeperators = getCountOfSeparators(txt, ":");
    let numberOfWhitespaces = getCountOfSeparators(txt, " ");
    if ((numberOfSeperators >= 2) && (numberOfSeperators > numberOfWhitespaces)) {
        return true;
    } else {
        return false;
    }
}

function getCountOfSeparators(txt, separator) {
    return txt.split(separator).length;
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

function displayData() {
    fs.readFile("signaturen.json", "utf8", function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
            createOutput(JSON.parse(data));
            console.log("signaturen.json wurde gelesen");
        }
    });
}
function createOutput(obj) {
    var table = document.getElementById("signaturTable");
    var i = 1;
    _.forEach(obj, function(key, value){
        var row = table.insertRow(i);
        var ppnRow = row.insertCell(0);
        ppnRow.innerHTML = value;
        ppnRow.className = "ppnLine";
        _.forEach(key, function(objct){
            i++;
            row = table.insertRow(i);
            // row.onclick = function() { preview(objct.id); };
            var txtCell = row.insertCell(0);
            txtCell.onclick = function() { preview(objct.id); };
            var dateCell = row.insertCell(1);
            dateCell.onclick = function() { preview(objct.id); };
            var exnrCell = row.insertCell(2);
            exnrCell.onclick = function() { preview(objct.id); };
            var shortSigCell = row.insertCell(3);
            var printSigCell = row.insertCell(4);
            var printCount = row.insertCell(5);
            _.forEach(objct.txt, function(value){
                txtCell.innerHTML += value + " ";
            });
            dateCell.innerHTML = objct.date;
            exnrCell.innerHTML = objct.exNr;
            let input;
            if (!objct.bigLabel) {
                input = document.createElement("input");
                input.id = "short_" + objct.id;
                input.type = "checkbox";
                input.name = "shortShelfmark";
                input.value = objct.id;
                shortSigCell.appendChild(input);
            }
            input = document.createElement("input");
            input.id = "print_" + objct.id;
            input.type = "checkbox";
            input.name = "toPrint";
            input.value = objct.id;
            printSigCell.appendChild(input);
            input = document.createElement("input");
            input.id = "count_" + objct.id;
            input.type = "number";
            input.max = 99;
            input.min = 1;
            input.name = "printCount";
            input.value = 1;
            printCount.appendChild(input);
        });
        i++;
    });
}

document.getElementById("btn_loadData").addEventListener("click", displayData);
