module.exports = {
  locDoesMatch: function (regEx, loc) {
    const regex = new RegExp(regEx)
    if (loc.match(regex)) {
      return true
    } else {
      return false
    }
  }

}
