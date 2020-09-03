const express = require("express");
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const findUserByEmail = require('./helpers');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['charizard']
}));

app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur",1)
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk",1)
  }
}

// HELPER FUNCTIONS - can move

const generateRandomString = () => {
  let randomString = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length))
  }
return randomString;
};

// Checks current id against users in database
const userCheck = (id) => {
  for (const user in users) {
    if (user === id) {
      return user;
    }
  } 
  return null;
};

// Filters URL for each user
const urlsForUser = (id) => {
const filteredURL = {};
  for (const dataBaseID in urlDatabase) {
    if (id === urlDatabase[dataBaseID].userID) {
      filteredURL[dataBaseID] = urlDatabase[dataBaseID];
    }
  }
  return filteredURL;
};

// URLS Page
app.get("/urls", (req, res) => {
  const id = req.session.user_id
  
  if(userCheck(id) === null) {
    return res.send("Please log in or register");
  }
  
  const filteredURL = urlsForUser(id);
  let templateVars = { urls: filteredURL, user: users[id] }
  res.render("urls_index", templateVars);
  
  
});

// new URL Page
app.get("/urls/new", (req, res) => { 
  const id = req.session.user_id
  let templateVars = { user: users[id] };
  
  if (id === undefined || id === null) {
    return res.redirect('/login')
  }  
  
  if (!userCheck(id)) { 
    return res.redirect("/login");
  }

  res.render('urls_new', templateVars); 
})


// shortURL Page
app.get("/urls/:id", (req, res) => {
  const id = req.session.user_id;
  const shortURL = req.params.id;
  
  if(!shortURL) {
    return res.status(400).send("400 Bad Request");
  }
  
  // check if user is logged in
  if (!userCheck(id)) {
    return res.status(400).send("400 Bad Request");
  };
  
  // check if URL ID matched User ID
  const foundUser = userCheck(id);
  
  if (foundUser !== urlDatabase[shortURL].userID){
    return res.status(400).send("400 Bad Request");
  }
  
  const longURL = urlDatabase[shortURL].longURL;
  let templateVars = { shortURL: req.params.id, longURL, user: users[id] };
  res.render("urls_show", templateVars); 
  
});

// Redirects to longURL Page
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id
  const longURL = urlDatabase[shortURL].longURL;
  
  if(!longURL) {
    return res.status(400).send("400 Bad Request");
  }
  res.redirect(longURL);
});

// Posts new URL
app.post("/urls", (req, res) => {
  const id = req.session.user_id
  
  if (!userCheck(id)) {
    return res.status(400).send("400 Bad Request");
  };
  
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: longURL, userID: id }
  res.redirect(`/urls/${shortURL}`);
});

// Posts updated URL
app.post('/urls/:id', (req, res) => {
  const id = req.session.user_id
  const shortURL = req.params.id;
  const newLongURL = req.body['longURL'];
  
  // check if user is logged in
  if (!userCheck(id)) {
    return res.status(400).send("400 Bad Request");
  };
  
  // check if URL ID matched User ID
  const foundUser = userCheck(id);
  
  if (foundUser !== urlDatabase[shortURL].userID){
    return res.status(400).send("400 Bad Request");
  }
  
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect('/urls');
});

// Deletes URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  const id = req.session.user_id
  
  // check if user is logged in
  if (!userCheck(id)) {
    return res.status(400).send("400 Bad Request");
  };
  
  // check if URL ID matched User ID
  const foundUser = userCheck(id);
  
  if (foundUser !== urlDatabase[shortURL].userID){
    return res.status(400).send("400 Bad Request");
  }
  
  delete urlDatabase[shortURL];
  return res.redirect("/urls")
});

// Login Page
app.get("/login", (req, res) => {
  const id = req.session.user_id;
  let templateVars = { user: users[id] };
  res.render("login", templateVars);
})

// Registration Page
app.get("/register", (req, res) => {
  const id = req.session.user_id
  let templateVars = { user: users[id] };
  res.render("registration", templateVars);
});

// add user to users object and save user_id cookie
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("400 Bad Request: Email or password cannot be blank.");
  }
  
  const foundUser = findUserByEmail(email, users);
  
    if (foundUser) {
      return res.status(400).send("400 Bad Request: Email or password already exists.");
    }

  const id = generateRandomString();
  newUser = { id, email, password: bcrypt.hashSync(password, 1) };
  users[id] = newUser;
  req.session.user_id = newUser.id
  res.redirect("/urls")
});


app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if (!email || !password) {
    return res.status(400).send("400 Bad Request: Email or password cannot be blank.");
  }
  
  const foundUser = findUserByEmail(email, users);
  
  if (foundUser === undefined) {
    return res.send('No user with that email found.');
  };
  
  if (bcrypt.compareSync(password, foundUser.password) === false) {
    return res.status(403).send("403 Forbidden");
  };
  

  req.session.user_id = foundUser.id
  res.redirect("/urls");
});

app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});







app.get("/", (req, res) => {
  res.redirect('/urls')
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


