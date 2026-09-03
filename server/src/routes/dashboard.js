const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { getCoinPrices } = require("../services/coingecko");
const { getMarketNews } = require("../services/news");
const { getAiInsight } = require("../services/aiInsight");
const { getDailyMemes } = require("../services/memes");
const { SECTIONS } = require("../constants");

const router = express.Router();

async function attachVotes(userId, section, items) {
  const { rows } = await db.query("SELECT item_key, vote FROM votes WHERE user_id = $1 AND section = $2", [
    userId,
    section,
  ]);
  const voteMap = Object.fromEntries(rows.map((r) => [r.item_key, r.vote]));
  return items.map((item) => ({ ...item, userVote: voteMap[item.id] ?? null }));
}

router.get("/", requireAuth, async (req, res) => {
  const { rows: prefRows } = await db.query("SELECT * FROM preferences WHERE user_id = $1", [req.user.id]);
  const prefRow = prefRows[0];
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

  const [marketNews, coinPrices, aiInsightVoted, memeVoted] = await Promise.all([
    attachVotes(req.user.id, SECTIONS.MARKET_NEWS, news),
    attachVotes(req.user.id, SECTIONS.COIN_PRICES, prices.map((p) => ({ id: p.id, ...p }))),
    attachVotes(req.user.id, SECTIONS.AI_INSIGHT, [insightItem]),
    attachVotes(req.user.id, SECTIONS.MEME, [meme]),
  ]);

  res.json({
    preferences,
    sections: {
      marketNews,
      coinPrices,
      aiInsight: aiInsightVoted[0],
      meme: memeVoted[0],
    },
  });
});

module.exports = router;
