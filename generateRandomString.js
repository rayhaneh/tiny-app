// This function generate a random string
// Used to generate:
//    - user ids (8 characters),
//    - url ids (6 characters),
//    - visitor ids (4 characters)

// To Generate a unique id:
// the function checks if the generated id exists in the database
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