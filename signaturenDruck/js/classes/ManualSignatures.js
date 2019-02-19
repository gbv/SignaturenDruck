class ManualSignatures {
  get signatures () {
    return this._signatures
  }

  set signatures (value) {
    this._signatures = value
  }

  constructor () {
    this._signatures = []
  }

  checkManualSignatures () {
    return this._signatures.length > 0
  }
}

module.exports = ManualSignatures