const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" }
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
const findUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// checks current id against users in database
const userCheck = (id) => {
  for (const user in users) {
    if (user === id) {
      return true;
    }
  } 
  return false;
}

const urlsForUser = (id) => {
const filteredURL = {};
  for (const dataBaseID in urlDatabase) {
    if (id === urlDatabase[dataBaseID].userID) {
      filteredURL[dataBaseID] = urlDatabase[dataBaseID];
    }
  }
  return filteredURL;
};

app.get("/urls", (req, res) => {
  const id = req.cookies.user_id
  const filteredURL = urlsForUser(id);
  console.log(urlDatabase);
  console.log(filteredURL);
  let templateVars = { urls: filteredURL, user: users[id] }
  res.render("urls_index", templateVars);

  // return res.redirect('/login')
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
      return res.status(400).send("400 Bad Request");
    }
    
  const foundUser = findUserByEmail(email);

    if (foundUser) {
      return res.status(400).send("400 Bad Request");
    }

  const id = generateRandomString();
  newUser = { id, email, password };
  users[id] = newUser;
  res.cookie("user_id", newUser.id);
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

  if (!email || !password) {
    return res.send('email and password cannot be blank');
  }
  
  const foundUser = findUserByEmail(email);

  if (foundUser === null) {
    return res.send('no user with that email found');
  };

  if (foundUser.password !== password) {
    return res.status(403).send("403 Forbidden");
  };
 
  res.cookie("user_id", foundUser.id);
  res.redirect("/urls");
});

app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  const id = req.cookies.user_id
  if (userCheck(shortURL)) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls")
  } else {
    return res.redirect("/login");
  }
});

// Edit URL 
app.post('/urls/:id', (req, res) => {
  const id = req.cookies.user_id
  if(userCheck(id)) {
    const newLongURL = req.body['longURL'];
    const shortURL = req.params.id
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect("/login")
  }

});


// new URL Form
app.get("/urls/new", (req, res) => { 
  const id = req.cookies.user_id
  let templateVars = { user: users[id] };

  if(!id) {
    return res.redirect('/login');
  };

  for (const user in users) {
    if (user === users[id].id) {
      return res.render('urls_new', templateVars); 
    }
  }
  res.redirect('/login');
});

app.post("/urls", (req, res) => {
  const id = req.cookies.user_id
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: longURL, userID: id }
  res.redirect(`/urls/${shortURL}`);
  
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies.user_id
  shortURL = req.params.shortURL;
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[id] };
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
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
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


