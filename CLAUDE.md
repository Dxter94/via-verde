# CLAUDE.md

Guidance for Claude (and any coding agent) when working in this repository.

## Project overview

**Vía Verde** — "Pick the greener way to get there." A tiny web app that estimates
a trip's CO₂, suggests greener alternatives, logs each trip in SQLite, and keeps
a running total of the emissions you could avoid. A generative-AI "coach" turns
the numbers into a short, friendly nudge, and degrades gracefully to a
rule-based message when no API key is configured.

This is a **Level-1 MVP** in the course's progression map: a single service on a
basic stack (Node.js + SQLite). No auth, no payments — those are deliberately
left for later (see the README).

## Stack

- Node.js 20 (ESM, `"type": "module"`)
- Express 4 (HTTP + static file serving)
- better-sqlite3 (synchronous SQLite; the only persistence)
- Vanilla HTML/CSS/JS frontend in `public/` (no build step)
- Vitest + Supertest for tests
- Docker + docker compose (all commands run inside containers)
- Optional: any OpenAI-compatible Chat Completions endpoint for the AI coach

## Architecture

```
src/
  server.js              # entry point: config -> db -> app -> listen
  app.js                 # builds the Express app WITHOUT listening (testable)
  config.js              # the ONLY module that reads process.env
  db.js                  # the ONLY module that runs SQL / owns the schema
  services/
    emissions.js         # domain logic: CO2 factors, comparisons (pure, no I/O)
    coach.js             # generative-AI nudge + deterministic fallback
    tripService.js       # business logic: log a trip, list trips, aggregate stats
  routes/
    trips.js             # REST: /api/modes, /api/trips, /api/stats
    health.js            # /api/health
public/                  # index.html, styles.css, app.js (the frontend)
test/                    # *.spec.js — Vitest + Supertest
data/                    # runtime SQLite file lives here (git-ignored)
```

### Rules

- **Data flow:** `routes -> services -> db`. Routes never run SQL and never do
  emission maths; they validate input, call a service, and shape JSON.
- `config.js` is the only place that reads `process.env`. Everything else takes
  config as an argument.
- `db.js` is the only place with SQL. Services use `TripService`, not raw queries.
- `emissions.js` is **pure** (no I/O): easy to unit-test. Emission factors are
  illustrative defaults, kept in one object so they are easy to review/replace.
- The AI coach must **never break a request**: any error falls back to the
  rule-based message. A coach message is always returned.
- No secrets in code. Read them from the environment; document them in
  `.env.example`; never commit `.env`.

## Docker

- `Dockerfile` (multi-stage):
  - `deps`: installs production dependencies (cache-friendly).
  - `dev`: full deps, runs `npm run dev` (node --watch) on port 3000.
  - `prod`: copies prod `node_modules` + `src` + `public`, runs as the `node`
    user, patches OS packages, serves on port 3000.
- Base image is `node:20-bookworm-slim` (Debian), not alpine, so better-sqlite3
  uses prebuilt binaries and needs no C toolchain.
- `docker-compose.yml`: service `web` (target `dev`), port `3000:3000`, source
  bind-mounted for hot reload, named volume for `node_modules` and for the DB.
- Run every Node command through compose, not on the host.

### Commands

```bash
docker compose up                              # dev server -> http://localhost:3000
docker compose run --rm web npm test           # Vitest
docker compose run --rm web npm install <pkg>  # add a dependency
docker build --target prod -t via-verde .      # production image
```

## Git workflow

Branches:

- `main`: released code. `develop`: integration branch.
- Never commit directly to `main`.

For each task:

1. `git checkout develop && git pull`
2. `git checkout -b <type>/<short-kebab-description>`
   Types: `feature/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`.
3. Small, focused commits — one logical change each.
4. Lint/tests must pass in Docker before committing.
5. Ask before pushing or opening a PR. PRs target `develop`.

### Conventional Commits

Format: `<type>(<optional scope>): <imperative summary>`
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`.
Summary in English, lowercase, no trailing period, ≤ 72 characters.

Examples:

```
feat(coach): add rule-based fallback when no API key is set
fix(emissions): round CO2 to whole grams
test(api): cover trip validation
build(docker): add multi-stage Dockerfile
```
