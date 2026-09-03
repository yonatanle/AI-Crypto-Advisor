const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestApp } = require("./support/helpers");

const { ready, teardown } = startTestApp("tmp-auth.sqlite");

function register(baseUrl, body) {
  return fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function login(baseUrl, body) {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("auth routes", async (t) => {
  const baseUrl = await ready;

  try {
    await t.test("register rejects an invalid email", async () => {
      const res = await register(baseUrl, { email: "not-an-email", name: "Test", password: "password123" });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error, /email/i);
    });

    await t.test("register rejects an empty name", async () => {
      const res = await register(baseUrl, { email: "empty-name@test.com", name: "", password: "password123" });
      assert.equal(res.status, 400);
    });

    await t.test("register rejects an oversized name", async () => {
      const res = await register(baseUrl, {
        email: "long-name@test.com",
        name: "a".repeat(101),
        password: "password123",
      });
      assert.equal(res.status, 400);
    });

    await t.test("register rejects a short password", async () => {
      const res = await register(baseUrl, { email: "short-pw@test.com", name: "Test", password: "abc" });
      assert.equal(res.status, 400);
    });

    await t.test("register succeeds with valid input and returns a token and user", async () => {
      const res = await register(baseUrl, { email: "valid@test.com", name: "Test", password: "password123" });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(typeof body.token, "string");
      assert.ok(body.token.length > 0);
      assert.equal(typeof body.user.id, "number");
      assert.equal(body.user.email, "valid@test.com");
      assert.equal(body.user.name, "Test");
      assert.equal(body.user.password_hash, undefined);
    });

    await t.test("register rejects a duplicate email", async () => {
      await register(baseUrl, { email: "dupe@test.com", name: "Test", password: "password123" });
      const res = await register(baseUrl, { email: "dupe@test.com", name: "Test2", password: "password123" });
      assert.equal(res.status, 409);
    });

    await t.test("login succeeds with correct credentials", async () => {
      await register(baseUrl, { email: "login@test.com", name: "Test", password: "password123" });
      const res = await login(baseUrl, { email: "login@test.com", password: "password123" });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(typeof body.token, "string");
      assert.equal(body.user.email, "login@test.com");
    });

    await t.test("login rejects a wrong password", async () => {
      await register(baseUrl, { email: "wrongpw@test.com", name: "Test", password: "password123" });
      const res = await login(baseUrl, { email: "wrongpw@test.com", password: "wrongpassword" });
      assert.equal(res.status, 401);
    });

    await t.test("login rejects an unknown email", async () => {
      const res = await login(baseUrl, { email: "doesnotexist@test.com", password: "password123" });
      assert.equal(res.status, 401);
    });
  } finally {
    await teardown();
  }
});
