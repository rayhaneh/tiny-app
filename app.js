// This file holds the express server setup
const express           = require("express")
const app               = express()
const cookieSession     = require('cookie-session')
const bodyParser        = require("body-parser")
const expressSanitizer  = require("express-sanitizer")
const bcrypt            = require('bcrypt');
const PORT              = process.env.PORT || 8080

app.set('view engine', 'ejs')



// Middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()) // should always go after the bodyparser
app.use(cookieSession({
  name: 'session',
  keys: ['abcdefghijklmnopqrstuvwxyz0123456789']
}))
app.use(express.static(__dirname + '/public'));
app.use(require("./authentication.js"))



// Database
const urlDatabase = require("./urlDatabase.json")
const users       = require("./users.json")


// ROOT ROUTE
app.get("/", (req, res) => {
  res.redirect("/urls")
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
  res.redirect(`/urls/${shortURL}`); // Should it redirect to the new record's page?
})

// SHOW ROUTE and EDIT ROUTE (Shouldn't the edit route be /urls/:id/edit?)
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id

  if (!urlDatabase[shortURL]) {
    res.status(404)
    let error = "The ShortURL does not exist"
    res.render("error", {user: users[req.currentUser], error: error});
  }
  else if (req.currentUser !== urlDatabase[shortURL].userID) {
    let error = "you are not the owner of this short URL"
    res.status(404)
    res.render("error", {user: users[req.currentUser], error: error});
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
    res.status(404)
    let error = "The ShortURL does not exist"
    res.render("error", {user: users[req.currentUser], error: error});
  }
  else if (req.currentUser !== urlDatabase[shortURL].userID) {
    res.status(404)
    let error = "You are not the owner of this short URL"
    res.render("error", {user: users[req.currentUser], error: error});
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
    res.status(404);
    let error = "The ShortURL does not exist"
    res.render("error", {user: users[req.currentUser], error: error});
  }
  else if (req.currentUser !== urlDatabase[shortURL].userID){
    res.status(404)
    let error = "You are not the owner of this short URL"
    res.render("error", {user: users[req.currentUser], error: error})
  }
  else {
    delete urlDatabase[shortURL]
    res.redirect("/urls")
  }
})

// REDIRECTION ROUTE
app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id
  if (!urlDatabase[shortURL]) {
    res.status(404)
    let error = 'The short URL you are looking for does not exist';
    res.render("error", {user: users[req.currentUser], error: error});
  }
  else {
    let longURL  = urlDatabase[shortURL].longURL
    res.redirect(longURL)
  }
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

  if (!req.body.email || !req.body.password) {
    res.status(400).send('The email or password field is empty.');
  } else if (emailExists){
    res.status(400).send('This email address is already registred.');
  } else {
    let id = generateRandomString(8,users);
    users[id] = {
        id : id,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password,10)
      }
    // Comment out this line if you want them to
    req.session.user_id = id
    res.redirect("/login")
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