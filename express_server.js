const cookieSession = require('cookie-session');
const express = require('express');
const app = express();
const PORT = 8080; 
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"]
}));

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "1234"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "1234"
  }
}

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" }
  };

app.get("/", (req, res) => {
  res.send("Hello!");
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => { //--- current 
  const user = users[req.session["user_id"]];
  
  urlsForUser(req.session["user_id"]);
  // let userURL = {};
  // for (let shortURL in urlDatabase) {
  //   const url = urlDatabase[shortURL];
  //   if (url.userID === req.cookies["user_id"]) {
  //     userURL[shortURL] = url;
  //   }
  // };

  let templateVars = { urls: urlsForUser(req.session["user_id"]), user: users[req.session["user_id"]]};
  // let templateVars = { urls: userURL, user: users[req.cookies["user_id"]]};
  
  if (user) {
    res.render("urls_index", templateVars);
  } else {
    res.send("You must register or login to do that!");
  }
    
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session["user_id"]];
  const templateVars = { user }
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => { // ---- check
  const shortURL = req.params.shortURL;
  const userObject = urlDatabase[shortURL];
  // console.log(shortURL);


  let templateVars = { shortURL: req.params.shortURL, longURL: userObject.longURL, user: users[req.session["user_id"]]  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let userObject = urlDatabase[req.params.shortURL];
  let templateVars = { shortURL: req.params.shortURL, longURL: userObject.longURL, user: users[req.session["user_id"]] }; 
  res.redirect(templateVars.longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session["user_id"]]  }; 
  res.render("urls_register", templateVars)
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session["user_id"]]  }; 
  res.render("urls_login", templateVars);
});

app.post("/register", (req, res) => { // ---- check
  const { email, password } = req.body;
  if (registerUser(users, req.body)) {
    let randomID = generateRandomString();
    users[randomID] = { 
      password: bcrypt.hashSync(password, saltRounds), 
      id: randomID, 
      email, };
      console.log(users);
    // res.cookie("user_id", randomID);
    req.session.user_id = randomID;
    res.redirect("/urls");
  } else {
    res.status(400);
    res.send('error')
  }

});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let id = req.session["user_id"];
  // console.log(shortURL);
  // console.log(req.session["user_id"]);
  urlDatabase[shortURL] = { longURL, userID: id };
  res.redirect(`/urls/${shortURL}`);         
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session["user_id"];
  if (user) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(400);
  }
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const logInResult = logInUser(users, req.body);
  switch (logInResult) {
    case "Bad Email":
      res.status(403);
      res.send("Bad Email");
      break;
    case "Bad Password":
      res.status(403);
      res.send("Bad Password");
      break;
    default:
      // res.cookie("user_id", logInResult.id);
      req.session.user_id = logInResult.id;
      res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  // res.clearCookie("user_id");
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

function generateRandomString() {
  const number = Math.floor(Math.random() * Math.pow(10, 6));
	return number;
};

//checks user registration process
function registerUser(users, userInfo) {
  const { email, password } = userInfo;
  for (let user in users) {
    let userData = users[user]
    if (email === userData.email) {
      return null;
    }  
    if (!email || !password) {
      return null;
    }
  }
  return true;
};

//checks login detials for user
function logInUser(users, logInInfo) {
  const { email, password } = logInInfo;
  for (let user in users) {
    let logInData = users[user];
     if (email === logInData.email) {
       if (bcrypt.compareSync(password, logInData.password)) {
          return logInData;
        } else {
          return "Bad Password";
        }
      }
    }
  return "Bad Email"  
};

//function checking if user is logged in 
function checkUserLog(user) {
  if(user) {
    return true;
  } else {
    return false;
  }
};

// function that returns URLs where userID === id of current logged in user 
function urlsForUser(id) { 
  let userURL = {};
  for (let shortURL in urlDatabase) {
    const url = urlDatabase[shortURL];
    if (url.userID === id) {
      userURL[shortURL] = url;
    }
  }
  return userURL;
};

function getUserId(email) {
  for(let userId in users) {
    if(users[userId].email === email) {
      return users.email;
    }
  }
  return false;
};