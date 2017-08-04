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


// USER AUTHENTICATION
app.use((req, res, next) => {
  const currentUser = req.session.user_id
  req.currentUser   = currentUser
  next()
})


// DATABASE
const urlDatabase = require("./urlDatabase.json")
const users       = require("./users.json")


// ROOT ROUTE
app.get("/", (req, res) => {
  // If logged in, redirect to /urls
  if (req.currentUser) {
    res.redirect("/urls")
  }
  // else reditect to /login
  else {
    res.redirect("/login")
  }
})


// INDEX ROUTE
app.get("/urls", (req, res) => {
  // If logged in, show all the user's URLs
  if (req.currentUser) {
    const templateVars = {
      user : users[req.currentUser],
      urls: urlsForUser(req.currentUser,urlDatabase)
    }
    res.render("urls_index", templateVars)
  }
  // else show an error message
  else {
    let error = "You should login to visit this page."
    res.render("error",{user: "", error: error})
  }
})


// CREATE ROUTE
app.get("/urls/new", (req, res) => {
  // If logged in, go to the create a new tiny URL page
  if (req.currentUser) {
    res.render("urls_new",{user : users[req.currentUser]})
  }
  // else redirect to login page
  else{
    res.redirect("/login")
  }
})


// SHOW ROUTE and EDIT ROUTE
app.get("/urls/:id", (req, res) => {
  // If logged in ...
  if (req.currentUser){
    let shortURL = req.params.id
    // ... check if the short URL is in the database
    if (!urlDatabase[shortURL]) {
      res.status(404)
      let error = "The ShortURL does not exist."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    // ... check if the user is the owner of the short URL
    else if (req.currentUser !== urlDatabase[shortURL].userID) {
      let error = "This short URL does not belong to you."
      res.status(404)
      res.render("error", {user: users[req.currentUser], error: error})
    }
    // ... update the record in the database
    else {
      let templateVars = {
            shortURL: shortURL,
            longURL : urlDatabase[req.params.id].longURL,
            user    : users[req.currentUser]
      }
      res.render("urls_show", templateVars)
    }
  }
  // else show an error message
  else {
    const error = "You should login to visit this page."
    res.render("error", {user: "", error: error})
  }
})

// REDIRECTION ROUTE
app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id
  // If the short URL is not in the database show an error message
  if (!urlDatabase[shortURL]) {
    res.status(404)
    let error = 'The short URL you are looking for does not exist.'
    res.render("error", {user: users[req.currentUser], error: error})
  }
  // else redirect to the corresponding long URL
  else {
    let longURL  = urlDatabase[shortURL].longURL
    console.log()
    if ((longURL.substring(0,7) !== "http://") && (longURL.substring(0,7) !== "https://")) {
      longURL = `http://${longURL}`
    }
    res.redirect(longURL)
  }
})


// CREATE ROUTE
app.post("/urls", (req, res) => {
  // If logged in ...
  if (req.currentUser) {
    let longURL  = req.body.longURL
    // ... check if the URL field is empty
    if (!longURL) {
      const error = "Please enter a URL."
      res.render("error", {user: "", error: error})
    }
    // ... update the record
    else {
      let shortURL = generateRandomString(6,urlDatabase)
      urlDatabase[shortURL] = {
        longURL: longURL,
        userID: req.currentUser
      }
      res.redirect(`/urls/${shortURL}`)
    }
  }
  // else show an error message
  else {
    const error = "You should login to visit this page."
    res.render("error", {user: "", error: error})
  }
})


// UPDATE ROUTE
app.post("/urls/:id", (req, res) => {
  // If logged in ...
  if (req.currentUser){
    let shortURL = req.params.id
    // ... check if the short URL is in the database
    if (!urlDatabase[shortURL]) {
      res.status(404)
      let error = "The ShortURL does not exist."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    // ... check if user is the owner of the short URL
    else if (req.currentUser !== urlDatabase[shortURL].userID) {
      res.status(404)
      let error = "You are not the owner of this short URL."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    // ... check if the long URL field is empty
    else if (!req.body.longURL) {
      let error = "Please enter a URL."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    // ... update the record
    else {
      urlDatabase[shortURL].longURL = req.body.longURL
      res.redirect("/urls")
    }
  }
  // else show an error message
  else {
    const error = "You should login to visit this page."
    res.render("error", {user: "", error: error})
  }
})


// DESTROY ROUTE
app.post("/urls/:id/delete", (req,res) => {
  // If logged in ...
  if (req.currentUser){
    let shortURL = req.params.id
    // ... check if the short URL is in the database
    if (!urlDatabase[shortURL]) {
      res.status(404)
      let error = "The ShortURL does not exist."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    // ... check if current user is the owner
    else if (req.currentUser !== urlDatabase[shortURL].userID){
      res.status(404)
      let error = "You are not the owner of this short URL."
      res.render("error", {user: users[req.currentUser], error: error})
    }
    // ... remove the record from the database
    else {
      delete urlDatabase[shortURL]
      res.redirect("/urls")
    }
  }
  // else show an error message
  else {
    const error = "You should login to visit this page."
    res.render("error", {user: "", error: error})
  }
})


// USER LOGIN ROUTE
app.get("/login", (req, res) => {
  // If not login, render login form
  if (!req.currentUser) {
    res.render("login", {user: ""})
  }
  // else redirect to /urls
  else {
    res.redirect("/urls")
  }
})


// USER REGISTRATION ROUTE
app.get("/register", (req, res) => {
  // If not logged in render the registration page
  if (!req.currentUser) {
    let templateVars = {
          user : users[req.currentUser]
    }
    res.render("register", templateVars)
  }
  // else redirect to /urls
  else {
    res.redirect("/urls")
  }
})


app.post("/login", (req, res) => {
  let id
  let pass = false
  // If email or password field is empty show an error message
  if (!req.body.email || !req.body.password) {
    res.status(403)
    let error = "The email or password fields is empty."
    return res.render("error", {user: users[req.currentUser], error: error})
  }
  // Find the user in database and check if the password is valid
  Object.keys(users).forEach(function(key) {
    if (users[key].email === req.body.email) {
      id = key
      if (bcrypt.compareSync(req.body.password,users[key].password)) {
        pass = true
      }
    }
  })
  // If the user is not is the database show a message
  if (!id){
    res.status(403)
    let error = "User does not exist."
    res.render("error", {user: users[req.currentUser], error: error})
  }
  // if password is not correct show a message
  else if (!pass) {
    res.status(403)
    let error = "Password is not correct."
    res.render("error", {user: users[req.currentUser], error: error})
  }
  // else set cookie and log user in
  else {
    req.session.user_id = id
    res.redirect("/urls")
  }
})

// USER POST REGISTER ROUTE
app.post("/register", (req, res) => {
  let emailExists = false
  // Check if the email is already in the database
  Object.keys(users).forEach(function(key) {
      if (users[key].email === req.body.email) {
        return  emailExists = true
      }
  })
  // If email or password field is empty show a error message
  if (!req.body.email || !req.body.password) {
    res.status(400)
    let error = "The email or password fields is empty."
    res.render("error", {user: users[req.currentUser], error: error})
  }
  // Show an error message if the email is already in database
  else if (emailExists){
    res.status(400)
    let error = "This email address is already registred."
    res.render("error", {user: users[req.currentUser], error: error})
  }
  // Add user to database, set cookie and redirect to /urls
  else {
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
  // Find the user in the database
  Object.keys(users).forEach(function(key) {
      if (users[key].email === req.body.email) {
        id = key
      }
  })
  // Clear the cookie and redirect to login page
  req.session = null
  res.redirect("/login")
})

// ALL OTHER ROUTES
app.get("*", (req, res) => {
  // Show an error message for all other routes
  res.status(404)
  if (req.currentUser) {
    let error = "The page you are looking for doesn't exist."
    // Include user's info if logged in
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


