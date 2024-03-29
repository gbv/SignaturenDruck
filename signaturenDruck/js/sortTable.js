function sortTable (n) {
  const table = document.getElementById('signaturTable')
  let rows, i, x, y
  let switching = true
  let shouldSwitch = false
  let dir = 'asc'
  let switchCount = 0
  // Set the sorting direction to ascending:
  /* Make a loop that will continue until
    no switching has been done: */
  while (switching) {
    // start by saying: no switching is done:
    switching = false
    rows = table.getElementsByTagName('TR')
    /* Loop through all table rows (except the
        first, which contains table headers): */
    for (i = 1; i < (rows.length - 1); i++) {
      // start by saying there should be no switching:
      shouldSwitch = false
      /* Get the two elements you want to compare,
            one from current row and one from the next: */
      x = rows[i].getElementsByTagName('TD')[n]
      y = rows[i + 1].getElementsByTagName('TD')[n]
      /* check if the two rows should switch place,
            based on the direction, asc or desc: */
      if (dir === 'asc') {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          // if so, mark as a switch and break the loop:
          shouldSwitch = true
          break
        }
      } else if (dir === 'desc') {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          // if so, mark as a switch and break the loop:
          shouldSwitch = true
          break
        }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
            and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i])
      switching = true
      // Each time a switch is done, increase this count by 1:
      switchCount++
    } else {
      /* If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again. */
      if (switchCount === 0 && dir === 'asc') {
        dir = 'desc'
        switching = true
      }
    }
  }
}
