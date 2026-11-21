import { describe, it, expect } from "vitest";
import {
  co2ForTrip,
  greenerAlternatives,
  assessTrip,
  EMISSION_FACTORS,
} from "../src/services/emissions.js";

describe("co2ForTrip", () => {
  it("multiplies distance by the mode factor and rounds to grams", () => {
    expect(co2ForTrip(10, "car")).toBe(10 * EMISSION_FACTORS.car);
    expect(co2ForTrip(5, "bus")).toBe(5 * EMISSION_FACTORS.bus);
  });

  it("returns 0 for zero-emission modes", () => {
    expect(co2ForTrip(12, "walk")).toBe(0);
    expect(co2ForTrip(12, "bike")).toBe(0);
  });

  it("rejects unsupported modes", () => {
    expect(() => co2ForTrip(10, "teleport")).toThrow(/Unsupported mode/);
  });

  it("rejects non-positive distances", () => {
    expect(() => co2ForTrip(0, "car")).toThrow();
    expect(() => co2ForTrip(-3, "car")).toThrow();
  });
});

describe("greenerAlternatives", () => {
  it("only returns modes that save CO2, greenest first", () => {
    const alts = greenerAlternatives(10, "car");
    expect(alts.length).toBeGreaterThan(0);
    // Every alternative must actually save something.
    expect(alts.every((a) => a.co2_saved_g > 0)).toBe(true);
    // Sorted greenest (lowest CO2) first.
    const co2s = alts.map((a) => a.co2_g);
    expect(co2s).toEqual([...co2s].sort((a, b) => a - b));
    // Walking should be in there and save the full car emissions.
    const walk = alts.find((a) => a.mode === "walk");
    expect(walk.co2_saved_g).toBe(co2ForTrip(10, "car"));
  });

  it("returns an empty list for the greenest mode", () => {
    expect(greenerAlternatives(10, "walk")).toEqual([]);
  });
});

describe("assessTrip", () => {
  it("reports the best alternative", () => {
    const a = assessTrip(8, "car");
    expect(a.co2_g).toBe(co2ForTrip(8, "car"));
    expect(a.best_alternative.co2_g).toBeLessThan(a.co2_g);
  });

  it("has no best alternative when already greenest", () => {
    const a = assessTrip(8, "walk");
    expect(a.best_alternative).toBeNull();
  });
});
