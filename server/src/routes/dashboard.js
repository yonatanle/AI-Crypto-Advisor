const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { getCoinPrices } = require("../services/coingecko");
const { getMarketNews } = require("../services/news");
const { getAiInsight } = require("../services/aiInsight");
const { getDailyMemes } = require("../services/memes");
const { SECTIONS } = require("../constants");

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

  const [news, prices, insight, memes] = await Promise.all([
    getMarketNews(preferences.assets),
    getCoinPrices(preferences.assets),
    getAiInsight(preferences),
    getDailyMemes(),
  ]);

  // Dated id (not a UUID per call) so repeat votes on today's insight land
  // on the same row instead of each dashboard load creating a new item.
  const insightItem = { id: `insight-${new Date().toISOString().slice(0, 10)}`, ...insight };

  // The assignment calls for a single meme shown dynamically on each dashboard
  // update, not a fixed set — so pick one of today's pool at random per request.
  // The pool itself is still shared/persisted so repeat picks can accumulate votes.
  const meme = memes[Math.floor(Math.random() * memes.length)];

  res.json({
    preferences,
    sections: {
      marketNews: attachVotes(req.user.id, SECTIONS.MARKET_NEWS, news),
      coinPrices: attachVotes(req.user.id, SECTIONS.COIN_PRICES, prices.map((p) => ({ id: p.id, ...p }))),
      aiInsight: attachVotes(req.user.id, SECTIONS.AI_INSIGHT, [insightItem])[0],
      meme: attachVotes(req.user.id, SECTIONS.MEME, [meme])[0],
    },
  });
});

module.exports = router;
