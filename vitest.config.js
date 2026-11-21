import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.spec.js"],
    // Each test file gets its own fresh in-memory / temp database, so we run
    // files sequentially-friendly. Vitest isolates modules per file by default.
  },
});
