import { describe, it, expect, beforeEach } from "vitest";
import { openDatabase } from "../src/db.js";
import { TripService } from "../src/services/tripService.js";

describe("TripService", () => {
  /** @type {TripService} */
  let service;

  beforeEach(() => {
    const db = openDatabase(":memory:");
    service = new TripService(db);
  });

  it("logs a trip and computes CO2 + savings", () => {
    const { trip, assessment } = service.logTrip({
      distanceKm: 10,
      mode: "car",
      origin: "Home",
      destination: "Work",
    });
    expect(trip.id).toBe(1);
    expect(trip.co2_g).toBeGreaterThan(0);
    expect(trip.co2_saved_g).toBe(assessment.best_alternative.co2_saved_g);
    expect(trip.best_alt_mode).toBe(assessment.best_alternative.mode);
  });

  it("records zero savings for an already-green trip", () => {
    const { trip } = service.logTrip({ distanceKm: 3, mode: "walk" });
    expect(trip.co2_g).toBe(0);
    expect(trip.co2_saved_g).toBe(0);
    expect(trip.best_alt_mode).toBeNull();
  });

  it("aggregates stats across trips", () => {
    service.logTrip({ distanceKm: 10, mode: "car" });
    service.logTrip({ distanceKm: 5, mode: "bus" });
    const s = service.stats();
    expect(s.trip_count).toBe(2);
    expect(s.total_distance_km).toBe(15);
    expect(s.total_co2_saved_g).toBeGreaterThan(0);
  });

  it("returns recent trips most-recent-first", () => {
    service.logTrip({ distanceKm: 1, mode: "car" });
    service.logTrip({ distanceKm: 2, mode: "car" });
    const recent = service.recentTrips(10);
    expect(recent[0].distance_km).toBe(2);
    expect(recent[1].distance_km).toBe(1);
  });

  it("throws on invalid input (so the route can return 400)", () => {
    expect(() => service.logTrip({ distanceKm: -1, mode: "car" })).toThrow();
    expect(() => service.logTrip({ distanceKm: 5, mode: "nope" })).toThrow();
  });
});
