// Business logic for trips. Routes call this; this calls the db and the
// emissions domain. Views/routes never run SQL themselves.

import { assessTrip } from "./emissions.js";

export class TripService {
  /** @param {import("better-sqlite3").Database} db */
  constructor(db) {
    this.db = db;
    this._insert = db.prepare(`
      INSERT INTO trips
        (created_at, origin, destination, distance_km, mode,
         co2_g, best_alt_mode, best_alt_co2_g, co2_saved_g)
      VALUES
        (@created_at, @origin, @destination, @distance_km, @mode,
         @co2_g, @best_alt_mode, @best_alt_co2_g, @co2_saved_g)
    `);
    this._listRecent = db.prepare(
      `SELECT * FROM trips ORDER BY id DESC LIMIT @limit`,
    );
    this._stats = db.prepare(`
      SELECT
        COUNT(*)                     AS trip_count,
        COALESCE(SUM(distance_km),0) AS total_distance_km,
        COALESCE(SUM(co2_g),0)       AS total_co2_g,
        COALESCE(SUM(co2_saved_g),0) AS total_co2_saved_g
      FROM trips
    `);
  }

  /**
   * Assess a trip, persist it, and return the saved row plus the assessment.
   * @param {{distanceKm:number, mode:string, origin?:string, destination?:string}} input
   */
  logTrip({ distanceKm, mode, origin = null, destination = null }) {
    const assessment = assessTrip(distanceKm, mode); // throws on bad input
    const best = assessment.best_alternative;

    const row = {
      created_at: new Date().toISOString(),
      origin,
      destination,
      distance_km: distanceKm,
      mode,
      co2_g: assessment.co2_g,
      best_alt_mode: best ? best.mode : null,
      best_alt_co2_g: best ? best.co2_g : null,
      co2_saved_g: best ? best.co2_saved_g : 0,
    };

    const result = this._insert.run(row);
    return {
      trip: { id: Number(result.lastInsertRowid), ...row },
      assessment,
    };
  }

  /** @param {number} limit */
  recentTrips(limit = 20) {
    return this._listRecent.all({ limit });
  }

  stats() {
    const s = this._stats.get();
    return {
      trip_count: s.trip_count,
      total_distance_km: Number(s.total_distance_km),
      total_co2_g: Number(s.total_co2_g),
      total_co2_saved_g: Number(s.total_co2_saved_g),
      total_co2_kg: Number((s.total_co2_g / 1000).toFixed(2)),
      total_co2_saved_kg: Number((s.total_co2_saved_g / 1000).toFixed(2)),
    };
  }
}
