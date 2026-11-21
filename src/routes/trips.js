// REST routes for trips. Thin layer: validate input, call the service,
// shape the JSON response. No SQL, no emission maths here.

import { Router } from "express";
import {
  SUPPORTED_MODES,
  MODE_LABELS,
  isSupportedMode,
} from "../services/emissions.js";
import { coachMessage } from "../services/coach.js";

/**
 * @param {object} deps
 * @param {import("../services/tripService.js").TripService} deps.tripService
 * @param {object} deps.aiConfig
 */
export function createTripsRouter({ tripService, aiConfig }) {
  const router = Router();

  // The modes the UI can offer, with labels. Handy for building the form.
  router.get("/modes", (_req, res) => {
    res.json(
      SUPPORTED_MODES.map((mode) => ({ mode, label: MODE_LABELS[mode] })),
    );
  });

  // Create + assess a trip, and return the AI (or fallback) coach message.
  router.post("/trips", async (req, res) => {
    const { distance_km, mode, origin, destination } = req.body || {};

    const distance = Number(distance_km);
    if (!Number.isFinite(distance) || distance <= 0) {
      return res
        .status(400)
        .json({ error: "distance_km must be a positive number" });
    }
    if (!isSupportedMode(mode)) {
      return res.status(400).json({
        error: `mode must be one of: ${SUPPORTED_MODES.join(", ")}`,
      });
    }

    const { trip, assessment } = tripService.logTrip({
      distanceKm: distance,
      mode,
      origin: origin?.toString().trim() || null,
      destination: destination?.toString().trim() || null,
    });

    const coach = await coachMessage(assessment, aiConfig);

    res.status(201).json({ trip, assessment, coach });
  });

  // Recent trips (most recent first).
  router.get("/trips", (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    res.json(tripService.recentTrips(limit));
  });

  // Running totals, including the headline: CO2 avoided.
  router.get("/stats", (_req, res) => {
    res.json(tripService.stats());
  });

  return router;
}
