const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL || "postgres://postgres:devpassword@localhost:5437/moveo";

// Hosted Postgres (Render, etc.) requires SSL and uses a self-signed cert
// chain, so verification is disabled rather than left on to fail; local
// Docker Postgres (dev and tests both point at localhost) has no SSL
// configured at all, so it's detected by host instead of by DATABASE_URL
// being set (tests set DATABASE_URL too, but still point at localhost).
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      assets TEXT NOT NULL,
      investor_type TEXT NOT NULL,
      content_types TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      section TEXT NOT NULL,
      item_key TEXT NOT NULL,
      vote INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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
}

const ready = init();

module.exports = {
  query: (text, params) => pool.query(text, params),
  ready,
  close: () => pool.end(),
};
