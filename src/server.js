// Entry point: wires config -> database -> app, then listens.

import { config } from "./config.js";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";

const db = openDatabase(config.databasePath);
const app = createApp({ db, aiConfig: config.ai });

const server = app.listen(config.port, () => {
  console.log(`Vía Verde running on http://localhost:${config.port}`);
  console.log(
    config.ai.enabled
      ? `AI coach: enabled (model ${config.ai.model})`
      : "AI coach: fallback (no AI_API_KEY set) — the app works fully offline",
  );
});

// Close cleanly so Docker stop / Ctrl-C doesn't leave the DB locked.
function shutdown() {
  console.log("Shutting down…");
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
