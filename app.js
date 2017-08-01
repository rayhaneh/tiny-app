// This file holds the express server setup
const express = require("express")
const app = express()

const PORT = process.env.PORT || 8080 // default port 8080
const bodyParser = require("body-parser");
const expressSanitizer    = require("express-sanitizer");

app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()); // should go after the bodyparser

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
  res.render("urls_new");
})

app.post("/urls", (req, res) => {
  let longURL = req.sanitize(req.body.longURL);
  shortURL = generateRandomString()
  urlDatabase[shortURL] = longURL
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)

})

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id]
  console.log(urlDatabase)
  res.redirect("/urls")
})

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
})

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id]  };
  res.render("urls_show", templateVars);
})
app.post("/urls/:id", (req, res) => {
  console.log(urlDatabase)
  if (urlDatabase[req.params.id]) {
    delete urlDatabase[req.params.id]
    urlDatabase[generateRandomString()] = req.body.longURL
  }
  res.redirect("/urls");
  console.log(urlDatabase)
})

app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id
  let longURL = urlDatabase[shortURL]
  res.redirect(longURL)
})


function generateRandomString() {
  const length    = 6
  let   shortURL  = ""
  const possible  = "abcdefghijklmnopqrstuvwxyz0123456789"
  do {
    for(var i = 0; i < length; i++) {
      shortURL += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return shortURL
  } while (!urlDatabase[shortURL])
}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})