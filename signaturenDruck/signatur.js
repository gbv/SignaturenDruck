class Signatur {
    constructor() {
        this._ppn = "";
        this._exNr = "";
        this._txt = "";
        this._date = "";
    }

    // Setter
    set ppn(str) {
        this._ppn = str;
    }
    set exNr(str) {
        this._exNr = str;
    }
    set txt(str) {
        this._txt = str;
    }
    set date(str) {
        this._date = str;
    }

    // Getter
    get Signatur() {
        return {"PPN": this._ppn, "exNr": this._exNr, "txt": this._txt, "date": this._date};
    }

    // Method
    allSet() {
        if (this._ppn != "" && this._exNr != "" && this._txt != "" && this._date != ""){
            return true;
        } else {
            return false;
        }
    }
}

module.exports = Signatur;