
module.exports = function (shelfmark) {
  let txt = shelfmark
  let shelfmarkArray = []
  const indxSlash = txt.indexOf('/')
  const indxColon = txt.indexOf(':')
  let i = 0
  shelfmarkArray[0] = txt
  if (indxSlash !== -1) {
    setSigTxt0and1(indxSlash, txt)
    i = 1
  }
  if (indxColon !== -1) {
    if (i === 0) {
      setSigTxt0and1(indxColon, txt)
    } else {
      let i = 0
      const txt = []
      const length = shelfmarkArray.length
      shelfmarkArray.forEach(element => {
        const indx = element.indexOf(':')
        if (indx !== -1) {
          let j = 0
          while (j < i) {
            txt[j] = shelfmarkArray[j]
            j++
          }
          let k = i
          txt[k] = element.substring(0, indx)
          k++
          txt[k] = element.substring(indx)
          k++
          while (k <= length) {
            txt[k] = shelfmarkArray[k - 1]
            k++
          }
          shelfmarkArray = txt
        }
        i++
      })
    }
  }
  i = 0
  txt = []
  const length = shelfmarkArray.length
  shelfmarkArray.forEach(element => {
    const elementParts = element.split(' ')
    if (elementParts.length >= 3) {
      let j = 0
      while (j < i) {
        txt[j] = shelfmarkArray[j]
        j++
      }
      let k = i
      txt[k] = elementParts[0] + ' ' + elementParts[1]
      k++
      txt[k] = element.substring(txt[k - 1].length)
      k++
      while (k <= length) {
        txt[k] = shelfmarkArray[k - 1]
        k++
      }
      shelfmarkArray = txt
    }
    i++
  })
  return shelfmarkArray

  function setSigTxt0and1 (indx, txt) {
    shelfmarkArray[0] = txt.substring(0, indx + 1)
    shelfmarkArray[1] = txt.substring(indx + 1)
  }
}
