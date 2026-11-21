import { Router } from "express";

/** Liveness probe. Also reports whether the AI coach is configured. */
export function createHealthRouter({ aiConfig }) {
  const router = Router();
  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      ai_coach: aiConfig?.enabled ? "enabled" : "fallback",
      time: new Date().toISOString(),
    });
  });
  return router;
}
