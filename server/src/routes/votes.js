const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const VALID_SECTIONS = new Set(["marketNews", "coinPrices", "aiInsight", "meme"]);

router.post("/", requireAuth, (req, res) => {
  const { section, itemKey, vote } = req.body || {};
  if (!VALID_SECTIONS.has(section) || !itemKey || ![1, -1].includes(vote)) {
    return res.status(400).json({
      error: "section (one of marketNews/coinPrices/aiInsight/meme), itemKey, and vote (1 or -1) are required",
    });
  }

  db.prepare(
    `INSERT INTO votes (user_id, section, item_key, vote) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, section, item_key) DO UPDATE SET vote = excluded.vote, created_at = datetime('now')`
  ).run(req.user.id, section, itemKey, vote);

  res.json({ ok: true });
});

module.exports = router;
