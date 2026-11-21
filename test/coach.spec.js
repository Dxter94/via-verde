import { describe, it, expect, vi } from "vitest";
import { coachMessage, fallbackCoach } from "../src/services/coach.js";
import { assessTrip } from "../src/services/emissions.js";

const assessment = assessTrip(10, "car");

describe("coach", () => {
  it("uses the rule-based fallback when AI is disabled", async () => {
    const res = await coachMessage(assessment, { enabled: false });
    expect(res.source).toBe("fallback");
    expect(res.message).toBe(fallbackCoach(assessment));
  });

  it("uses the AI message when the endpoint answers", async () => {
    const fakeFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Try the train! 🚆" } }],
      }),
    }));
    const res = await coachMessage(
      assessment,
      { enabled: true, apiKey: "k", baseUrl: "https://x/v1", model: "m" },
      fakeFetch,
    );
    expect(res.source).toBe("ai");
    expect(res.message).toBe("Try the train! 🚆");
    expect(fakeFetch).toHaveBeenCalledOnce();
  });

  it("falls back silently when the endpoint errors", async () => {
    const fakeFetch = vi.fn(async () => ({ ok: false, status: 500 }));
    const res = await coachMessage(
      assessment,
      { enabled: true, apiKey: "k", baseUrl: "https://x/v1", model: "m" },
      fakeFetch,
    );
    expect(res.source).toBe("fallback");
    expect(res.message).toBe(fallbackCoach(assessment));
  });
});
