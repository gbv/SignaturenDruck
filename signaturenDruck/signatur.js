class Signatur {
    constructor() {
        this._ppn = "";
        this._exNr = "";
        this._txt = "";
        this._txtLength = "";
        this._date = "";
        this._id = "";
        this._bigLabel = true;
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
    set txtLength(str) {
        this._txtLength = str;
    }
    set date(str) {
        this._date = str;
    }
    set id(int) {
        this._id = int;
    }
    set bigLabel(bool) {
        this._bigLabel = bool;
    }

    // Getter
    get ppn() {
        return this._ppn;
    }
    get exNr() {
        return this._exNr;
    }
    get txt() {
        return this._txt;
    }
    get txtLength() {
        return this._txtLength;
    }
    get date() {
        return this._date;
    }
    get id() {
        return this._id;
    }
    get bigLabel() {
        return this._bigLabel;
    }
    get Signatur() {
        return {"PPN": this._ppn, "id": this._id, "bigLabel": this._bigLabel, "txt": this._txt, "txtLength": this._txtLength, "date": this._date, "exNr": this._exNr};
    }

    // Method
    allSet() {
        if ((this._ppn != "") && (this._exNr != "") && (this._txt != "") && (this._date != "") && (this._txtLength != "")){
            return true;
        } else {
            return false;
        }
    }

}

module.exports = Signatur;