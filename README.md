# 🌿 Vía Verde

**Pick the greener way to get there.**

Vía Verde is a tiny web app for sustainable mobility. You describe a trip — how
far, and how you're travelling — and it estimates the trip's CO₂, shows you every
greener alternative and how much each would save, logs the trip, and keeps a
running total of the emissions you could avoid. A small **generative-AI coach**
turns those numbers into one short, friendly nudge.

> Final project for the course **Building Digital Products with Generative AI**
> (Module 7). Built end-to-end with an AI agent, from idea to deployed MVP.

---

## 1. What it is

**The problem.** Most of us pick how to get somewhere out of habit, with no feel
for what it costs the planet. By the time we see a yearly "transport footprint"
number, it's too abstract to change anything.

**Who it's for.** Anyone who makes everyday trips — commuters, students, people
trying to drive a little less — and wants a nudge *at the moment of deciding*.

**The minimum moment of value.** You type one trip and instantly see: this is
what it costs in CO₂, here's a greener way, and this is what you'd save. One
clear sentence anyone can understand.

---

## 2. Features

The MVP is scoped to a few user stories:

1. **As a commuter, I can enter a trip** (distance + travel mode, with optional
   from/to labels) **and see its estimated CO₂**, so I understand the cost of how
   I usually travel.
2. **As a user, I can see greener alternatives ranked**, each with the CO₂ it
   would save, so I know the best realistic swap.
3. **As a user, I get a short, friendly coach message** (AI-generated when a key
   is configured, rule-based otherwise), so the number turns into a decision.
4. **As a returning user, I can see my running total of CO₂ avoided** and my
   recent trips, so progress feels tangible.

**In the backlog (not in the MVP):** accounts/auth, real map-based distance
lookup, official per-country emission factors, trip history charts, payments.

---

## 3. How to run it

### Requirements

- **Docker** and **Docker Compose** (the only hard requirement — everything runs
  in containers).
- Or, to run on the host directly: **Node.js 20+**.

### Environment variables

Copy the example file and edit it. **Never commit your real `.env`.**

```bash
cp .env.example .env
```

| Variable        | Required | Default                      | What it does                                   |
| --------------- | -------- | ---------------------------- | ---------------------------------------------- |
| `PORT`          | no       | `3000`                       | HTTP port.                                     |
| `DATABASE_PATH` | no       | `./data/via-verde.sqlite`    | Where the SQLite file lives.                   |
| `AI_API_KEY`    | no       | _(empty)_                    | Key for the AI coach. Empty = rule-based coach.|
| `AI_BASE_URL`   | no       | `https://api.openai.com/v1`  | Any OpenAI-compatible endpoint.                |
| `AI_MODEL`      | no       | `gpt-4o-mini`                | Model used for the coach.                      |

> The app runs **fully offline** with no key: the coach just uses a built-in
> rule-based message. Add a key to get a personalised, AI-written nudge.

### Run it with Docker (recommended)

```bash
docker compose up        # then open http://localhost:3000
```

### Run the tests

```bash
docker compose run --rm web npm test
```

### Run on the host without Docker

```bash
npm install
cp .env.example .env
npm start                # http://localhost:3000
npm test                 # Vitest
```

### Production image

```bash
docker build --target prod -t via-verde .
docker run -p 3000:3000 --env-file .env via-verde
```

### Deployed URL

_Not deployed yet — see "How you'd deploy it" in section 5._ Add the public URL
here once it's live.

### API, in one glance

| Method | Path          | Purpose                                    |
| ------ | ------------- | ------------------------------------------ |
| GET    | `/api/health` | Liveness + whether the AI coach is active. |
| GET    | `/api/modes`  | Supported travel modes with labels.        |
| POST   | `/api/trips`  | Assess + log a trip; returns coach message.|
| GET    | `/api/trips`  | Recent trips.                              |
| GET    | `/api/stats`  | Totals, including CO₂ avoided.             |

---

## 4. How it was built with AI

This project was built the way the course teaches: an **AI agent as a
collaborator**, inside a reproducible environment, following a real cycle.

### The cycle — idea → design → build → validation → deployment

- **Idea & design** were decided first (this README's sections 1–2), then handed
  to the agent as context so the code served the product, not the other way round.
- **Build** happened layer by layer: domain logic (`emissions.js`) → persistence
  (`db.js`, `tripService.js`) → HTTP (`routes/`, `app.js`) → frontend → Docker.
- **Validation** is the Vitest suite in `test/` (domain, service, API, and the
  AI-coach fallback paths).

### The environment: CLAUDE.md / AGENTS.md, DevContainer, Docker

- **[CLAUDE.md](./CLAUDE.md)** gives the agent persistent context: the stack, the
  `routes -> services -> db` layering, the "no secrets in code" rule, and the git
  workflow. **[AGENTS.md](./AGENTS.md)** points other agents to the same rules.
- **`.devcontainer/`** pins Node 20 so the agent and a human get the same
  toolchain.
- **Docker** (multi-stage) makes "it works on my machine" true on *any* machine.

### Agents & skills

- A single coding agent did the work, steered by `CLAUDE.md`. The natural skills
  it leaned on: a **Docker** skill for the multi-stage build, and the project's
  own test suite as the feedback loop.

### A real prompt used while building

> "Create the emissions domain module as a pure function set with no I/O:
> `co2ForTrip(distanceKm, mode)`, `greenerAlternatives(...)` returning only modes
> that save CO₂ sorted greenest-first, and `assessTrip(...)` that bundles the
> trip's CO₂ plus the best alternative. Keep the factors in one frozen object and
> comment that they're illustrative defaults. Then write Vitest specs for the
> edge cases: zero-emission modes, the greenest mode (no alternatives), and
> invalid input."

### What went well

- Keeping `emissions.js` pure made the tests tiny and fast, and let the rest of
  the app lean on it with confidence.
- Splitting `app.js` (build) from `server.js` (listen) made API tests trivial
  with an in-memory SQLite database — no network, no fixtures.

### What was hard / honest notes

- **SQLite in Docker.** `better-sqlite3` is a native module. On `alpine` (musl)
  it has to compile; on `node:20-bookworm-slim` (Debian/glibc) it uses a prebuilt
  binary and "just works." I chose Debian slim and documented why — a real
  trade-off, not a flawless result.
- **The emission factors are approximations.** They're commonly-cited defaults,
  not certified figures. The app is a decision aid, not a carbon ledger. They
  live in one object so they're easy to replace with official local data.
- **The AI coach can fail.** Networks and endpoints are unreliable, so the coach
  *always* falls back to a deterministic message rather than breaking the request.

---

## 5. Status and next steps

**Status:** working MVP. You can plan a trip, see greener options and savings,
get a coach message (AI or fallback), and watch your avoided-CO₂ total grow.
Tests cover the domain, the service, the API, and the coach's fallback logic.

**The honest gaps:** distance is typed by hand (no maps), emission factors are
generic defaults, and there are no user accounts, so "your" stats are really the
device's shared totals.

**The natural next step** (Level 2 on the course progression map): add real
authentication so stats are per-user, then swap the hand-typed distance for a
maps/geocoding API. After that: per-country emission factors and a simple weekly
trend chart.

**How you'd deploy it.** It's a single container that listens on `PORT` and
writes a SQLite file — so any host that runs a Docker image with a small
persistent volume works (Render, Railway, Fly.io, a small VPS). Build the `prod`
target, set the env vars in the host's dashboard, attach a volume at `/app/data`,
and put the public URL in section 3.

---

_Emission factors are illustrative defaults; see `src/services/emissions.js`.
Built for learning, with AI, from idea to MVP._
