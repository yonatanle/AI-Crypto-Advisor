const app = require("./app");
const db = require("./db");

const PORT = process.env.PORT || 4000;

db.ready
  .then(() => app.listen(PORT, () => console.log(`Server listening on port ${PORT}`)))
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
