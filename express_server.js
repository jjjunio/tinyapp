const cookieSession = require('cookie-session');
const express = require('express');
const app = express();
const PORT = 8080; 
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const helper = require("./helpers");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"]
}));
const users = {};
//users object structure
//   "userRandomID": {
//     id: "userRandomID", 
//     email: "user@example.com", 
//     password: "1234"
//   },
//  "user2RandomID": {
//     id: "user2RandomID", 
//     email: "user2@example.com", 
//     password: "1234"
//   }
const urlDatabase = {};
//database object structure
// "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
// "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" }

app.get("/", (req, res) => { 
  res.redirect("/register");
})

// users should be logged in to see shortened urls
app.get("/urls", (req, res) => { 
  const user = users[req.session["user_id"]];
  const urls = helper.urlsForUser(req.session["user_id"], urlDatabase);
  const templateVars = { urls, user };
  if (user) {
    res.render("urls_index", templateVars);
  } else {
    res.send("You must register or login to do that!");
  }
});

// when user is logged out they are redirected to login when trying to create new shortened urls 
app.get("/urls/new", (req, res) => {
  const user = users[req.session["user_id"]];
  const templateVars = { user };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => { 
  const user = users[req.session["user_id"]];
  const shortURL = req.params.shortURL;
  const userObject = urlDatabase[shortURL];
  const urls = helper.urlsForUser(req.session["user_id"], urlDatabase);
  const templateVars = { longURL: userObject.longURL, shortURL, user, urls };
  if (user && user.id === userObject.userID) {
    res.render("urls_show", templateVars);
  } else {
    res.status(401).send("You must be logged in or be the URL owner to visit this page");
  }
  
});

app.get("/u/:shortURL", (req, res) => {
  const user = users[req.session["user_id"]];
  const shortURL = req.params.shortURL;
  const usersURLS = helper.urlsForUser(user.id, urlDatabase);
  if(usersURLS[shortURL]) {
    res.redirect(usersURLS[shortURL].longURL);
  } else {
    res.status(400).send("You must be logged in or be the URL owner to visit this page");
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]]  }; 
  res.render("urls_register", templateVars)
});

app.get("/login", (req, res) => {
  const user = users[req.session["user_id"]];
  const templateVars = { user }; 
  res.render("urls_login", templateVars);
});

//checks user registration process
app.post("/register", (req, res) => { 
  const { email, password } = req.body;
  //checks if user is already registered or no value set in email or password field
  if (helper.registerUser(users, req.body)) {
    //if registerUser returns true 
    let randomID = helper.generateRandomString();
    users[randomID] = { 
      //hash user password to secure
      password: bcrypt.hashSync(password, saltRounds), 
      id: randomID, 
      email
    };
    req.session.user_id = randomID;
    res.redirect("/urls");
  } else {
    res.status(400).send("Please ensure that email and password fields are completed and that email used to register has not been previously used")
  }
});

// create tinyURL
app.post("/urls", (req, res) => {
  const shortURL = helper.generateRandomString();
  const longURL = req.body.longURL;
  const id = req.session["user_id"];
  urlDatabase[shortURL] = { longURL, userID: id };
  res.redirect("/urls/" + shortURL);         
});

// allow user to delete URLs in app
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session["user_id"];
  //missing  
  if (user && urlDatabase[req.params.shortURL].userID === user) { //
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(400);
  }
});

//allows user to edit longURLs and assign to shortURL already in database 
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  let longURL = req.body.longURL;
  const userObject = urlDatabase[shortURL];
  userObject.longURL = longURL;
  res.redirect("/urls");
});

//checks user login credentials and notifies if errors are present 
app.post("/login", (req, res) => {
  const logInResult = helper.logInUser(users, req.body);
  switch (logInResult) {
    case "Bad Email":
      res.status(403).send("Bad Email");
      break;
    case "Bad Password":
      res.status(403).send("Bad Password");
      break;
    default:
      req.session.user_id = logInResult.id;
      res.redirect("/urls");
  }
});

//logs out current user and erase cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log("Example app listening on port" + PORT);
});

