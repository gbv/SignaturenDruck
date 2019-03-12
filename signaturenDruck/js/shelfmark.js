class shelfmark {
  constructor () {
    this._ppn = ''
    this._exNr = ''
    this._txt = ''
    this._txtLength = ''
    this._date = ''
    this._id = ''
    this._bigLabel = true
    this._txtOneLine = ''
    this._error = ''
    this._location = ''
    this._loanIndication = ''
  }

  // Setter
  set ppn (str) {
    this._ppn = str
  }
  set exNr (str) {
    this._exNr = str
  }
  set txt (str) {
    this._txt = str
  }
  set txtLength (str) {
    this._txtLength = str
  }
  set date (str) {
    this._date = str
  }
  set id (int) {
    this._id = int
  }
  set bigLabel (bool) {
    this._bigLabel = bool
  }
  set txtOneLine (str) {
    this._txtOneLine = str
  }
  set error (str) {
    this._error = str
  }
  set location (str) {
    this._location = str
  }
  set loanIndication (str) {
    this._loanIndication = str
  }

  // Getter
  get ppn () {
    return this._ppn
  }
  get exNr () {
    return this._exNr
  }
  get txt () {
    return this._txt
  }
  get txtLength () {
    return this._txtLength
  }
  get date () {
    return this._date
  }
  get id () {
    return this._id
  }
  get bigLabel () {
    return this._bigLabel
  }
  get txtOneLine () {
    return this._txtOneLine
  }
  get error () {
    return this._error
  }
  get location () {
    return this._location
  }
  get loanIndication () {
    return this._loanIndication
  }
  get shelfmark () {
    return {
      'PPN': this._ppn,
      'id': this._id,
      'bigLabel': this._bigLabel,
      'txtOneLine': this._txtOneLine,
      'txt': this._txt,
      'txtLength': this._txtLength,
      'date': this._date,
      'exNr': this._exNr,
      'location': this._location,
      'loanInd': this._loanIndication,
      'error': this._error
    }
  }

  // Method
  allSet () {
    return (this._ppn !== '') && (this._exNr !== '') && (this._txt !== '') && (this._date !== '') && (this._txtLength !== '')
  }
}

module.exports = shelfmark
