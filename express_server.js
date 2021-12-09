const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080;

const generateRandomString = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    let randomCharCode = Math.floor(Math.random() * 26 + 97);
    if (Math.random() < 0.5) {
      randomCharCode = Math.floor(Math.random() * 9 + 48);
    }
    const randomChar = String.fromCharCode(randomCharCode);
    randomString += randomChar;
  }
  return randomString;
};

app.set("view engine", "ejs");

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const templateVars = { 
    urls: urlDatabase, 
    user: users[userId] 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  const templateVars = { user: users[userId] };
  res.render("urls_new", templateVars);
});

// Rendering the register form
app.get("/register", (req, res) => {
  const templateVars = { user: null };
  res.render('register', templateVars);
});

// Rendering the login form
app.get("/login", (req, res) => {
  const templateVars = { user: null };
  res.render('login', templateVars);
});

// Rendering the urls_show
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const userId = req.cookies.user_id;
  const templateVars = { shortURL, longURL, user: users[userId] };
  res.render("urls_show", templateVars);
});

// Creating and redirecting to a specific short URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Redirecting user to the long URL based on the short URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// Deleting URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Redirecting from urls_index to urls_show for a specific short URL
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

// Editing/redirecting from urls_index to urls_show to urls_index
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL] = newURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  //const userName = req.body.username
  //res.cookie("username", userName)
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = findUserByEmail(email, users);

  if (email === "" || password === "") {
    res.status(400).send("You need to enter an email and password.");
    return;
  }

  if (user) {
    res.status(400).send("Sorry, user already exists.");
    return;
  }

  // creating a new user id
  const userId = Math.random().toString(36).substr(2, 8);

  const newUser = {
    id: userId,
    email,
    password,
  };

  // adding the new user to the db
  users[userId] = newUser;

  // setting a user_id cookie, keeping the userId in the cookie
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

const findUserByEmail = (email, database) => {
  for (let userId in database) {
    const user = database[userId];

    if (user.email === email) {
      return user;
    }
  }
  return false;
};