class dataExtractK10plus {
  // returns the first 4 chars
  firstFour (str) {
    return str.substring(0, 4)
  }

  // extracts the PPN
  ppn (str) {
    // regex defines 2 groups
    const regex = /^(\d{4}\s\s*)(.*)(\s*)$/

    // returns the second regex group
    return str.replace(regex, '$2')
  }

  // extracts the exNr
  exNr (str) {
    // the string is something like E001, so we only need char 1-3
    return str.substring(1, 4)
  }

  // extracts the signature text
  txt (str) {
    // group $1 - everything till $a ($a included)
    // group $2 - everything till $ ($excluded), that's what we are after, the shelfmarktxt
    // group $3 - everything else
    const regex = /^(\d{4}\s.*\$a)(.[^$]*)(.*)$/
    str = str.replace(regex, '$2')
    // removes leading and following whitespaces
    str = str.trim()

    return str
  }

  // extracts the date
  date (str) {
    // regex defines 3 groups
    const regex = /^(\d{4}\s\s*)(\d{2}-\d{2}-\d{2})(.*)$/

    // returns the second regex group
    return str.replace(regex, '$2')
  }

  // extracts the location
  location (str) {
    // group 2 is the location
    const regex = /^(.*\$f)(.[^$]*)(.*)$/
    return str.replace(regex, '$2').trim()
  }

  // extracts the loanIndication
  loanIndication (str) {
    // group 2 is the loanIndication
    const regex = /^(.*\$d)(.[^$]*)(.*)$/
    return str.replace(regex, '$2').trim()
  }
}

module.exports = dataExtractK10plus
