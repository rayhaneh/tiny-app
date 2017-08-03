module.exports = function urlsForUser(id,urlDatabase) {
  let userURLs = {}
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url]
    }
  }
  return userURLs
}