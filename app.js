// This file holds the express server setup
const express = require("express")
const app = express()
const cookieSession = require('cookie-session')
const bodyParser = require("body-parser")
const expressSanitizer    = require("express-sanitizer")
// const uuidv4 = require('uuid/v4')
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080 // default port 8080

app.set('view engine', 'ejs')



// Middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()) // should always go after the bodyparser
app.use(cookieSession({
  name: 'session',
  keys: ['abcdefghijklmnopqrstuvwxyz0123456789']
}))
app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {

  const currentUser = req.session.user_id
  // To Use the App Log in or Register
  const byPath = ["/login", "/register"]
  if (!currentUser) {
    if (byPath.indexOf(req.path) === -1) res.redirect("/login")
    next()
    return
  }
  else {
    req.currentUser = currentUser
    if (byPath.indexOf(req.path) !== -1) res.redirect("/urls")
    next()
    return
  }
})

// Database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID:  "f83e2tny"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID:  "5opu9x5n"
  }
}

const users = {
  "f83e2tny": {
    id: "f83e2tny",
    email: "user@example.com",
    //password: "purple-monkey-dinosaur"
    password: "$2a$10$bOPX2gFGLE8FpEJHYp/WM.ZjKcv0i/qolRuw64NK8rN8Lg4GDXOs."
  },
 "6m7vxy5p": {
    id: "6m7vxy5p",
    email: "user2@example.com",
    // password: "dishwasher-funk"
    password: "$2a$10$ytvq6lwHOY2/UuqYU7JrIezopG0WeGI48xn.eyM9jJMqT2JLFziEy"
  },
   "5opu9x5n": {
    id: "5opu9x5n",
    email: "test@email.com",
    // password: "test"
    password: "$2a$10$.P/in.uHjOq7BMREgpMnjecU4UDCNRtEA0YwkIOthGw2Ut4EDkHT."
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
app.get("/urls", (req, res) => {
  const templateVars = {
    user : users[req.currentUser],
    urls: urlsForUser(req.currentUser)
  }
  res.render("urls_index", templateVars);
})

// NEW ROUTE
app.get("/urls/new", (req, res) => {
  res.render("urls_new",{user : users[req.currentUser]});
})

// CREATE ROUTE
app.post("/urls", (req, res) => {
  let longURL  = req.sanitize(req.body.longURL);
  let shortURL = generateRandomString(6,urlDatabase)
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.currentUser
  }
  res.redirect('/urls'); // Should it redirect to the new record's page?
})

// SHOW ROUTE and EDIT ROUTE (Shouldn't the edit route be /urls/:id/edit?)
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id

  if (!urlDatabase[shortURL]) {
    res.status(404).send('The ShortURL does not exist');
  }
  else if (req.currentUser !== urlDatabase[shortURL].userID) {
    res.status(404).send('you are not the owner of this short URL');
  }
  else {
    let templateVars = {
          shortURL: shortURL,
          longURL : urlDatabase[req.params.id].longURL,
          user    : users[req.currentUser]
    }
    res.render("urls_show", templateVars);
  }
})

// UPDATE ROUTE (Shouldn't the HTTP VERB be PUT?)
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id

  if (!urlDatabase[shortURL]) {
    res.status(404).send('The ShortURL does not exist');
  }
  else if (req.currentUser !== urlDatabase[shortURL].userID) {
    res.status(404).send('You are not the owner of this short URL');
  }
  else {
    urlDatabase[shortURL].longURL = req.body.longURL
    res.redirect("/urls");
  }

})

// DESTROY ROUTE (Shouldn't the route be /urls/:id and the verb delete?)
app.post("/urls/:id/delete", (req,res) => {
  let shortURL = req.params.id
  if (!urlDatabase[shortURL]) {
    res.status(404).send('The ShortURL does not exist');
  }
  else if (req.currentUser !== urlDatabase[shortURL].userID){
    res.status(404).send('You are not the owner of this short URL');
  }
  else {
    delete urlDatabase[shortURL]
    res.redirect("/urls")
  }
})

// REDIRECTION ROUTE
app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id
  let longURL  = urlDatabase[shortURL].longURL
  res.redirect(longURL)
})

// USER LOGIN ROUTE
app.get("/login", (req, res) => {
  res.render("login", {user: ""})
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
      if (bcrypt.compareSync(req.body.password,users[key].password)) {
        pass = true
      }
    }
  });
  if (!id){
    res.status(403).send('User does not exist');
  } else if (!pass) {
    res.status(403).send('Password is not correct');
  } else {
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
  });
  req.session = null
  res.redirect("/login")
})

// USER REGISTRATION ROUTE
app.get("/register", (req, res) => {
  let templateVars = {
        user : users[req.currentUser]
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
    let id = generateRandomString(8,users);
    users[id] = {
        id : id,
        email: req.body.email,
        password: req.body.password
      }
    req.session.user_id = id
    res.redirect("/urls")
  }
})


function generateRandomString(length,database) {
  let randomString  = ""
  const possible      = "abcdefghijklmnopqrstuvwxyz0123456789"
  do {
    for(var i = 0; i < length; i++) {
      randomString += possible.charAt(Math.floor(Math.random() * possible.length))
    }
  } while (database[randomString])
  return randomString
}



function urlsForUser(id) {
  let userURLs = {}
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url]
    }
  }
  return userURLs
}


// APP LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})