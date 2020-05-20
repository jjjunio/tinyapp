const bcrypt = require('bcrypt');

//generates random 6 digit number string
function generateRandomString() {
  const number = Math.floor(Math.random() * Math.pow(10, 6));
	return number;
};

//checks user registration process
function registerUser(users, userInfo) {
  const { email, password } = userInfo;
  for (let user in users) {
    let userData = users[user];
    //checks if user previously registered with email 
    if (email === userData.email) {
      return null;
    }  
    //checks if email and password fields are completed
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
function urlsForUser(id, database) { 
  let userURL = {};
  for (let shortURL in database) {
    const url = database[shortURL];
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

function getUserByEmail(email, database) {
  for(let userId in database) {
    const user = database[userId];
    if(user.email === email) {
      return user.id;
    }
  }
  return undefined;
};

module.exports = {
  generateRandomString,
  registerUser,
  logInUser,
  urlsForUser,
  checkUserLog,
  getUserId,
  getUserByEmail
};