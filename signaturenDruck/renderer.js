// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the Signatur class
const Signatur = require("./signatur.js");

// requires lodash
const _ = require("lodash");

// requires the fs-module
const fs = require("fs");

// loading config
const config = require("../config.json");
var fileContents = document.getElementById("filecontents");

window.onload = function () {
    //Check the support for the File API support
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var fileSelected = document.getElementById("fileToRead");
        fileSelected.addEventListener("change", function () {
            var fileTobeRead = fileSelected.files[0];
            alert(config.testKey);
            var obj = {
                all: []
            };
            var fileReader = new FileReader();
            fileReader.onload = function () {
                // var fileContents = document.getElementById('filecontents');
                // fileContents.innerText = fileReader.result;
                const file = event.target.result;
                const allLines = file.split(/\r\n|\n/);
                var sig = new Signatur();
                var ppnAktuell = "";
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
                        lineOutput("SignaturenText: " + sig.txt);
                    } else if (first4 == 7901) {
                        sig.date = extractDate(line);
                        lineOutput("BearbeitetAm: " + sig.date);
                    }
                    if (sig.allSet()) {
                        lineOutput("");
                        // _.forEach(sig.Signatur, function(value, key){
                        //     console.log(key + " -> " + value);
                        // });
                        obj.all.push(sig.Signatur);
                        sig = new Signatur();
                        sig.ppn = ppnAktuell;
                    }
                });
                // write every Signatur to signaturen.json
                var json = JSON.stringify(obj);
                fs.writeFile("signaturen.json", json, "utf8", function (err){
                    if (err){
                        throw err;
                    } else {
                        console.log("signaturen.json wurde erstellt");
                    }
                });
                // read from signaturen.json
                fs.readFile("signaturen.json", "utf8", function readFileCallback(err, data){
                    if (err){
                        console.log(err);
                    } else {
                        var obj = JSON.parse(data);
                        // lodash sortBy
                        // console.log(_.sortBy(obj.all, ["PPN"]));

                        // lodash removes duplicates
                        var uniqObjcts = _.map(
                            _.uniq(
                                _.map(obj.all, function(obj){
                                    return JSON.stringify(obj);
                                })
                            ), function(obj) {
                                return JSON.parse(obj);
                            }
                        );
                        console.log(uniqObjcts);

                        output(uniqObjcts);
                    }
                });
            };
            fileReader.readAsText(fileTobeRead);
        }, false);
    }
    else {
        alert("Files are not supported");
    }
};

function lineOutput(line) {
    fileContents.innerText += line + "\n";
}

function firstFour(str) {
    return str.substring(0, 4);
}

function extractPPN(str) {
    // regex definiert 2 gruppen
    let regex = /^(\d{4}\s\s*)(.*)(\s*)$/;

    // es wird mit hilfe des regex die PPN ausgelesen
    return str.replace(regex, "$2");
}

function extractExNr(str) {
    // regex definiert 2 gruppen
    let regex = /^(\d{4})(.*)$/;

    // es wird mit hilfe des regex die ExemplarNr ausgelesen
    return str.replace(regex, "$1");
}

function extractTxt(str) {
    // removes the first 4 numbers and following spaces
    let regex = /^(\d{4}\s\s*)(.*)(\s*)$/;
    str = str.replace(regex, "$2");

    // removes @ and everything that follows
    regex = /^(.[^@]*)(.*)$/;
    str = str.replace(regex, "$1");

    regex = /^((!\w*\s*\w*!\s*)*)(.*)(\s*)$/;
    str = str.replace(regex, "$3");

    // es wird mit hilfe des regex die Signatur ausgelesen
    return str;
}

function extractDate(str) {
    // regex definiert 3 gruppen
    let regex = /^(\d{4}\s\s*)(\d{2}-\d{2}-\d{2})(.*)$/;

    // es wird mit hilfe des regex das BearbeitetAm Datum ausgelesen
    return str.replace(regex, "$2");
}

function output(obj) {
    var table = document.getElementById("signaturTable");
    var i = 1;
    _.forEach(obj, function(objct){
        // _.forEach(objct, function(value, key){
        //     // console.log(key + " => " + value);
        //     // table.insertRow(i).insertCell(0).innerHTML = value;
        // });
        var row = table.insertRow(i);
        var ppnCell = row.insertCell(0);
        var txtCell = row.insertCell(1);
        var dateCell = row.insertCell(2);
        var exnrCell = row.insertCell(3);
        ppnCell.innerHTML = objct.PPN;
        txtCell.innerHTML = objct.txt;
        dateCell.innerHTML = objct.date;
        exnrCell.innerHTML = objct.exNr;
        i++;
    });
}