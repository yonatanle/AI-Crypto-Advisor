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

function getDailyMeme() {
  const dayIndex = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayIndex.length; i++) hash = (hash * 31 + dayIndex.charCodeAt(i)) >>> 0;
  const meme = STATIC_MEMES[hash % STATIC_MEMES.length];
  return meme;
}

function getRandomMeme() {
  return STATIC_MEMES[Math.floor(Math.random() * STATIC_MEMES.length)];
}

module.exports = { getDailyMeme, getRandomMeme };
