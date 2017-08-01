// This file holds the express server setup
const express = require("express")
const app = express()
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser")
const expressSanitizer    = require("express-sanitizer")

const PORT = process.env.PORT || 8080 // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()) // should always go after the bodyparser
app.use(cookieParser())


app.set('view engine', 'ejs')


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

app.get("/", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n")
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase)
})

app.get("/urls/new", (req, res) => {
  let templateVars = {
      username: req.cookies["username"]
  };
  res.render("urls_new",templateVars);
})

app.post("/urls", (req, res) => {
  let longURL = req.sanitize(req.body.longURL);
  shortURL = generateRandomString()
  urlDatabase[shortURL] = longURL
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)

})

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls")
})

app.get("/urls", (req, res) => {
  let templateVars = {
      urls: urlDatabase,
      username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
})

app.get("/urls/:id", (req, res) => {

  let templateVars = {
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id],
        username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
})
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    delete urlDatabase[req.params.id]
    urlDatabase[generateRandomString()] = req.body.longURL
  }
  res.redirect("/urls");
})

app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id
  let longURL = urlDatabase[shortURL]
  res.redirect(longURL)
})

app.post("/login", (req, res) => {
  res.cookie("username",req.body.username)
  res.redirect("/urls")
})
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


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})