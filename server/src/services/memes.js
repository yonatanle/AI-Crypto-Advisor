const fetch = require("node-fetch");
const db = require("../db");

const DAILY_MEME_COUNT = 3;

const STATIC_MEMES = [
  {
    id: "meme-1",
    url: "https://i.imgflip.com/1bij.jpg",
    caption: "When you check your portfolio during a bull run",
  },
  {
    id: "meme-2",
    url: "https://i.imgflip.com/26am.jpg",
    caption: "HODLers watching the market dip",
  },
  {
    id: "meme-3",
    url: "https://i.imgflip.com/1ur9b0.jpg",
    caption: "Me explaining crypto to my family at dinner",
  },
  {
    id: "meme-4",
    url: "https://i.imgflip.com/4t0m5.jpg",
    caption: "Buying the top, every single time",
  },
  {
    id: "meme-5",
    url: "https://i.imgflip.com/9vct.jpg",
    caption: "When the coin you sold pumps 10x",
  },
];

// Picks DAILY_MEME_COUNT distinct static memes deterministically from
// today's date, so the fallback set is stable across a day without needing
// its own persistence.
function getStaticDailyMemeSet() {
  const dayIndex = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayIndex.length; i++) hash = (hash * 31 + dayIndex.charCodeAt(i)) >>> 0;
  const picks = [];
  for (let i = 0; i < DAILY_MEME_COUNT && i < STATIC_MEMES.length; i++) {
    picks.push(STATIC_MEMES[(hash + i) % STATIC_MEMES.length]);
  }
  return picks;
}

async function fetchLiveMemeSet() {
  const resp = await fetch(`https://meme-api.com/gimme/cryptocurrencymemes/${DAILY_MEME_COUNT}`, {
    timeout: 8000,
  });
  if (!resp.ok) throw new Error(`meme-api error ${resp.status}`);
  const data = await resp.json();
  const memes = (data.memes || []).filter((m) => m.url && !m.nsfw);
  if (!memes.length) throw new Error("no valid memes in meme-api response");

  return memes.slice(0, DAILY_MEME_COUNT).map((m) => ({
    id: m.postLink || `meme-api-${Date.now()}-${Math.random()}`,
    url: m.url,
    caption: m.title || "Crypto meme of the day",
  }));
}

// Persists the day's meme picks in SQLite (rather than in-memory) so every
// user sees the same set and votes stay meaningful across server restarts.
async function getDailyMemes() {
  const day = new Date().toISOString().slice(0, 10);

  const existing = db.prepare("SELECT idx, id, url, caption FROM daily_memes WHERE day = ? ORDER BY idx").all(day);
  if (existing.length) return existing.map(({ id, url, caption }) => ({ id, url, caption }));

  let memes;
  try {
    memes = await fetchLiveMemeSet();
  } catch (err) {
    console.error("meme-api fetch failed, using static fallback:", err.message);
    memes = getStaticDailyMemeSet();
  }

  const insert = db.prepare("INSERT OR IGNORE INTO daily_memes (day, idx, id, url, caption) VALUES (?, ?, ?, ?, ?)");
  const insertAll = db.transaction((items) => {
    items.forEach((m, idx) => insert.run(day, idx, m.id, m.url, m.caption));
  });
  insertAll(memes);

  return memes;
}

module.exports = { getDailyMemes };
