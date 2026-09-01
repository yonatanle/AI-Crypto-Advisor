const fetch = require("node-fetch");

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

function getStaticDailyMeme() {
  const dayIndex = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayIndex.length; i++) hash = (hash * 31 + dayIndex.charCodeAt(i)) >>> 0;
  return STATIC_MEMES[hash % STATIC_MEMES.length];
}

function getStaticRandomMeme() {
  return STATIC_MEMES[Math.floor(Math.random() * STATIC_MEMES.length)];
}

async function getRandomMeme() {
  try {
    const resp = await fetch("https://meme-api.com/gimme/cryptocurrencymemes", { timeout: 8000 });
    if (!resp.ok) throw new Error(`meme-api error ${resp.status}`);
    const data = await resp.json();
    if (!data.url || data.nsfw) throw new Error("invalid or nsfw meme response");

    return {
      id: data.postLink || `meme-api-${Date.now()}`,
      url: data.url,
      caption: data.title || "Crypto meme of the day",
    };
  } catch (err) {
    console.error("meme-api fetch failed, using static fallback:", err.message);
    return getStaticRandomMeme();
  }
}

module.exports = { getRandomMeme, getStaticDailyMeme };
