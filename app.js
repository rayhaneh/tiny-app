// This file holds the express server setup
const express = require("express")
const app = express()
const cookieSession = require('cookie-session')
const bodyParser = require("body-parser")
const expressSanitizer    = require("express-sanitizer")
const uuidv4 = require('uuid/v4')
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080 // default port 8080

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()) // should always go after the bodyparser
app.use(cookieSession({
  name: 'session',
  keys: ['abcdefghijklmnopqrstuvwxyz0123456789']
}))


let loggedInUser
app.use((req, res, next) => {
  userID = req.session.user_id
  if (userID) {
    loggedInUser = userID
  } else {
    loggedInUser = ""
  }
  next()
})

// Database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID:  "b957e91f-13c5-47be-bcee-850052d2de14"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID:  "87981921-7669-9591-49ef-50463212301c"
  }
}

const users = {
  "b957e91f-13c5-47be-bcee-850052d2de14": {
    id: "b957e91f-13c5-47be-bcee-850052d2de14",
    email: "user@example.com",
    //password: "purple-monkey-dinosaur"
    password: "$2a$10$bOPX2gFGLE8FpEJHYp/WM.ZjKcv0i/qolRuw64NK8rN8Lg4GDXOs."
  },
 "87981921-7669-49ef-9591-50463212301c": {
    id: "87981921-7669-49ef-9591-50463212301c",
    email: "user2@example.com",
    // password: "dishwasher-funk"
    password: "$2a$10$ytvq6lwHOY2/UuqYU7JrIezopG0WeGI48xn.eyM9jJMqT2JLFziEy"
  },
   "87981921-7669-9591-49ef-50463212301c": {
    id: "87981921-7669-9591-49ef-50463212301c",
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
  let user_id = req.session.user_id
  res.render("urls_index", {user : users[user_id], urls: urlsForUser(user_id)});
})

// NEW ROUTE
app.get("/urls/new", (req, res) => {
  let user_id = req.session.user_id
  if (loggedInUser) {
    res.render("urls_new",{user : users[user_id]});
  } else {
    res.render("login", {user : users[user_id]})
  }
})

// CREATE ROUTE
app.post("/urls", (req, res) => {
  // should this check if the user is logged in or not?
  let longURL = req.sanitize(req.body.longURL);
  shortURL = generateRandomString(6)
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: loggedInUser
  }
  res.redirect('/urls'); // Should it redirect to the new record's page?
})

// SHOW ROUTE and EDIT ROUTE (Shouldn't the edit route be /urls/:id/edit?)
app.get("/urls/:id", (req, res) => {
  let user_id = req.session.user_id
  let shortURL = req.params.id
  let longURL =  urlDatabase[req.params.id].longURL
  if (loggedInUser === urlDatabase[shortURL].userID) {
    let templateVars = {
          shortURL: shortURL,
          longURL: longURL,
          user : users[user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send('you are not logged in or the ShortURL does not exist or you are not the owner of the link');
  }
})

// UPDATE ROUTE (Shouldn't the HTTP VERB be PUT?)
app.post("/urls/:id", (req, res) => {
  // So what if two users add the same link??
  let shortURL = req.params.id
  if (loggedInUser === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.longURL
    res.redirect("/urls");
  } else {
    res.status(404).send('you are not logged in or the ShortURL does not exist or you are not the owner of the link');
  }
})

// DESTROY ROUTE (Shouldn't the route be /urls/:id and the verb delete?)
app.post("/urls/:id/delete", (req,res) => {
  let shortURL = req.params.id
  console.log(loggedInUser,shortURL,urlDatabase[shortURL])
  if (loggedInUser === urlDatabase[shortURL].userID){
    delete urlDatabase[shortURL]
    res.redirect("/urls")
  } else {
    res.status(404).send('you are not logged in or the ShortURL does not exist or you are not the owner of the link');
  }
})

// REDIRECTION ROUTE
app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id
  let longURL = urlDatabase[shortURL].longURL
  res.redirect(longURL)
})

// USER LOGIN ROUTE
app.get("/login", (req, res) => {
  let user_id = req.session.user_id
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
  res.redirect("/urls")
})

// USER REGISTRATION ROUTE
app.get("/register", (req, res) => {
  let user_id = req.session.user_id
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
    req.session.user_id = id
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



function urlsForUser(id) {
  let userURLs = {}
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === loggedInUser) {
      userURLs[url] = urlDatabase[url]
    }
  }
  return userURLs
}


// APP LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})