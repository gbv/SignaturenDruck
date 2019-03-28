const _ = require('lodash')
const moment = require('moment')

class FormatLinesByMode {
  /*
 ----- Class getter and setter -----
   */

  /*
  ----- End Class getter and setter -----
   */

  /*
  ----- Constructor -----
   */

  /*
  ----- End Constructor -----
   */

  static formatLines (location, lines, linesOrdered, formatLines = '') {
    let data = []
    if (formatLines !== '') {
      for (let j = 0; j < formatLines; j++) {
        data[j] = ''
      }
    }
    let i = 0
    _.each(linesOrdered, function (value) {
      let regex1 = new RegExp(/\$\d{1,3}/)
      let regex2 = new RegExp(/\$LOC/)
      let regex3 = new RegExp(/\$DATE/)
      while (regex1.test(value)) {
        let matches = value.match(regex1)
        _.each(matches, function (match) {
          let group = match.split('$')[1]
          if (lines[group - 1] !== undefined) {
            value = value.replace(match, lines[group - 1])
          } else {
            value = value.replace(match, '')
          }
        })
      }
      if (regex2.test(value)) {
        value = value.replace('$LOC', location)
      }
      if (regex3.test(value)) {
        value = value.replace('$DATE', moment().format('DD.MM.YYYY'))
      }
      data[i] = value
      i++
    })
    return data
  }
}

module.exports = FormatLinesByMode
