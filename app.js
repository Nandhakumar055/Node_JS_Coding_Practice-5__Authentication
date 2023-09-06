const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

app.use(express.json());

let DB = null;

const initializationDBAndServer = async () => {
  try {
    DB = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

const validPassword = (password) => {
  return password.length > 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `
    SELECT 
        *
    FROM 
        user
    WHERE
        username = '${username}';`;

  const userDB = await DB.get(userQuery);

  if (userDB === undefined) {
    const userRegisterQuery = `
      INSERT INTO 
      user (username, name, password, gender, location)
      VALUES(
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'
      );`;

    if (validPassword(password)) {
      await DB.run(userRegisterQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
    SELECT *
    FROM user
    WHERE
    username = '${username}';`;

  const userDB = await DB.get(userQuery);

  if (userDB === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, userDB.password);
    if (passwordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, newPassword, oldPassword } = request.body;
  const userQuery = `
    SELECT *
    FROM 
    user
    WHERE
    username = '${username}';`;
  const userDB = await DB.get(userQuery);

  if (userDB === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(oldPassword, userDB.password);
    if (passwordMatch === true) {
      if (validPassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
                UPDATE 
                user
                SET
                password = '${hashedPassword}'
                WHERE
                username = '${username}';`;

        const user = await DB.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
