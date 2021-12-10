const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

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

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user2RandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID",
  }
};

// filtering the database by the passed in ID
const urlsForUser = (id, database) => {
  const filteredDatabase = {};
  for (let shortUrl in database) {
    const value = database[shortUrl];
    if (value.userID === id) {
      filteredDatabase[shortUrl] = value;
    }
  }
  return filteredDatabase;
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
    password: "1"
    //password: "dishwasher-funk"
  }
};

const findUserByEmail = (email, database) => {
  for (let userId in database) {
    const user = database[userId];

    if (user.email === email) {
      return user;
    }
  }
  return false;
};

const authenticateUser = (email, password, database) => {
  const user = findUserByEmail(email, database);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const filteredDatabase = urlsForUser(userId, urlDatabase);
  const templateVars = {
    urls: filteredDatabase,
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  if (!userId || !user) {
    res.redirect("/login");
    return;
  }
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

// Rendering the register form
app.get("/register", (req, res) => {
  const userId = req.cookies.user_id;
  if (users[userId]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = { user: null };
  res.render("register", templateVars);
});

// Rendering the login form
app.get("/login", (req, res) => {
  const userId = req.cookies.user_id;
  if (users[userId]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = { user: null };
  res.render('login', templateVars);
});

// Rendering the urls_show
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const userId = req.cookies.user_id;
  const templateVars = { shortURL, longURL, user: users[userId] };
  res.render("urls_show", templateVars);
});

// Creating shortURL and redirecting to it
app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  if (!userId || !user) {
    res.status(403).send("Not logged in.");
    return;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userId,
  };
  res.redirect(`/urls/${shortURL}`);
});

// Redirecting user to the longURL based on the shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(404).send("Not found.");
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

// Editing URL/redirecting from urls_index to urls_show
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;

  const userId = req.cookies.user_id;
  const value = urlDatabase[shortURL];
  if (value.userID !== userId) {
    res.status(403).send("You don't have permission to edit this.");
    return;
  }
  res.redirect("/urls");
});

// Deleting URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies.user_id;
  const value = urlDatabase[shortURL];
  if (value.userID !== userId) {
    res.status(403).send("You don't have permission to delete this.");
    return;
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Login/Authenticating the user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password, users);

  if (user) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
    return;
  }
  res.status(403).send("Incorrect username or password.");
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// Register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = findUserByEmail(email, users);

  if (email === "" || password === "") {
    res.status(400).send("You need to enter an email and password.");
    return;
  }

  if (user) {
    res.status(400).send("This email is already connected to an account.");
    return;
  }

  // Creating a new userId
  const userId = Math.random().toString(36).substr(2, 8);

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userId,
    email,
    password: hashedPassword
  };

  // Adding the new user to the db
  users[userId] = newUser;

  // Setting a user_id cookie, keeping the userId in the cookie
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});

