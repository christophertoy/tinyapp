const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/urls", (req, res) => {
  const id = req.cookies.user_id
  let templateVars = { urls: urlDatabase, user: users[id] }
  res.render("urls_index", templateVars);
});

// render registration page
app.get("/register", (req, res) => {
  const id = req.cookies.user_id
  let templateVars = { user: users[id] };
  res.render("registration", templateVars);
});

// add user to users object and save user_id cookie
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
    if (!email || !password) {
      return res.send("400 Bad Request");
    }

    for (const userID in users) {
      if (email === users[userID].email) {
        return res.send("400 Bad Request");
      }
    }
  const id = generateRandomString();
  newUser = { id, email, password };
  users[id] = newUser;
  res.cookie("user_id", id);
  res.redirect("/urls")
});

// render login page
app.get("/login", (req, res) => {
  const id = req.cookies.user_id
  let templateVars = { user: users[id] };
  res.render("login", templateVars);
})

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  let foundUser = null;
  for (const userID in users) {
    if (email === users[userID].email) {
      foundUser = userID;
    } 
  } 

  if (users[foundUser].password !== password) {
    return res.send("403 Forbidden");
  };
 
  res.cookie("user_id", foundUser);
  res.redirect("/urls");
});

app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  delete urlDatabase[shortURL];
  res.redirect("/urls")
});


app.post('/urls/:id', (req, res) => {
  const newLongURL = req.body['longURL'];
  const shortURL = req.params.id
  urlDatabase[shortURL] = newLongURL;
  res.redirect(`/urls/${shortURL}`);
});



app.get("/urls/new", (req, res) => { // new URL Form
  const id = req.cookies.user_id
  let templateVars = { user: users[id] };
  res.render('urls_new', templateVars);
})

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies.user_id
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[id] };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`); // Redirect to /urls/:shortURL
});

function generateRandomString() {
 
  let randomString = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length))
  }
return randomString;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


