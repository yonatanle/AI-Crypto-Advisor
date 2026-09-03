const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// DB_PATH override lets tests point at a temp/in-memory file instead of the
// real app database.
const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "app.sqlite");
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    assets TEXT NOT NULL,
    investor_type TEXT NOT NULL,
    content_types TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    item_key TEXT NOT NULL,
    vote INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, section, item_key)
  );

  -- Persists the day's meme picks so every user sees the same 3 memes and
  -- votes accumulate per item instead of resetting on every server restart.
  CREATE TABLE IF NOT EXISTS daily_memes (
    day TEXT NOT NULL,
    idx INTEGER NOT NULL,
    id TEXT NOT NULL,
    url TEXT NOT NULL,
    caption TEXT NOT NULL,
    PRIMARY KEY (day, idx)
  );
`);

module.exports = db;
