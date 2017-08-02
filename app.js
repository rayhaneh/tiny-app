// This file holds the express server setup
const express = require("express")
const app = express()
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser")
const expressSanitizer    = require("express-sanitizer")

const PORT = process.env.PORT || 8080 // default port 8080

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()) // should always go after the bodyparser
app.use(cookieParser())


// Database
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

// ROOT ROUTE
app.get("/", (req, res) => {
  res.redirect("/urls")
})

//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase)
})

// INDEX ROUTE
app.post("/urls", (req, res) => {
  let longURL = req.sanitize(req.body.longURL);
  shortURL = generateRandomString()
  urlDatabase[shortURL] = longURL
  res.redirect(`/urls/${shortURL}`);
})

// NEW ROUTE
app.get("/urls/new", (req, res) => {
  let templateVars = {
      username: req.cookies["username"]
  };
  res.render("urls_new",templateVars);
})

// CREATE ROUTE
app.get("/urls", (req, res) => {
  let templateVars = {
      urls: urlDatabase,
      username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
})

// SHOW ROUTE and EDIT ROUTE (Shouldn't the edit route be /urls/:id/edit?)
app.get("/urls/:id", (req, res) => {
  let templateVars = {
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id],
        username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
})

// UPDATE ROUTE (Shouldn't the HTTP VERB be PUT?)
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    delete urlDatabase[req.params.id]
    urlDatabase[generateRandomString()] = req.body.longURL
  }
  res.redirect("/urls");
})

// DESTROY ROUTE (Shouldn't the route be /urls/:id and the verb delete?)
app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls")
})

// REDIRECTION ROUTE
app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id
  let longURL = urlDatabase[shortURL]
  res.redirect(longURL)
})

// USER LOGIN ROUTE
app.post("/login", (req, res) => {
  res.cookie("username",req.body.username)
  res.redirect("/urls")
})

// USER LOGOUT ROUTE
app.post("/logout", (req, res) => {
  res.clearCookie("username",req.body.username)
  res.redirect("/urls")
})


function generateRandomString() {
  const length    = 6
  let   shortURL  = ""
  const possible  = "abcdefghijklmnopqrstuvwxyz0123456789"
  do {
    for(var i = 0; i < length; i++) {
      shortURL += possible.charAt(Math.floor(Math.random() * possible.length))
    }
  } while (urlDatabase[shortURL])
  return shortURL
}

// APP LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})