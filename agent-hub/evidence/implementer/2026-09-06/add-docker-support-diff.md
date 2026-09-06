# 2026-09-06 — add-docker-support (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-docker-support` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): `/todo "#24"` — GitHub issue #24, "Add Docker support
  for development and production." Issue body: "Add Dockerfile and
  docker-compose.yml (include Mongo) for dev and production."

## Hub bytes before: 55562

## Investigation (before touching code)
No PENDING node existed for this task; `find . -maxdepth 2 -iname
"*docker*"` confirmed no Docker files exist anywhere in the repo — unlike
the last two `/todo` nodes (#74/#73), this is genuinely net-new work, not
a bookkeeping backfill.

Checked `doctrine/domains/PROJECT.md`'s Traps table before designing the
image: `fix-chrome-executable-path` (still PENDING on the diagram) is
specifically about Puppeteer breaking in CI/Docker. Read
`src/services/createPDF.ts` — the hardcoded path from the original trap
is already gone; the code now reads an optional
`process.env.PUPPETEER_EXECUTABLE_PATH` override (no unconditional
hardcoded path left). **Not fixed by this node** — flagging under
"Noticed, not done" below, since that's a separate PENDING node's job —
but this Dockerfile is exactly the CI/Docker scenario that env var exists
for, so it's exercised (and live-verified) here for the first time.

Read `package.json` (`engines: node >=20.19.0 <23.0.0`, no lint script),
`.env.example`/`.env.development`/`.env.production` (all 3 are
gitignored — a fresh clone has none of them), `src/config/process.config.ts`
(required vars just warn, don't hard-crash, but `jwtSign` throws without
`TOKEN_SECRET`), `src/server.ts` (port always from `LOCAL_PORT`, default
3001 regardless of `NODE_ENV` — the documented "prod port 3008" is just a
convention set via env, not a separate code path), `src/alias.ts`
(module-alias path resolution — unaffected by containerization).

## Diff
| File | Why |
|---|---|
| `Dockerfile` (new) | Multi-stage: `base` (Node 20 bookworm-slim + `apt`-installed `chromium`/`dumb-init`, `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`+`PUPPETEER_EXECUTABLE_PATH` set) → `deps` (`npm ci`) → `development` (hot reload via `npm run dev`) / `build` (`npm run build`) → `prod-deps` (`npm ci --omit=dev`) → `production` (compiled `dist/` + prod-only `node_modules`, `HEALTHCHECK` against `/health`, `dumb-init` entrypoint) |
| `.dockerignore` (new) | Excludes `node_modules`, `dist`, `.git`, `.env*` (keeps `.env.example`), generated PDF/upload dirs, logs |
| `docker-compose.yml` (new) | Dev stack: `mongo:7` (host port 27017, healthcheck, named volume) + `api` (`target: development`, bind-mounted source for hot reload, `${VAR:-dev-default}` substitution so it runs with zero `.env` setup) |
| `docker-compose.prod.yml` (new) | Prod stack: `mongo:7` (no host port — only reachable from `api` on the compose network), `api` (`target: production`, `restart: unless-stopped`, `env_file: .env` — no insecure defaults, real secrets required) |
| `README.md` | Added a `🐳 Docker` section (after Quick Start) documenting both `docker compose up --build` (dev) and the `.env` + `docker compose -f docker-compose.prod.yml up -d --build` (prod) flows |

## Command
```
npm run build
```
Output:
```
> resume-nodejs-api@1.3.0 build
> tsc && npm run copy

> resume-nodejs-api@1.3.0 copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, no errors.

```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, copied
verbatim from `doctrine/MEMORY.md`)

Output (tail):
```
Test Suites: 13 passed, 13 total
Tests:       77 passed, 77 total
Snapshots:   0 total
Time:        7.212 s
Ran all test suites.
```
Unchanged 13/77 baseline — Docker files have no Jest coverage surface
(infra, not application logic); acceptance for this node rests on live
container verification instead (below), matching how this hub treated
`fix-redis-init-blocks-dev-startup` and similar infra nodes.

## Live verification (real Docker daemon, not simulated)
Docker Desktop was not initially running; started it
(`open -a Docker`, waited for `docker info` to succeed) before any of the
below.

**Dev stack** (`docker compose up -d`, default target `development`):
```
 Container resume-nodejs-api-mongo-1  Healthy
 Container resume-nodejs-api-api-1  Started
```
- `curl http://localhost:3001/health` → `HTTP_STATUS:200`,
  `{"status":"ok","timestamp":"2026-09-06T05:12:50.975Z","uptime":10.69...}`
- Container logs: `[MongoDB] Connected!`, `App listening on port: 3001 -
  development`. `[Redis] Connection error` logged as expected (no
  `REDIS_URL` set — documented in-memory fallback, not a failure).
- Full live auth+data round trip against the containerized Mongo (real
  throwaway account, deleted after):
  - `POST /api/v1/auth/register` → `200`, `"Đăng ký thành công"`
  - `GET /api/v1/auth/login` → `200`, real `token`/`tokenRefresh` JWT pair
    returned
  - `GET /api/v1/download-pdf?token=...` → `HTTP_STATUS:200`,
    `Content-Type: application/pdf`, `file` confirms
    `PDF document, version 1.4, 1 pages` — **this is the live proof that
    Puppeteer/Chromium actually works inside the container**
    (`apt`-installed `chromium` + `PUPPETEER_EXECUTABLE_PATH`), the exact
    CI/Docker case flagged by the `fix-chrome-executable-path` trap.
    Container logs show the request completing in 1280ms with no error.
  - `DELETE /api/v1/candidate` (self, via `req.user._id`) → `200`,
    `"Xoá tài khoản thành công"` — test account cleaned up before tearing
    the stack down. Generated PDF file
    (`src/public/pdf/docker-test+...@example.com.pdf`) also deleted from
    the host bind mount afterward — confirmed `git status --porcelain`
    shows no stray files.
  - `docker compose down` (dev stack removed, network + container
    cleaned up).

**Production stack** (`docker build --target production` +
`docker compose -f docker-compose.prod.yml up -d --build`, with a
throwaway `.env` containing only fake-but-shaped secrets, deleted after):
```
resume-nodejs-api-api-1     ...   Up 5 seconds (healthy)    0.0.0.0:3008->3008/tcp
resume-nodejs-api-mongo-1   ...   Up 16 seconds (healthy)   27017/tcp
```
- `api` container status is `healthy` — the `HEALTHCHECK` instruction
  itself passed against the real running server, not just "container
  started."
- `mongo`'s port column shows `27017/tcp` with **no host-side mapping** —
  confirms it is not reachable from outside the compose network, as
  designed.
- `curl http://localhost:3008/health` → `200`,
  `{"status":"ok",...}`.
- Logs: `[MongoDB] Connected!`, `[Redis] REDIS_URL not configured; using
  in-memory fallback.` (expected — `docker-compose.prod.yml` has no
  Redis service, matches the dev stack's same documented behavior),
  `App listening on port: 3008 - production`.
- Teardown: `docker compose -f docker-compose.prod.yml down -v` (removes
  containers + the `mongo-data-prod` volume), test image
  (`resume-api-prod-test`) removed via `docker rmi`, throwaway `.env`
  deleted. `git status --porcelain` confirmed clean before writing this
  note (only the intended 5 files: `Dockerfile`, `.dockerignore`,
  `docker-compose.yml`, `docker-compose.prod.yml`, `README.md`).

## Acceptance
| Criterion (from issue #24) | Evidence |
|---|---|
| Dockerfile for dev | `development` target — live-verified: register/login/PDF export/self-delete all succeeded against the real container |
| Dockerfile for production | `production` target — live-verified: `healthy` container status, real `/health` 200 |
| docker-compose.yml including Mongo | Both compose files define a `mongo:7` service with a healthcheck + persistent named volume; `api` `depends_on: mongo: condition: service_healthy` in both |
| Works for dev | `docker compose up --build` — no `.env` required, live-verified end-to-end above |
| Works for production | `docker compose -f docker-compose.prod.yml up -d --build` — live-verified `healthy`, Mongo not host-exposed |
| `npm run build` clean | See Command/Output above |
| `npm test` unchanged (77/77) | See Command/Output above |

## Noticed, not done
- `fix-chrome-executable-path` (separate PENDING node, `doctrine/domains/
  PROJECT.md` Traps table) — the code no longer has the literal
  hardcoded-path bug the trap describes (already uses an optional
  `PUPPETEER_EXECUTABLE_PATH` env var), but the diagram still shows this
  node PENDING. Possible `DIAGRAM_DRIFT`, but out of scope to silently
  fix here — flagging for the verifier/operator to decide whether that
  node should be independently re-verified and SEALed, since this Docker
  node's own live test is evidence the env-var path already works, not
  proof of when/how it was fixed.
- No CI workflow change (e.g. a GitHub Actions job that builds the Docker
  image) — issue #24 only asked for `Dockerfile`/`docker-compose.yml`,
  not CI integration; left as a natural follow-up, not assumed in scope.
- Redis is not containerized (matches existing documented fallback
  behavior) — if a future node wants Redis in the compose stack, it's a
  small addition, not implied by this issue.

## Seal gate
No outward-facing action taken this pass — no `commit`/`push`. All
`docker`/`curl` commands ran against local, throwaway containers/data
(real Docker daemon, but nothing pushed to a registry, nothing sent
outside this machine). Real throwaway test data (1 candidate account) was
created and deleted against the local Mongo container only — never
touched the shared production Atlas cluster. `src/` diff (`README.md`
only) shown above in full per the seal gate; `Dockerfile`/compose files
are new, not modified — also shown in full above, not `agent-hub/`
content.
