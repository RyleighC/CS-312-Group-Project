const express = require("express");
const bcrypt = require("bcrypt");
const { store } = require("../data/store");

const router = express.Router();
const SALT_ROUNDS = 10;

// LOGIN PAGE
router.get("/login", (req, res) => {
  res.render("login", { error: null, user: req.session.user || null });
});

// SIGNUP PAGE
router.get("/signup", (req, res) => {
  res.render("signup", { error: null, user: req.session.user || null });
});

// HANDLE SIGNUP — password is hashed with bcrypt before storing
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.render("signup", {
      error: "All fields are required.",
      user: null
    });
  }

  const existing = store.users.find(
    (u) => u.username === username || u.email === email
  );
  if (existing) {
    return res.render("signup", {
      error: "Username or email already taken.",
      user: null
    });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = {
    id: Date.now(),
    username,
    email,
    passwordHash
  };

  store.users.push(user);

  req.session.user = { id: user.id, username: user.username };
  res.redirect("/");
});

// HANDLE LOGIN — compare plain password to stored hash
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = store.users.find((u) => u.username === username);
  if (!user) {
    return res.render("login", {
      error: "Invalid username or password.",
      user: null
    });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.render("login", {
      error: "Invalid username or password.",
      user: null
    });
  }

  req.session.user = { id: user.id, username: user.username };
  res.redirect("/");
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
