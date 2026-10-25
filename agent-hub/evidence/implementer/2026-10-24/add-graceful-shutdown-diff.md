# 2026-10-24 - add-graceful-shutdown (diff)

- Worker: implementer · Version: 0.1.0
- Node: `add-graceful-shutdown` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #293): "feat(server): graceful shutdown — close MongoDB + Redis on SIGTERM" — "`src/server.ts` has no `SIGTERM`/`SIGINT` handler: on deploy/restart the HTTP server, Mongo connection and Redis client are killed mid-flight instead of draining."
- Plan: `evidence/implementer/2026-10-24/add-graceful-shutdown-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 81444

## Diff
| File | Why |
|---|---|
| `src/utils/gracefulShutdown.ts` (new) | `createShutdown(server, timeoutMs = SHUTDOWN_TIMEOUT_MS)` → handler: once-only flag; 10s `.unref()`'d force-exit(1) timer; `server.close` (error logged, not thrown) → `closeRedis()` → `MongoDBConnection.getInstance().disconnect()` → clear timer → `process.exit(0)`. Reuses existing close primitives, both already catch + log their own errors. |
| `src/server.ts` | Keep `app.listen` return value as `server`; register `SIGTERM`/`SIGINT` → `void shutdown(signal)`; import `createShutdown`; removed stale `// TODO: close the MongoDB connection on process exit (coming soon)`. |
| `src/__tests__/utils/gracefulShutdown.test.ts` (new) | 4 tests: order http→redis→mongo + exit 0; second signal ignored (close + exit called once); HTTP close error still closes Redis+Mongo; hang past timeout → exit(1). |

## Command
From repo root, per `doctrine/MEMORY.md`:
- `npm test`
- `npm run build` (Typecheck row)
- `npm run lint` (before/after via `git stash -u`)
- `npx jest src/__tests__/utils/gracefulShutdown.test.ts`
- Baseline check of the 2 failing suites: `git stash -u && npx jest src/__tests__/auth/tokenExpiry.test.ts src/__tests__/services/atsPdfIntegration.test.ts`
- Live smoke: `LOCAL_PORT=3399 NODE_ENV=development node dist/server.js`, `curl /health`, `kill -TERM <pid>`

## Output
New test file:
```
PASS src/__tests__/utils/gracefulShutdown.test.ts
  createShutdown
    ✓ closes HTTP, then Redis, then Mongo, then exits 0 (2 ms)
    ✓ runs only once when a second signal arrives (1 ms)
    ✓ still closes Redis and Mongo when the HTTP close errors (3 ms)
    ✓ force-exits 1 when draining hangs past the timeout (1 ms)
Tests:       4 passed, 4 total
```
`npm test` (with diff):
```
TEST_RC=1
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 49 passed, 51 total
Tests:       5 failed, 458 passed, 463 total
```
Same 2 suites on baseline (diff stashed):
```
Tests:       5 failed, 2 passed, 7 total
```
Causes (local env only, not code): tokenExpiry `Expected: 3600 Received: 10800` — local `.env` has `TOKEN_EXP_IN=3h`; ATS `Could not find Chrome (ver. 127.0.6533.88) ... cache path ... .cache/puppeteer` — no Chrome in this checkout. Same suites passed 50/50 suites, 459/459 in a clean `npm ci` worktree of `staging` earlier today (/release v2.1.1 gate). 463 total = 459 + 4 new; 458 passed = 454 baseline-passing + 4 new.

`npm run build`:
```
BUILD_RC=0
> cp -R ./src/public ./dist/
```
`npm run lint`: with diff `✖ 275 problems (275 errors, 0 warnings)`; staging baseline (stashed) `✖ 275 problems (275 errors, 0 warnings)` → 0 new. `npx eslint src/__tests__/utils/gracefulShutdown.test.ts src/utils/gracefulShutdown.ts` → clean. `src/server.ts` keeps its 5 pre-existing errors (require-imports L7-8, `isConnected && runServer(...)`, `startServer()` floating) — none on lines this diff added.

Live smoke:
```
health=200
info: [MongoDB] Connected!
info: [Redis] REDIS_URL not configured; using in-memory fallback.
info: App listening on port: 3399 - development
info: [Shutdown] SIGTERM received, draining
info: [MongoDB] Disconnected!
info: [Shutdown] Done
EXIT_CODE=0
```

## Acceptance
| # | Criterion | Evidence |
|---|---|---|
| 1 | SIGTERM/SIGINT → close http → Redis → Mongo → exit 0; second signal no re-run | `✓ closes HTTP, then Redis, then Mongo, then exits 0`, `✓ runs only once when a second signal arrives`; live smoke `[Shutdown] SIGTERM received` … `[MongoDB] Disconnected!` … `EXIT_CODE=0` |
| 2 | Hard timeout → exit 1, timer doesn't hold process | `✓ force-exits 1 when draining hangs past the timeout`; `forceExit.unref()` in `gracefulShutdown.ts` |
| 3 | Failing close step logged, rest still runs | `✓ still closes Redis and Mongo when the HTTP close errors`; `closeRedis`/`disconnect` already catch+log internally (`redis.ts:64-72`, `mongo.db.ts:62-70`) |
| 4 | Unit test covers order + idempotency + timeout | 4 tests above |
| 5 | `npm test` + build green, lint 0 new | build `BUILD_RC=0`; lint 275=275; `npm test` 458/463 with the 5 failures proven pre-existing + env-caused (baseline `5 failed, 2 passed, 7 total`), 0 failures from this diff |
| 6 | Stale TODO removed; comments per code-comments.md | TODO line deleted from `server.ts`. New comments: file JSDoc (WHY: drain instead of dying mid-request, order rationale), `//` 1-sentence WHY on `SHUTDOWN_TIMEOUT_MS` (Render SIGKILL window), JSDoc on exported `createShutdown` (contract: once-only, step failures don't stop the chain), `// never calls back` in test. No `(#N)` refs, no narrated history. |

## Supersedes: none
Grepped active diagram for `#293` — only this node.

## Noticed, not done
- Local env makes `npm test` red in the main checkout (`.env` `TOKEN_EXP_IN=3h` leaks into `tokenExpiry.test.ts`; no Puppeteer Chrome under `.cache/puppeteer`). Test isolation issue, not this node.
- `/release` skill still says lint is unconfigured; `npm run lint` exists.

## Seal gate: none
No commit/push yet.
