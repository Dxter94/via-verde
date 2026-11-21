// Tiny vanilla-JS frontend. No framework on purpose: this is an MVP, and the
// whole UI is three fetch calls.

const api = {
  modes: () => fetch("/api/modes").then((r) => r.json()),
  stats: () => fetch("/api/stats").then((r) => r.json()),
  trips: () => fetch("/api/trips?limit=10").then((r) => r.json()),
  createTrip: (body) =>
    fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Request failed");
      return data;
    }),
};

const form = document.getElementById("trip-form");
const modeSelect = document.getElementById("mode-select");
const resultEl = document.getElementById("result");
const statsEl = document.getElementById("stats");
const tripsEl = document.getElementById("trips");

const kg = (grams) => (grams / 1000).toFixed(2);

async function loadModes() {
  const modes = await api.modes();
  modeSelect.innerHTML = modes
    .map((m) => `<option value="${m.mode}">${m.label}</option>`)
    .join("");
  // Default to car so the "greener alternative" message is meaningful.
  if (modes.some((m) => m.mode === "car")) modeSelect.value = "car";
}

async function loadStats() {
  const s = await api.stats();
  statsEl.innerHTML = `
    <div class="stat">
      <div class="value">${s.total_co2_saved_kg} kg</div>
      <div class="label">CO₂ you could avoid</div>
    </div>
    <div class="stat">
      <div class="value">${s.trip_count}</div>
      <div class="label">trips planned</div>
    </div>
    <div class="stat">
      <div class="value">${s.total_distance_km.toFixed(1)} km</div>
      <div class="label">total distance</div>
    </div>`;
}

async function loadTrips() {
  const trips = await api.trips();
  if (!trips.length) {
    tripsEl.innerHTML = `<li class="muted">No trips yet — plan one above.</li>`;
    return;
  }
  tripsEl.innerHTML = trips
    .map((t) => {
      const route =
        t.origin || t.destination
          ? `${t.origin || "?"} → ${t.destination || "?"}`
          : "Trip";
      return `<li>
        <span>${route} · ${t.distance_km} km · ${t.mode}</span>
        <span class="muted">${kg(t.co2_g)} kg CO₂</span>
      </li>`;
    })
    .join("");
}

function showResult(data) {
  const { assessment, coach } = data;
  const tagClass = coach.source === "ai" ? "" : "fallback";
  const tagText = coach.source === "ai" ? "AI coach" : "coach";
  const detail = assessment.best_alternative
    ? `Greenest alternative: <strong>${assessment.best_alternative.label}</strong> — saves ~${kg(assessment.best_alternative.co2_saved_g)} kg CO₂.`
    : `This is already one of the greenest options. 🎉`;

  resultEl.innerHTML = `
    <p class="coach">${coach.message}<span class="tag ${tagClass}">${tagText}</span></p>
    <p class="detail">This trip: <strong>${kg(assessment.co2_g)} kg CO₂</strong> by ${assessment.mode_label}.</p>
    <p class="detail">${detail}</p>`;
  resultEl.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  try {
    const data = await api.createTrip({
      origin: fd.get("origin"),
      destination: fd.get("destination"),
      distance_km: fd.get("distance_km"),
      mode: fd.get("mode"),
    });
    showResult(data);
    await Promise.all([loadStats(), loadTrips()]);
  } catch (err) {
    resultEl.innerHTML = `<p class="detail">⚠️ ${err.message}</p>`;
    resultEl.classList.remove("hidden");
  }
});

// Initial load.
loadModes();
loadStats();
loadTrips();
