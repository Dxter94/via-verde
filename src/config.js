// Central place to read environment variables, so the rest of the app never
// touches process.env directly. Keeps configuration honest and testable.

export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 3000,
    databasePath: env.DATABASE_PATH || "./data/via-verde.sqlite",
    ai: {
      apiKey: env.AI_API_KEY || "",
      baseUrl: (env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
      model: env.AI_MODEL || "gpt-4o-mini",
      // The coach is only "enabled" when there is a key to use.
      get enabled() {
        return Boolean(this.apiKey);
      },
    },
  };
}

export const config = loadConfig();
