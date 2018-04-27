class Signatur {
    constructor() {
        this.PPN = '';
        this.exNr = '';
        this.txt = '';
        this.date = '';
    }

    // Setter
    set PPN(ppn) {
        this.PPN = ppn;
    }
    set exNr(exNr) {
        this.exNr = exNr;
    }
    set txt(txt) {
        this.txt = txt;
    }
    set date(date) {
        this.date = date;
    }

    // Getter
    get Signatur() {
        return {"PPN": this.PPN, "exNr": this.exNr, "txt": this.txt, "date": this.date};
    }

    // Method
    allSet() {
        if (this.PPN != '' && this.exNr != '' && this.txt != '' && this.date != ''){
            return true;
        } else {
            return false;
        }
    }
}