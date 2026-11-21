import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { openDatabase } from "../src/db.js";
import { createApp } from "../src/app.js";

// aiConfig with enabled=false so the coach uses the deterministic fallback
// and the tests never hit the network.
const aiConfig = { apiKey: "", baseUrl: "", model: "", enabled: false };

describe("API", () => {
  let app;

  beforeEach(() => {
    const db = openDatabase(":memory:");
    app = createApp({ db, aiConfig });
  });

  it("GET /api/health returns ok and fallback coach", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.ai_coach).toBe("fallback");
  });

  it("GET /api/modes lists supported modes", async () => {
    const res = await request(app).get("/api/modes");
    expect(res.status).toBe(200);
    expect(res.body.find((m) => m.mode === "car")).toBeTruthy();
  });

  it("POST /api/trips creates a trip and returns a coach message", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({ distance_km: 10, mode: "car", origin: "A", destination: "B" });
    expect(res.status).toBe(201);
    expect(res.body.trip.id).toBe(1);
    expect(res.body.assessment.best_alternative).toBeTruthy();
    expect(res.body.coach.source).toBe("fallback");
    expect(typeof res.body.coach.message).toBe("string");
  });

  it("POST /api/trips validates distance", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({ distance_km: -2, mode: "car" });
    expect(res.status).toBe(400);
  });

  it("POST /api/trips validates mode", async () => {
    const res = await request(app)
      .post("/api/trips")
      .send({ distance_km: 5, mode: "rocket" });
    expect(res.status).toBe(400);
  });

  it("GET /api/stats reflects created trips", async () => {
    await request(app).post("/api/trips").send({ distance_km: 10, mode: "car" });
    await request(app).post("/api/trips").send({ distance_km: 4, mode: "bus" });
    const res = await request(app).get("/api/stats");
    expect(res.body.trip_count).toBe(2);
    expect(res.body.total_co2_saved_g).toBeGreaterThan(0);
  });
});
