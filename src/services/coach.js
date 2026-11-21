// The generative-AI "coach".
//
// This is where Vía Verde actually USES generative AI inside the product:
// it turns the dry numbers of a trip assessment into one short, encouraging
// nudge toward a greener option.
//
// Design decision (documented in the README): the coach degrades gracefully.
// With no AI_API_KEY set, the app is fully usable and returns a rule-based
// message. That keeps the MVP runnable on a clean machine with zero secrets,
// while still demonstrating a real genAI integration when a key is provided.

/**
 * Build the fallback message with no AI. Deterministic, so it is easy to test.
 * @param {object} assessment - output of assessTrip()
 */
export function fallbackCoach(assessment) {
  const { mode_label, co2_g, best_alternative } = assessment;
  const kg = (co2_g / 1000).toFixed(2);

  if (!best_alternative) {
    return `Nice — ${mode_label.toLowerCase()} is already one of the greenest ways to make this trip. That's about ${kg} kg of CO₂. Keep it up! 🌱`;
  }

  const savedKg = (best_alternative.co2_saved_g / 1000).toFixed(2);
  return `This ${mode_label.toLowerCase()} trip is about ${kg} kg of CO₂. Switching to ${best_alternative.label.toLowerCase()} would cut roughly ${savedKg} kg — a greener way to get there. 🚲`;
}

/**
 * Ask an OpenAI-compatible Chat Completions endpoint for a nudge.
 * Any failure (no key, network error, bad response) falls back to the
 * rule-based message, so a coach message is ALWAYS returned.
 *
 * @param {object} assessment - output of assessTrip()
 * @param {object} aiConfig - config.ai ({ apiKey, baseUrl, model, enabled })
 * @param {typeof fetch} [fetchImpl] - injectable for tests
 * @returns {Promise<{ message: string, source: "ai" | "fallback" }>}
 */
export async function coachMessage(assessment, aiConfig, fetchImpl = fetch) {
  if (!aiConfig || !aiConfig.enabled) {
    return { message: fallbackCoach(assessment), source: "fallback" };
  }

  const prompt = buildPrompt(assessment);

  try {
    const res = await fetchImpl(`${aiConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        max_tokens: 120,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are Vía Verde, a friendly sustainable-mobility coach. " +
              "Reply with ONE short, warm sentence (max 240 characters) " +
              "nudging the user toward a greener trip. No lists, no preamble. " +
              "You may use a single emoji.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) throw new Error(`AI endpoint returned ${res.status}`);

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("AI endpoint returned no message");

    return { message: text, source: "ai" };
  } catch {
    // Never let the coach break the request. Fall back silently.
    return { message: fallbackCoach(assessment), source: "fallback" };
  }
}

function buildPrompt(assessment) {
  const { mode_label, distance_km, co2_g, best_alternative } = assessment;
  const lines = [
    `Trip: ${distance_km} km by ${mode_label}.`,
    `Estimated CO₂: ${(co2_g / 1000).toFixed(2)} kg.`,
  ];
  if (best_alternative) {
    lines.push(
      `Greenest alternative: ${best_alternative.label} ` +
        `(saves ~${(best_alternative.co2_saved_g / 1000).toFixed(2)} kg).`,
    );
  } else {
    lines.push("This is already one of the greenest options.");
  }
  return lines.join(" ");
}
