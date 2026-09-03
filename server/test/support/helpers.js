const { Client } = require("pg");

const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL || "postgres://postgres:devpassword@localhost:5437/postgres";

// Each test file gets its own throwaway Postgres database (created here,
// dropped in teardown) so the two test files can run as separate processes
// without stepping on each other's data.
function startTestApp(testDbName) {
  let server;
  let adminClient;

  const ready = (async () => {
    adminClient = new Client({ connectionString: ADMIN_URL });
    await adminClient.connect();
    await adminClient.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    await adminClient.query(`CREATE DATABASE ${testDbName}`);

    const base = new URL(ADMIN_URL);
    base.pathname = `/${testDbName}`;
    process.env.DATABASE_URL = base.toString();
    process.env.JWT_SECRET = "test-secret";

    const app = require("../../src/app");
    const db = require("../../src/db");
    await db.ready;

    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    return `http://localhost:${server.address().port}`;
  })();

  async function teardown() {
    await new Promise((resolve) => server.close(resolve));
    await require("../../src/db").close();
    await adminClient.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    await adminClient.end();
  }

  return { ready, teardown };
}

module.exports = { startTestApp };
