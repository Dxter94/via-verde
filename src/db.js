// SQLite access layer. This is the ONLY module that knows SQL.
// Services talk to this file; routes talk to services. Nothing else touches
// the database directly.

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS trips (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at      TEXT    NOT NULL,
  origin          TEXT,
  destination     TEXT,
  distance_km     REAL    NOT NULL,
  mode            TEXT    NOT NULL,
  co2_g           REAL    NOT NULL,
  best_alt_mode   TEXT,
  best_alt_co2_g  REAL,
  co2_saved_g     REAL    NOT NULL DEFAULT 0
);
`;

/**
 * Open (or create) a database and make sure the schema exists.
 * Pass ":memory:" for tests.
 *
 * @param {string} path - file path or ":memory:"
 * @returns {import("better-sqlite3").Database}
 */
export function openDatabase(path) {
  if (path && path !== ":memory:") {
    // Ensure the folder exists on a clean machine before SQLite opens the file.
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}
