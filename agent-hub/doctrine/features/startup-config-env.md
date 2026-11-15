# Startup configuration (environment variables)

- Status: draft
- Source: backfill from code
- Issues: #458
- Anchors: `src/config/process.config.ts`, `src/config/session.config.ts`, `src/config/proxy.config.ts`, `src/config/cors.config.ts`, `src/database/mongo.db.ts`, `src/server.ts`, `src/utils/jwt.ts`, `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`, `jest.setup.ts`

## Goal
The operator configures the API through environment variables (`.env` or
the host's env). The app reads them once at startup and every module takes
its secrets, DB connection, port and proxy/CORS settings from there. A
misconfigured production deploy must refuse to start instead of failing
later at request time.

## Behavior
Items marked (#458) are decided by the operator (2026-11-14) and are the
target of the #458 fix; the rest describe the code today and stay as-is.
1. When any module imports `@/config/process.config`, it loads `.env` via `dotenv/config` (real env vars win over `.env`) and re-exports `NODE_ENV`, `LOCAL_PORT`, `MONGO_URI`, `MONGOBD_USER`, `MONGOBD_PASSWORD`, `SESSION_SECRET`, `TOKEN_SECRET`, `TOKEN_REFRESH`, `TOKEN_EXP_IN`, `TOKEN_REFRESH_EXP_IN`, `REDIS_URL`, `MONGO_MAX_POOL_SIZE`, `MONGO_MIN_POOL_SIZE`, `CORS_ORIGIN`.
2. (#458) At that import the environment is checked against these rules:
   - `TOKEN_SECRET`, `TOKEN_REFRESH`, `SESSION_SECRET` set and at least 32 characters;
   - Mongo: `MONGO_URI` set, OR both `MONGOBD_USER` and `MONGOBD_PASSWORD` set;
   - `LOCAL_PORT`, `MONGO_MAX_POOL_SIZE`, `MONGO_MIN_POOL_SIZE`, `TRUST_PROXY_HOPS`: optional; when set, must be a number;
   - `TOKEN_EXP_IN`, `TOKEN_REFRESH_EXP_IN`, `REDIS_URL`, `CORS_ORIGIN`: optional, not checked.
3. (#458) When `NODE_ENV=production` and any rule in 2 fails, the app does not start: the process exits with a non-zero code before the HTTP server listens, and the message names every failing variable and why (missing / shorter than 32 chars / not a number / no Mongo config).
4. (#458) Outside production (`development`, `test`, or `NODE_ENV` unset), a missing required variable only prints a console warning naming it, and boot continues. A secret shorter than 32 chars never blocks boot outside production.
5. (#458) A config with only `MONGO_URI` (no `MONGOBD_USER`/`MONGOBD_PASSWORD`) passes the Mongo rule in every environment — no error, no warning about `MONGOBD_*`.
6. MongoDB connection: `MONGO_URI` is used when set; otherwise `MONGOBD_USER` + `MONGOBD_PASSWORD` build the Atlas URI; with neither (only reachable outside production after #458), connecting fails with `MongoDB configuration missing...`, the failure is logged, and the HTTP server never listens.
7. Mongo pool sizes: unset → max 10, min 2.
8. Port: `LOCAL_PORT` when set; unset → 3001 outside production, 3008 in production.
9. `TRUST_PROXY_HOPS`: a positive integer sets Express `trust proxy` to that hop count; unset, or a number that isn't a positive integer (e.g. `0`) → no proxy trusted.
10. `CORS_ORIGIN`: comma-separated allow-list; empty → caller's origin reflected outside production, every cross-origin request refused (`origin: false`) in production.
11. `TOKEN_EXP_IN` unset → access tokens expire in `1h`; `TOKEN_REFRESH_EXP_IN` unset → refresh tokens expire in `7d`.
12. `REDIS_URL` unset → Redis features use their in-memory fallbacks (not a config error).
13. Under Jest, `jest.setup.ts` fills `NODE_ENV=test`, `MONGOBD_USER`, `MONGOBD_PASSWORD`, `SESSION_SECRET`, `TOKEN_SECRET`, `TOKEN_REFRESH`, `TOKEN_EXP_IN` with test values when unset; these (shorter than 32 chars) stay unchanged.

## Acceptance criteria
1. Unit test for the env check passes: `npx jest src/__tests__/config/` — covers at least: production + `TOKEN_SECRET` missing → error naming `TOKEN_SECRET`; production + `TOKEN_REFRESH` or `SESSION_SECRET` of 31 chars → error; production + only `MONGO_URI` (no `MONGOBD_*`) → no error; production + neither `MONGO_URI` nor both `MONGOBD_*` → error; production + `LOCAL_PORT=abc` (and each other numeric var) → error; production + numeric vars unset → no error; `NODE_ENV=development` + missing secret → no throw.
2. Production boot (`NODE_ENV=production`, `TOKEN_SECRET` unset or shorter than 32 chars) exits with a non-zero code and prints a message naming the variable; nothing listens on the port.
3. Development boot with `TOKEN_SECRET` unset prints a console warning naming it and keeps starting (no exit).
4. `npm test` passes with `jest.setup.ts` unchanged.
5. `npm run build` (typecheck) passes.

## Edge cases
- `MONGO_URI` and `MONGOBD_*` both set → valid; `MONGO_URI` wins (PROJECT.md decision).
- Only `MONGOBD_USER` set (no password, no `MONGO_URI`) → Mongo rule fails (production: exit; elsewhere: warning).
- `TOKEN_SECRET` exactly 32 chars → valid.
- `TRUST_PROXY_HOPS=0` in production → a number, so valid; no proxy trusted (item 9).
- `MONGO_MAX_POOL_SIZE=abc` in production → boot fails; outside production → silently uses the default 10, as today (#458 doesn't change this).
- `TOKEN_EXP_IN` unset in production → valid, `1h`.
- `NODE_ENV` unset → treated as non-production (warn only).

## Out of scope
- Rate-limit tuning vars (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`), logger vars (`LOG_LEVEL`, `LOG_DIR`), `PUPPETEER_EXECUTABLE_PATH`, `PERSIST_EXPORTED_PDF` — read directly from `process.env` in their own modules, not part of the startup check.
- Format checks on `TOKEN_EXP_IN` / `TOKEN_REFRESH_EXP_IN`, `MONGO_URI`, `REDIS_URL`, `CORS_ORIGIN`.
- Changing `session.config.ts`'s `SESSION_SECRET || ''` fallback outside production.
- Secret rotation, secret managers, `.env.*` file contents.

## Open questions
All answered by the operator, 2026-11-14 (see `evidence/analyst/2026-11-14/startup-config-env-spec.md`):
1. Outside production: fail or warn? → warn and continue (`console.warn`), never fail.
2. `SESSION_SECRET` in production? → required, min 32 chars.
3. Non-numeric numeric vars in production? → fail boot; unset stays allowed.
4. `TOKEN_EXP_IN`? → optional, `1h` fallback kept.
5. Min-32 in dev/test? → no; `jest.setup.ts` defaults unchanged.

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-14 | Backfilled from code (draft) | #458 touches this feature; no INDEX row existed | — |
| 2026-11-14 | Operator answers folded in: production fail-fast rules (items 2–5), acceptance criteria | #458 round 2 | — |
