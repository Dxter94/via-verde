// Builds the Express app WITHOUT starting a server. This split lets the tests
// import a ready-to-use app with an in-memory database, and lets server.js own
// the "listen" part. (A common, testable pattern.)

import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { TripService } from "./services/tripService.js";
import { createTripsRouter } from "./routes/trips.js";
import { createHealthRouter } from "./routes/health.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

/**
 * @param {object} deps
 * @param {import("better-sqlite3").Database} deps.db
 * @param {object} deps.aiConfig - config.ai
 */
export function createApp({ db, aiConfig }) {
  const app = express();
  app.use(express.json());

  const tripService = new TripService(db);

  app.use("/api", createHealthRouter({ aiConfig }));
  app.use("/api", createTripsRouter({ tripService, aiConfig }));

  // Serve the tiny frontend.
  app.use(express.static(PUBLIC_DIR));

  return app;
}
