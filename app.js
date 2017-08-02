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
  let user_id = req.cookies["user_id"]
  res.render("urls_new",{user : users[user_id]});
})

// CREATE ROUTE
app.get("/urls", (req, res) => {
  let user_id = req.cookies["user_id"]
  res.render("urls_index", {user : users[user_id], urls: urlDatabase});
})

// SHOW ROUTE and EDIT ROUTE (Shouldn't the edit route be /urls/:id/edit?)
app.get("/urls/:id", (req, res) => {
  let user_id = req.cookies["user_id"]
  let templateVars = {
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id],
        user : users[user_id]
  };
  res.render("urls_show", templateVars);
})

// UPDATE ROUTE (Shouldn't the HTTP VERB be PUT?)
app.post("/urls/:id", (req, res) => {
  // So what if two users add the same link??
  urlDatabase[req.params.id] = req.body.longURL

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
app.get("/login", (req, res) => {
  let user_id = req.cookies["user_id"]
  res.render("login", {user : users[user_id]})
})

app.post("/login", (req, res) => {
  let id
  let pass = false
  if (!req.body.email || !req.body.password) {
    return res.status(403).send('the email or password fields are empty');
  }
  Object.keys(users).forEach(function(key) {
    if (users[key].email === req.body.email) {
      id = key
      if (users[key].password === req.body.password) {
        pass = true
      }
    }
  });
  if (!id){
    res.status(403).send('User does not exist');
  } else if (!pass) {
    res.status(403).send('Password is not correct');
  } else {
    res.cookie("user_id",id)
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
  });
  res.clearCookie("user_id",id)
  res.redirect("/urls")
})

// USER REGISTRATION ROUTE
app.get("/register", (req, res) => {
  let user_id = req.cookies["user_id"]
  let templateVars = {
        user : users[user_id]
  };
  res.render("register", templateVars)
})

app.post("/register", (req, res) => {
  let emailExists = false
  Object.keys(users).forEach(function(key) {
      if (users[key].email === req.body.email) {
        return  emailExists = true
      }
  });

  if (!req.body.email || !req.body.password || emailExists){
    res.status(400).send('Something broke!');
  } else {
    let id = uuidv4();
    users[id] = {
        id : uuidv4(),
        email: req.body.email,
        password: req.body.password
      }
    res.cookie("user_id",id)
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