const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { SECTIONS, VALID_SECTIONS } = require("../constants");

const router = express.Router();

router.post("/", requireAuth, (req, res) => {
  const { section, itemKey, vote } = req.body || {};
  if (!VALID_SECTIONS.has(section) || !itemKey || ![1, -1].includes(vote)) {
    return res.status(400).json({
      error: `section (one of ${Object.values(SECTIONS).join("/")}), itemKey, and vote (1 or -1) are required`,
    });
  }

  // One vote per (user, section, item): re-voting on the same item updates
  // it in place instead of piling up duplicate rows.
  db.prepare(
    `INSERT INTO votes (user_id, section, item_key, vote) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, section, item_key) DO UPDATE SET vote = excluded.vote, created_at = datetime('now')`
  ).run(req.user.id, section, itemKey, vote);

  res.json({ ok: true });
});

module.exports = router;
