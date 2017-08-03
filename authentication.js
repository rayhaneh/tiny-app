module.exports = (req, res, next) => {

  const currentUser = req.session.user_id
  const byPath = ["/login", "/register"]

  if (req.path.substring(0,3) === '/u/') {
    next()
    return
  }
  else {
    if (!currentUser) {
      if (byPath.indexOf(req.path) === -1) res.redirect("/login")
      next()
      return
    }
    else {
      req.currentUser = currentUser
      if (byPath.indexOf(req.path) !== -1) {
        res.redirect("/urls")
        return
      }
      next()
      return
    }
  }
}