module.exports = function(visits) {

  // An array of visitor ids
  let uniqueVisits = Object.keys(visits).length

  // Total number of visistors
  let totalVisits    = 0
  for (let visitor_id in visits) {
    totalVisits += visits[visitor_id].length
  }
  return {totalVisits: totalVisits, uniqueVisits: uniqueVisits}
}