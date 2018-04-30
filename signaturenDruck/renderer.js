// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// requires the Signatur class
const Signatur = require("./signatur.js");

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
                        sig.ppn = line;
                        ppnAktuell = line;
                        line = "PPN: " + line;
                        lineOutput(line);
                    } else if (first4 >= 7001 && first4 <= 7099) {
                        sig.exNr = line;
                        line = "ExemplarNr: " + line;
                        lineOutput(line);
                    } else if (first4 == 7100) {
                        sig.txt = line;
                        line = "SignaturText: " + line;
                        lineOutput(line);
                    } else if (first4 == 7901) {
                        sig.date = line;
                        line = "BearbeitetAm: " + line;
                        lineOutput(line);
                    }
                    if (sig.allSet()) {
                        // console.log(JSON.stringify(sig.Signatur));
                        obj.all.push(JSON.stringify(sig.Signatur));
                        sig = new Signatur();
                        sig.ppn = ppnAktuell;
                    }
                });
                var json = JSON.stringify(obj);
                fs.writeFile("signaturen.json", json, "utf8", function (err){
                    if (err){
                        throw err;
                    } else {
                        console.log("signaturen.json wurde erstellt");
                    }
                });
            };
            fileReader.readAsText(fileTobeRead);
        }, false);
        fs.readFile("signaturen.json", "utf8", function readFileCallback(err, data){
            if (err){
                console.log(err);
            } else {
                console.log(data);
                console.log("-----");
                console.log(JSON.parse(data));
            }
        });
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