class shelfmark {
  constructor () {
    this._ppn = ''
    this._exNr = ''
    this._date = ''
    this._id = ''
    this._txtOneLine = ''
    this._error = ''
    this._location = ''
    this._loanIndication = ''
    this._defaultSubMode = ''
    this._subModes = []
  }

  // Setter
  set ppn (str) {
    this._ppn = str
  }

  set exNr (str) {
    this._exNr = str
  }

  set date (str) {
    this._date = str
  }

  set id (int) {
    this._id = int
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

  set defaultSubMode (str) {
    this._defaultSubMode = str
  }

  set subModes (object) {
    this._subModes.push(object)
  }

  // Getter
  get ppn () {
    return this._ppn
  }

  get exNr () {
    return this._exNr
  }

  get date () {
    return this._date
  }

  get id () {
    return this._id
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

  get defaultSubMode () {
    return this._defaultSubMode
  }

  get subModes () {
    return this._subModes
  }

  get shelfmark () {
    return {
      PPN: this._ppn,
      id: this._id,
      bigLabel: this._bigLabel,
      txtOneLine: this._txtOneLine,
      date: this._date,
      exNr: this._exNr,
      location: this._location,
      loanIndication: this._loanIndication,
      error: this._error,
      defaultSubMode: this._defaultSubMode,
      modes: this._subModes
    }
  }

  // Method
  allSet () {
    return (this._ppn !== '') && (this._exNr !== '') && (this._subModes[0] !== undefined) && (this._date !== '') && (this._txtLength !== '')
  }
}

module.exports = shelfmark
