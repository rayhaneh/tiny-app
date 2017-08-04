module.exports = function (urlDatabase,shortURL) {
  return urlDatabase[shortURL].visits.length
}