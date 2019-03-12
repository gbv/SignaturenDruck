class dataExtractOld {
  // returns the first 4 chars
  firstFour (str) {
    return str.substring(0, 4)
  }

  // extracts the PPN
  ppn (str) {
    // regex defines 2 groups
    let regex = /^(\d{4}\s\s*)(.*)(\s*)$/

    // returns the second regex group
    return str.replace(regex, '$2')
  }

  // extracts the exNr
  exNr (str) {
    // regex defines 2 groups
    let regex = /^(\d{4})(.*)$/

    // returns the  first regex group
    return str.replace(regex, '$1')
  }

  // extracts the signature text
  txt (str) {
    // removes the first 4 numbers and following spaces
    let regex = /^(\d{4}\s\s*)(.*)(\s*)$/
    str = str.replace(regex, '$2')

    // removes @ and everything that follows
    regex = /^(.[^@]*)(.*)$/
    str = str.replace(regex, '$1')

    // removes leading and following whitespaces
    str = str.trim()

    let foundAt = str.indexOf('/')
    if (foundAt !== -1) {
      let controlIndex = str.indexOf('!')
      if ((controlIndex !== -1) && (controlIndex > foundAt)) {
        str = str.substr(foundAt + 1)
      }
    }

    foundAt = str.indexOf('#')
    if (foundAt !== -1) {
      str = str.substr(foundAt + 1)
    }

    if (str.startsWith('$')) {
      foundAt = str.indexOf('$', 1)
      if (foundAt !== -1) {
        str = str.substr(foundAt + 1)
      }
    }

    if (str.startsWith('!')) {
      foundAt = str.indexOf('!', 1)
      if (foundAt !== -1) {
        str = str.substr(foundAt + 1)
      }
    }

    return str
  }

  // extracts the date
  date (str) {
    // regex defines 3 groups
    let regex = /^(\d{4}\s\s*)(\d{2}-\d{2}-\d{2})(.*)$/

    // returns the second regex group
    return str.replace(regex, '$2')
  }

  // extracts the location
  location (str) {
    // group 2 is the location
    let regex = /^(.[^!]*)!(.[^!]*)(.*)$/
    return str.replace(regex, '$2').trim()
  }

  // extracts the loanIndication
  loanInd (str) {
    // group 2 is the loanIndication
    let regex = /^(.[^@]*)@(.*)$/
    return str.replace(regex, '$2').trim()
  }
}

module.exports = dataExtractOld
