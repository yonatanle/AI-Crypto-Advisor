const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const { rows } = await db.query("SELECT * FROM preferences WHERE user_id = $1", [req.user.id]);
  const row = rows[0];
  if (!row) return res.json({ preferences: null });

  res.json({
    preferences: {
      assets: JSON.parse(row.assets),
      investorType: row.investor_type,
      contentTypes: JSON.parse(row.content_types),
    },
  });
});

router.post("/", requireAuth, async (req, res) => {
  const { assets, investorType, contentTypes } = req.body || {};
  if (!Array.isArray(assets) || !investorType || !Array.isArray(contentTypes)) {
    return res.status(400).json({ error: "assets (array), investorType, contentTypes (array) are required" });
  }

  const { rows: existing } = await db.query("SELECT id FROM preferences WHERE user_id = $1", [req.user.id]);
  if (existing.length) {
    await db.query(
      `UPDATE preferences SET assets = $1, investor_type = $2, content_types = $3, updated_at = now()
       WHERE user_id = $4`,
      [JSON.stringify(assets), investorType, JSON.stringify(contentTypes), req.user.id]
    );
  } else {
    await db.query(
      `INSERT INTO preferences (user_id, assets, investor_type, content_types) VALUES ($1, $2, $3, $4)`,
      [req.user.id, JSON.stringify(assets), investorType, JSON.stringify(contentTypes)]
    );
  }

  res.json({ preferences: { assets, investorType, contentTypes } });
});

module.exports = router;
