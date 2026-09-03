const path = require("node:path");
const fs = require("node:fs");

// Each test file calls this once, before requiring src/app, since DB_PATH
// must be set before src/db is first required (its connection is opened
// at module-load time and cached for the process).
function startTestApp(dbFileName) {
  const dbPath = path.join(__dirname, "..", dbFileName);
  fs.rmSync(dbPath, { force: true });
  process.env.DB_PATH = dbPath;
  process.env.JWT_SECRET = "test-secret";

  const app = require("../../src/app");
  const server = app.listen(0);

  const ready = new Promise((resolve) => server.once("listening", resolve)).then(
    () => `http://localhost:${server.address().port}`
  );

  async function teardown() {
    await new Promise((resolve) => server.close(resolve));
    require("../../src/db").close();
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(`${dbPath}-shm`, { force: true });
    fs.rmSync(`${dbPath}-wal`, { force: true });
  }

  return { ready, teardown };
}

module.exports = { startTestApp };
