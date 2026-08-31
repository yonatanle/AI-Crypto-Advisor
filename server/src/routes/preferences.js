const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM preferences WHERE user_id = ?").get(req.user.id);
  if (!row) return res.json({ preferences: null });

  res.json({
    preferences: {
      assets: JSON.parse(row.assets),
      investorType: row.investor_type,
      contentTypes: JSON.parse(row.content_types),
    },
  });
});

router.post("/", requireAuth, (req, res) => {
  const { assets, investorType, contentTypes } = req.body || {};
  if (!Array.isArray(assets) || !investorType || !Array.isArray(contentTypes)) {
    return res.status(400).json({ error: "assets (array), investorType, contentTypes (array) are required" });
  }

  const existing = db.prepare("SELECT id FROM preferences WHERE user_id = ?").get(req.user.id);
  if (existing) {
    db.prepare(
      `UPDATE preferences SET assets = ?, investor_type = ?, content_types = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(JSON.stringify(assets), investorType, JSON.stringify(contentTypes), req.user.id);
  } else {
    db.prepare(
      `INSERT INTO preferences (user_id, assets, investor_type, content_types) VALUES (?, ?, ?, ?)`
    ).run(req.user.id, JSON.stringify(assets), investorType, JSON.stringify(contentTypes));
  }

  res.json({ preferences: { assets, investorType, contentTypes } });
});

module.exports = router;
