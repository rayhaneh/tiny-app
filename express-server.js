// NODE PACKAGES
const express               = require("express")
const app                   = express()
const cookieSession         = require('cookie-session')
const bodyParser            = require("body-parser")
const bcrypt                = require('bcrypt')
const PORT                  = process.env.PORT || 8080
app.set('view engine', 'ejs')


// MY MODULES
const generateRandomString  = require("./generateRandomString")
const urlsForUser           = require("./urlsForUser")


// Middlewares
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieSession({
  name: 'session',
  keys: ['abcdefghijklmnopqrstuvwxyz0123456789']
}))
app.use(express.static("public"))

app.use((req, res, next) => {
  const currentUser = req.session.user_id
  req.currentUser   = currentUser
  next()
})


// Database
const urlDatabase = require("./urlDatabase.json")
const users       = require("./users.json")


// ROOT ROUTE
app.get("/", (req, res) => {
  if (req.currentUser) {
    res.redirect("/urls")
  }
  else {
    res.redirect("/login")
  }

})


// INDEX ROUTE
app.get("/urls", (req, res) => {
  if (req.currentUser) {
    const templateVars = {
      user : users[req.currentUser],
      urls: urlsForUser(req.currentUser,urlDatabase)
    }
    res.render("urls_index", templateVars)
  }
  else {
    let error = "You should login to visit this page."
    res.render("error",{user: "", error: error})
  }
})


// NEW ROUTE
app.get("/urls/new", (req, res) => {
  if (req.currentUser) {
    res.render("urls_new",{user : users[req.currentUser]})
  }
  else{
    res.redirect("/login")
  }
})


// SHOW ROUTE and EDIT ROUTE (Shouldn't the edit route be /urls/:id/edit?)
app.get("/urls/:id", (req, res) => {
  if (req.currentUser){
    let shortURL = req.params.id

    if (!urlDatabase[shortURL]) {
      res.status(404)
      let error = "The ShortURL does not exist."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    else if (req.currentUser !== urlDatabase[shortURL].userID) {
      let error = "This short URL does not belong to you."
      res.status(404)
      res.render("error", {user: users[req.currentUser], error: error})
    }
    else {
      let templateVars = {
            shortURL: shortURL,
            longURL : urlDatabase[req.params.id].longURL,
            user    : users[req.currentUser]
      }
      res.render("urls_show", templateVars)
    }
  }
  else {
    const error = "You should login to visit this page."
    res.render("error", {user: "", error: error})
  }
})

// REDIRECTION ROUTE
app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id
  if (!urlDatabase[shortURL]) {
    res.status(404)
    let error = 'The short URL you are looking for does not exist.'
    res.render("error", {user: users[req.currentUser], error: error})
  }
  else {
    let longURL  = urlDatabase[shortURL].longURL
    res.redirect(longURL)
  }
})


// CREATE ROUTE
app.post("/urls", (req, res) => {
  if (req.currentUser) {
    let longURL  = req.body.longURL
    if (!longURL) {
      const error = "Please enter a URL."
      res.render("error", {user: "", error: error})
    }
    else {
      let shortURL = generateRandomString(6,urlDatabase)
      urlDatabase[shortURL] = {
        longURL: longURL,
        userID: req.currentUser
      }
      res.redirect(`/urls/${shortURL}`)
    }
  }
  else {
    const error = "You should login to visit this page."
    res.render("error", {user: "", error: error})
  }
})


// UPDATE ROUTE
app.post("/urls/:id", (req, res) => {
  if (req.currentUser){
    let shortURL = req.params.id

    if (!urlDatabase[shortURL]) {
      res.status(404)
      let error = "The ShortURL does not exist."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    else if (req.currentUser !== urlDatabase[shortURL].userID) {
      res.status(404)
      let error = "You are not the owner of this short URL."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    else if (!req.body.longURL) {
      let error = "Please enter a URL."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    else {
      urlDatabase[shortURL].longURL = req.body.longURL
      res.redirect("/urls")
    }
  }
  else {
    const error = "You should login to visit this page."
    res.render("error", {user: "", error: error})
  }
})


// DESTROY ROUTE (Shouldn't the route be /urls/:id and the verb delete?)
app.post("/urls/:id/delete", (req,res) => {
  if (req.currentUser){
    let shortURL = req.params.id
    if (!urlDatabase[shortURL]) {
      res.status(404)
      let error = "The ShortURL does not exist."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    else if (req.currentUser !== urlDatabase[shortURL].userID){
      res.status(404)
      let error = "You are not the owner of this short URL."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    else {
      delete urlDatabase[shortURL]
      res.redirect("/urls")
    }
  }
  else {
    const error = "You should login to visit this page."
    res.render("error", {user: "", error: error})
  }
})


// USER LOGIN ROUTE
app.get("/login", (req, res) => {
  if (!req.currentUser) {
    res.render("login", {user: ""})
  }
  else {
    res.redirect("/urls")
  }
})


// USER REGISTRATION ROUTE
app.get("/register", (req, res) => {
  if (!req.currentUser) {
    let templateVars = {
          user : users[req.currentUser]
    }
    res.render("register", templateVars)
  }
  else {
    res.redirect("/urls")
  }
})


app.post("/login", (req, res) => {
  let id
  let pass = false
  if (!req.body.email || !req.body.password) {
    res.status(403)
    let error = "The email or password fields is empty."
    return res.render("error", {user: users[req.currentUser], error: error})
  }
  Object.keys(users).forEach(function(key) {
    if (users[key].email === req.body.email) {
      id = key
      if (bcrypt.compareSync(req.body.password,users[key].password)) {
        pass = true
      }
    }
  })
  if (!id){
    res.status(403)
    let error = "User does not exist."
    res.render("error", {user: users[req.currentUser], error: error})
  } else if (!pass) {
    res.status(403)
    let error = "Password is not correct."
    res.render("error", {user: users[req.currentUser], error: error})
  } else {
    req.session.user_id = id
    res.redirect("/urls")
  }
})

// USER POST REGISTER ROUTE
app.post("/register", (req, res) => {
  let emailExists = false
  Object.keys(users).forEach(function(key) {
      if (users[key].email === req.body.email) {
        return  emailExists = true
      }
  })

  if (!req.body.email || !req.body.password) {
    res.status(400)
    let error = "The email or password fields is empty."
    res.render("error", {user: users[req.currentUser], error: error})
  } else if (emailExists){
    res.status(400)
    let error = "This email address is already registred."
    res.render("error", {user: users[req.currentUser], error: error})
  } else {
    let id = generateRandomString(8,users)
    users[id] = {
        id : id,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password,10)
      }
    req.session.user_id = id
    res.redirect("/urls")
  }
})

// USER LOGOUT ROUTE
app.post("/logout", (req, res) => {
  let id
  Object.keys(users).forEach(function(key) {
      if (users[key].email === req.body.email) {
        id = key
      }
  })
  req.session = null
  res.redirect("/login")
})


app.get("*", (req, res) => {
  res.status(404)
  if (req.currentUser) {
    let error = "The page you are looking for doesn't exist."
    res.render("error", {user: users[req.currentUser], error: error})
  }
  else {
    let error = "The page you are looking for doesn't exist."
    res.render("error", {user: "", error: error})
  }
})




// APP LISTENER
app.listen(PORT, () => {
  console.log(`TinyApp is listening on port ${PORT}!`)
})