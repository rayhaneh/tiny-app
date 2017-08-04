module.exports = function(visits) {
  let uniqueVisits = []
  let totalVisits    = 0
  for (let visitor_id in visits) {
    totalVisits += visits[visitor_id].length
    if (!uniqueVisits.includes(visitor_id)){
      uniqueVisits.push(visitor_id)
    }
  }
  return {totalVisits: totalVisits, uniqueVisits: uniqueVisits.length}
}