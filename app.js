// This file holds the express server setup
const express = require("express")
const app = express()
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser")
const expressSanitizer    = require("express-sanitizer")
const uuidv4 = require('uuid/v4');

const PORT = process.env.PORT || 8080 // default port 8080

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()) // should always go after the bodyparser
app.use(cookieParser())


// Database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

const users = {
  "b957e91f-13c5-47be-bcee-850052d2de14": {
    id: "b957e91f-13c5-47be-bcee-850052d2de14",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "87981921-7669-49ef-9591-50463212301c": {
    id: "87981921-7669-49ef-9591-50463212301c",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
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
  shortURL = generateRandomString(6)
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
  // So what if two users add the same link??
  if (urlDatabase[req.params.id]) {
    delete urlDatabase[req.params.id]
    urlDatabase[generateRandomString(6)] = req.body.longURL
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

// USER REGISTRATION ROUTE
app.get("/register", (req, res) => {
  let templateVars = {
        username: req.cookies["username"]
  };
  res.render("register", templateVars)
})

app.post("/register", (req, res) => {
  console.log()
  if (!req.body.email || !req.body.password){
    res.status(400).send('Something broke!');
  } else {
    let id = uuidv4();
    users[id] = {
        id : uuidv4(),
        email: req.body.email,
        password: req.body.password
      }
    res.cookie("username",req.body.email)
    res.redirect("/urls")
  }
})


function generateRandomString(length) {
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