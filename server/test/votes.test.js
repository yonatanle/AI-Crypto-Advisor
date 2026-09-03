const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestApp } = require("./support/helpers");

const { ready, teardown } = startTestApp("moveo_test_votes");

test("votes routes", async (t) => {
  const baseUrl = await ready;

  try {
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "voter@test.com", name: "Voter", password: "password123" }),
    });
    const { token } = await registerRes.json();

    function vote(body) {
      return fetch(`${baseUrl}/api/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
    }

    await t.test("vote requires auth", async () => {
      const res = await fetch(`${baseUrl}/api/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "meme", itemKey: "abc", vote: 1 }),
      });
      assert.equal(res.status, 401);
    });

    await t.test("vote rejects an invalid section", async () => {
      const res = await vote({ section: "notASection", itemKey: "abc", vote: 1 });
      assert.equal(res.status, 400);
    });

    await t.test("vote rejects an invalid vote value", async () => {
      const res = await vote({ section: "meme", itemKey: "abc", vote: 5 });
      assert.equal(res.status, 400);
    });

    await t.test("vote rejects an empty itemKey", async () => {
      const res = await vote({ section: "meme", itemKey: "", vote: 1 });
      assert.equal(res.status, 400);
    });

    await t.test("vote rejects an oversized itemKey", async () => {
      const res = await vote({ section: "meme", itemKey: "x".repeat(201), vote: 1 });
      assert.equal(res.status, 400);
    });

    await t.test("vote accepts a valid vote", async () => {
      const res = await vote({ section: "meme", itemKey: "meme-1", vote: 1 });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
    });

    await t.test("re-voting the same item updates it in place instead of duplicating", async () => {
      await vote({ section: "meme", itemKey: "meme-toggle", vote: 1 });
      const res = await vote({ section: "meme", itemKey: "meme-toggle", vote: -1 });
      assert.equal(res.status, 200);

      const db = require("../src/db");
      const { rows } = await db.query(
        "SELECT vote FROM votes v JOIN users u ON u.id = v.user_id WHERE u.email = $1 AND item_key = $2",
        ["voter@test.com", "meme-toggle"]
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].vote, -1);
    });
  } finally {
    await teardown();
  }
});
