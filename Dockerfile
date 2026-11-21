# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Multi-stage Dockerfile for Vía Verde.
#
# Base image: Node.js 20 LTS on Debian "bookworm-slim".
# Decision (see README > How it was built): we use the Debian slim image, not
# alpine, because better-sqlite3 ships prebuilt binaries for Debian/glibc. That
# means `npm install` needs no C toolchain and "just works" on a clean machine.
# ---------------------------------------------------------------------------

# ---- deps: install production dependencies once, cache-friendly ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# ---- dev: full dependencies, used by docker compose for local work ----
FROM node:20-bookworm-slim AS dev
ENV NODE_ENV=development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- prod: slim runtime image ----
FROM node:20-bookworm-slim AS prod
ENV NODE_ENV=production
WORKDIR /app
# Patch OS packages at build time — floating base tags can lag behind CVEs.
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
# Bring in only the production node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY public ./public
# The app writes its SQLite file here; make sure it exists and is owned by node.
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
