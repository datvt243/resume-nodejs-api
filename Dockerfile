# syntax=docker/dockerfile:1
#
# Multi-stage build (issue #24). Two runnable targets:
#   docker build --target development ...   (hot reload via ts-node/nodemon)
#   docker build --target production  ...   (compiled dist/, minimal image)
# See docker-compose.yml (dev) / docker-compose.prod.yml (prod) for the
# full stack including MongoDB.

# ---- base: OS packages shared by every stage --------------------------
# Chromium is installed here (not left to Puppeteer's own download) so the
# same binary is reused by every stage and PUPPETEER_EXECUTABLE_PATH (see
# src/services/createPDF.ts) always points at a real, working browser —
# this is the CI/Docker fix already noted as a trap in
# agent-hub/doctrine/domains/PROJECT.md.
FROM node:20-bookworm-slim AS base
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps: full dependency install (needed for both dev and build) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- development: hot reload, source mounted in by docker-compose.yml -
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# ---- build: compile TypeScript -> dist/ (tsc && copy views/public) ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- prod-deps: production-only node_modules (no devDependencies) -----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- production: smallest final image, no source/build tooling --------
FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# No mkdir -p workaround needed here anymore: src/services/createPDF.ts,
# uploadCV.middleware.ts, and uploadImages.middleware.ts now resolve
# their write paths off __dirname (fixed — see
# fix-hardcoded-src-public-write-paths trap history in
# agent-hub/doctrine/domains/PROJECT.md), so they correctly target
# dist/public/... in this image, all 3 self-create their directory if
# missing, and `npm run copy` already populates dist/public/{pdf,
# uploads/cv,uploads/images}/ (with each dir's .gitkeep) from the build
# stage's COPY --from=build /app/dist above.
EXPOSE 3008
# Probes process.env.LOCAL_PORT (falling back to 3008) — src/server.ts
# now respects LOCAL_PORT in production too (fixed, see the
# fix-prod-port-ignores-local-port trap history in
# agent-hub/doctrine/domains/PROJECT.md), defaulting to 3008 only when
# LOCAL_PORT is unset — same default, so this matches whichever port the
# app actually bound to.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get({host:'localhost',port:process.env.LOCAL_PORT||3008,path:'/health'},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
