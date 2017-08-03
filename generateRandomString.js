module.exports = function generateRandomString(length,database) {
  let randomString  = ""
  const possible      = "abcdefghijklmnopqrstuvwxyz0123456789"
  do {
    for(var i = 0; i < length; i++) {
      randomString += possible.charAt(Math.floor(Math.random() * possible.length))
    }
  } while (database[randomString])
  return randomString
}