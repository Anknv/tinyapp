const findUserByEmail = (email, database) => {
  for (let userId in database) {
    const user = database[userId];

    if (user.email === email) {
      return user;
    }
  }
  return false;
};

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

module.exports = { findUserByEmail, generateRandomString, urlsForUser };