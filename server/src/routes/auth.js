const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  const { email, name, password } = req.body || {};
  if (!email || !name || !password) {
    return res.status(400).json({ error: "email, name and password are required" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (name.length < 1 || name.length > 100) {
    return res.status(400).json({ error: "Name must be between 1 and 100 characters" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const { rows: existingRows } = await db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
  if (existingRows.length) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id",
    [email.toLowerCase(), name, passwordHash]
  );

  const user = { id: rows[0].id, email: email.toLowerCase(), name };
  const token = signToken(user);
  res.status(201).json({ token, user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  const row = rows[0];
  if (!row) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const user = { id: row.id, email: row.email, name: row.name };
  const token = signToken(user);
  res.json({ token, user });
});

module.exports = router;
