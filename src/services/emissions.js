// Emissions domain logic for Vía Verde.
//
// IMPORTANT / HONEST NOTE:
// These factors are *illustrative defaults* in grams of CO2-equivalent per
// passenger-kilometre. They are rounded, commonly-cited lifecycle/operational
// figures — good enough for an MVP that helps people compare modes, NOT a
// certified carbon-accounting tool. They live in one place on purpose so they
// are easy to review and swap for official local data later.

/** @typedef {"walk"|"bike"|"ebike"|"escooter"|"bus"|"metro"|"train"|"carpool"|"ev"|"car"|"motorbike"} Mode */

/** gCO2e per passenger-km. Lower is greener. */
export const EMISSION_FACTORS = Object.freeze({
  walk: 0,
  bike: 0,
  ebike: 8,
  escooter: 25,
  metro: 30,
  train: 35,
  bus: 80,
  carpool: 60, // a petrol car shared ~3 ways
  ev: 55, // electric car, average grid
  car: 170, // petrol car, single occupant
  motorbike: 100,
});

/** Human-friendly labels, used by the API and UI. */
export const MODE_LABELS = Object.freeze({
  walk: "Walking",
  bike: "Cycling",
  ebike: "E-bike",
  escooter: "E-scooter",
  metro: "Metro / Tram",
  train: "Train",
  bus: "Bus",
  carpool: "Carpool (car shared)",
  ev: "Electric car",
  car: "Car (petrol)",
  motorbike: "Motorbike",
});

export const SUPPORTED_MODES = Object.freeze(Object.keys(EMISSION_FACTORS));

export function isSupportedMode(mode) {
  return Object.prototype.hasOwnProperty.call(EMISSION_FACTORS, mode);
}

/**
 * CO2 for a single trip, in grams, rounded to a whole gram.
 * @param {number} distanceKm
 * @param {Mode} mode
 */
export function co2ForTrip(distanceKm, mode) {
  if (!isSupportedMode(mode)) {
    throw new Error(`Unsupported mode: ${mode}`);
  }
  if (!(distanceKm > 0)) {
    throw new Error("distanceKm must be a positive number");
  }
  return Math.round(distanceKm * EMISSION_FACTORS[mode]);
}

/**
 * Given a trip, return every alternative that is greener than the chosen mode,
 * each with its CO2 and the grams saved, sorted greenest-first.
 * @param {number} distanceKm
 * @param {Mode} chosenMode
 */
export function greenerAlternatives(distanceKm, chosenMode) {
  const chosenCo2 = co2ForTrip(distanceKm, chosenMode);
  return SUPPORTED_MODES.filter((mode) => mode !== chosenMode)
    .map((mode) => {
      const co2 = co2ForTrip(distanceKm, mode);
      return {
        mode,
        label: MODE_LABELS[mode],
        co2_g: co2,
        co2_saved_g: Math.max(0, chosenCo2 - co2),
      };
    })
    .filter((alt) => alt.co2_saved_g > 0)
    .sort((a, b) => a.co2_g - b.co2_g);
}

/**
 * Full assessment of a trip: its own CO2, the greener options, and the single
 * best (greenest) alternative, if any.
 * @param {number} distanceKm
 * @param {Mode} mode
 */
export function assessTrip(distanceKm, mode) {
  const co2_g = co2ForTrip(distanceKm, mode);
  const alternatives = greenerAlternatives(distanceKm, mode);
  const best = alternatives[0] || null;
  return {
    distance_km: distanceKm,
    mode,
    mode_label: MODE_LABELS[mode],
    co2_g,
    alternatives,
    best_alternative: best,
  };
}
