const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { getCoinPrices } = require("../services/coingecko");
const { getMarketNews } = require("../services/news");
const { getAiInsight } = require("../services/aiInsight");
const { getRandomMeme } = require("../services/memes");

const router = express.Router();

function attachVotes(userId, section, items) {
  const rows = db
    .prepare("SELECT item_key, vote FROM votes WHERE user_id = ? AND section = ?")
    .all(userId, section);
  const voteMap = Object.fromEntries(rows.map((r) => [r.item_key, r.vote]));
  return items.map((item) => ({ ...item, userVote: voteMap[item.id] ?? null }));
}

router.get("/", requireAuth, async (req, res) => {
  const prefRow = db.prepare("SELECT * FROM preferences WHERE user_id = ?").get(req.user.id);
  if (!prefRow) {
    return res.status(400).json({ error: "Onboarding not completed" });
  }

  const preferences = {
    assets: JSON.parse(prefRow.assets),
    investorType: prefRow.investor_type,
    contentTypes: JSON.parse(prefRow.content_types),
  };

  const [news, prices, insight, meme] = await Promise.all([
    getMarketNews(),
    getCoinPrices(preferences.assets),
    getAiInsight(preferences),
    getRandomMeme(),
  ]);

  const insightItem = { id: `insight-${new Date().toISOString().slice(0, 10)}`, ...insight };

  res.json({
    preferences,
    sections: {
      marketNews: attachVotes(req.user.id, "marketNews", news),
      coinPrices: attachVotes(req.user.id, "coinPrices", prices.map((p) => ({ id: p.id, ...p }))),
      aiInsight: attachVotes(req.user.id, "aiInsight", [insightItem])[0],
      meme: attachVotes(req.user.id, "meme", [meme])[0],
    },
  });
});

module.exports = router;
