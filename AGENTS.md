# AGENTS.md

This repository follows the [AGENTS.md](https://agents.md) convention for AI
coding agents. The full, authoritative guidance lives in **[CLAUDE.md](./CLAUDE.md)** —
this file is a short pointer so any agent (not just Claude) finds the rules.

## The short version

- **Stack:** Node.js 20 (ESM) + Express + better-sqlite3, vanilla JS frontend,
  Vitest, Docker. It is a Level-1 MVP: keep it simple.
- **Layering:** `routes -> services -> db`. Routes validate and shape JSON only.
  `db.js` owns all SQL. `config.js` owns all `process.env` access.
  `emissions.js` is pure (no I/O).
- **Run everything in Docker:** `docker compose up`, tests with
  `docker compose run --rm web npm test`.
- **Secrets:** never commit `.env`; document every variable in `.env.example`.
  The AI coach must always fall back to the rule-based message on any error.
- **Git:** branch off `develop`, Conventional Commits, ask before pushing/PR.

If anything here is unclear, read `CLAUDE.md` before making changes.
