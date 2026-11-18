# 2026-11-18 - auth-http-integration-tests (diff)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `auth-http-integration-tests` · Task: `/todo #463` — "Add HTTP-level integration tests for the auth flow (supertest + in-memory Mongo)" · Branch: `chore/463-auth-integration-tests` (cut from `staging` @ 33fcfb1)
Plan: `evidence/implementer/2026-11-18/auth-http-integration-tests-plan.md`

## Hub bytes before: 97851

## Feature doc: doctrine/features/auth-session-tokens.md, doctrine/features/auth-register-login.md
Unchanged — tests assert their Behavior; no behavior change. Not a `feat` (operator chose branch type `chore`), so the docs' own `## Acceptance criteria` aren't this node's; the Behavior items exercised:
| Doc · Behavior | Test (Acceptance row) |
|---|---|
| register-login #1 (valid register body), #3 (register → 201) | `beforeAll` asserts `[201, 201, 201, 201]` |
| register-login #6 (login 200 + `token`/`tokenRefresh` + cookies) | `login()` helper asserts 200, reads both tokens + `set-cookie` (used by criterion 3) |
| session #3 (cookie-only non-GET without `x-csrf-token` → 403 `CSRF_TOKEN_INVALID`) | criterion 3 |
| session #4 (`req.body.candidateId` overwritten) | criterion 4 |
| session #5 (refresh → new pair; rotated token unusable) | criteria 1, 2 |
| session #6 (reuse > 10s → all sessions revoked, same 401) | criterion 2 |
| session #7 (logout blacklists access + body `refreshToken`; later refresh → 401 `TOKEN_REVOKED`) | criterion 1 |
| session #2 (blacklisted / pre-revocation token → 401) | criteria 1, 2 |
| session #9 (Redis absent → memory fallback) | criterion 6 |
| session doc acceptance row "After logout, same access token → 401 `TOKEN_REVOKED`" | criterion 1 |

## Diff
| File | Why |
|---|---|
| `src/server.ts` | Middleware chain moved verbatim from `runServer` into exported `createApp()` (returns the app); `runServer` calls it. `startServer()` + the `unhandledRejection` handler now run only under `if (require.main === module)`, so importing the module (tests) has no Mongo/listen/process-handler side effects. `void` added to the startup call. |
| `src/__tests__/integration/auth.http.test.ts` (new) | 6 supertest tests over `createApp()` with `mongodb-memory-server`: Redis-absent precondition; register→login→GET→refresh→GET→logout → GET 401 `TOKEN_REVOKED` + refresh with logged-out refresh 401; rotated refresh reuse with `Date.now` +11s → 401, original + rotated access tokens 401, rotated refresh 401; cookie-only `POST /profile/create` without `x-csrf-token` → 403 `CSRF_TOKEN_INVALID`, nothing written; `candidateId` of another user in body → profile stored under the caller (IDOR); unknown route → 404 `{ success:false, error:{ code:'ROUTE_NOT_FOUND', message } }`. Logger mocked (`jest.mock('@/logger')`, as other suites); `memStore.clear()` per test. |
| `package.json` / `package-lock.json` | devDependencies `supertest@^7.3.2`, `@types/supertest@^7.2.1`, `mongodb-memory-server@^11.3.0`. Lockfile also re-hoists/dedupes transitive entries (npm's own rewrite); `npm ls --all` → exit 0. |
| `CLAUDE.md` | Conventions line "Middleware order is `runServer`" → `createApp` (would be stale after the move). |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (copied from `doctrine/MEMORY.md`):
- `npx jest src/__tests__/integration/auth.http.test.ts`
- `npm test`
- `npm run build` (Typecheck row = `inside Build`); also `npx tsc --noEmit`
- `npm run lint`; plus `npx eslint src/server.ts src/__tests__/integration/auth.http.test.ts` and the same on `git show staging:src/server.ts` via `--stdin` for the before count
- Entry-point smoke: `MONGO_URI=mongodb://127.0.0.1:1/x NODE_ENV=development LOCAL_PORT=3999 perl -e 'alarm 50; exec @ARGV' node dist/server.js` and `node -e "require('./dist/server.js'); console.log('imported, no start')"`

## Output (final run, after review fixes)
```
PASS src/__tests__/integration/auth.http.test.ts (5.121 s)
  ✓ runs with Redis absent (in-memory blacklist/revocation fallback)
  ✓ register → login → authenticated GET → refresh → logout, then the logged-out token is rejected (269 ms)
  ✓ reusing a rotated refresh token after the 10s grace window revokes every session (238 ms)
  ✓ rejects a cookie-only state-changing request without the CSRF header (236 ms)
  ✓ ignores a client-supplied candidateId (IDOR) (235 ms)
  ✓ answers an unknown route with 404 in the standard error shape (5 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        5.186 s
Ran all test suites matching /src\/__tests__\/integration\/auth.http.test.ts/i.
Jest did not exit one second after the test run has completed.
```
`npm test`:
```
Test Suites: 74 passed, 74 total
Tests:       790 passed, 790 total
```
(no `FAIL` lines in the grep of `^(Tests:|Test Suites:|FAIL)`)

Build / typecheck:
```
build exit 0
tsc exit 0
```
Lint:
```
✖ 273 problems (273 errors, 0 warnings)
```
Changed files (`npx eslint src/server.ts src/__tests__/integration/auth.http.test.ts`):
```
    7:1  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
    8:1  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
  146:5  error  Promises must be awaited, ... @typescript-eslint/no-floating-promises
  146:5  error  Expected an assignment or function call and instead saw an expression  @typescript-eslint/no-unused-expressions
✖ 4 problems (4 errors, 0 warnings)
```
Same file on `staging` (before):
```
    7:1  error  ... no-require-imports
    8:1  error  ... no-require-imports
  144:5  error  ... no-floating-promises
  144:5  error  ... no-unused-expressions
  150:1  error  ... no-floating-promises
✖ 5 problems (5 errors, 0 warnings)
```
→ all 4 remaining are pre-existing (lines 7/8 module-alias requires, `isConnected && runServer(...)` moved 144→146); the 5th (`startServer();` floating) is gone. Test file: 0 problems.

Smoke:
```
[MongoDB] Connect failed !!! MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:1
```
(direct run still reaches `startServer` → `connectMongo`)
```
imported, no start
```
(import alone starts nothing)

First run (before fixing the test itself) failed 2/6 — CSRF test got 401 (same-second access-token collision with a token blacklisted by the logout test, see Noticed #1) and IDOR create got 400 `_id` required (Joi `_id` is required-but-nullable → body sends `_id: null`). Both were test-setup errors, fixed by one user per flow + `_id: null`; no app code changed for them.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. register→login→GET→refresh→logout, token rejected after | `✓ register → login → authenticated GET → refresh → logout, then the logged-out token is rejected` (asserts GET 401 `TOKEN_REVOKED`, refresh 401 `TOKEN_REVOKED`) |
| 2. rotated refresh reuse after grace revokes all sessions | `✓ reusing a rotated refresh token after the 10s grace window revokes every session` (reuse 401; both access tokens 401; rotated refresh 401 `TOKEN_REVOKED`) |
| 3. cookie-only state-changing request w/o CSRF → 403 | `✓ rejects a cookie-only state-changing request without the CSRF header` (403 `CSRF_TOKEN_INVALID`, `countDocuments` 0) |
| 4. client `candidateId` ignored | `✓ ignores a client-supplied candidateId (IDOR)` (stored `candidateId` = caller's id, not the body's) |
| 5. unknown route → 404 standard shape | `✓ answers an unknown route with 404 in the standard error shape` |
| 6. Redis absent → in-memory fallback | `✓ runs with Redis absent ...` (`isRedisAvailable()` false) + criteria 1–3 pass with no Redis initialised |
| Full suite green | `Tests: 790 passed, 790 total` |
| Typecheck (`inside Build`) | `build exit 0`, `tsc exit 0` |
| Lint ≤ 274, none new in changed files | `✖ 273 problems`; changed files 4 vs 5 on staging, all pre-existing |
| Entry point unchanged | smoke: direct run → `[MongoDB] Connect failed ... ECONNREFUSED 127.0.0.1:1`; import → `imported, no start` |
| comments per code-comments.md | Added: `/** */` JSDoc on exported `createApp` (WHY: tests drive it); `//` on the `require.main` guard (WHY: import must not connect/bind/install handlers); test `//` notes on one-user-per-flow (jti trap), `memStore.clear()` (shared 127.0.0.1 bucket), revocation predating. Moved unchanged: the `unhandledRejection` safety-net comment. No `(#N)` refs. |

## Supersedes: none
`grep "#463"` on the active diagram → only this node.

## Still open: none

## Review
`/code-review medium` (background fork) — 9 findings:
1. Access tokens lack `jti` → same-second tokens identical, logout blacklists another session → real pre-existing prod bug, not introduced here → `## Noticed, not done` #1.
2. Reuse test didn't assert the rotated refresh token is rejected → **fixed** (added refresh with `newRefresh` → 401 `TOKEN_REVOKED`).
3. Tests sat just under the shared authLimiter bucket → **fixed** (`beforeEach(() => memStore.clear())`, `memStore` already exported).
4. Real Winston logger writes to `logs/` and floods console → **fixed** (`jest.mock('@/logger')`, same as `errors.test.ts`).
5. Importing `server.ts` runs `dotenv.config()` + registers `unhandledRejection` → handler **fixed** (moved under the `require.main` guard); dotenv part false positive — `src/config/process.config.ts:6` already `import 'dotenv/config'` on any import, so moving server's call changes nothing.
6. Redis-absent assertion is tautological → kept intentionally as a precondition guard: it fails if `createApp()` ever starts initialising Redis, which would silently stop the suite from covering the fallback path the issue asks for.
7. `mongodb-memory-server` postinstall downloads a mongod binary on `npm ci` (Docker deps stage, CI) → `## Noticed, not done` #2.
8. `CLAUDE.md` names `runServer` for middleware order → **fixed** (`createApp`).
9. Sequential bcrypt registers → **fixed** (`Promise.all`).
Re-ran step 5 after fixes (Output above is the post-fix run). No `security` label → no `/security-review`.

## Noticed, not done
1. **Access tokens have no `jti`** (`src/auth/auth.service.ts` `handlerLogin`, `src/auth/auth.controller.ts:167` `authRefreshToken`): two access tokens for one candidate signed in the same second are byte-identical, so logout on one device (or a refresh in the same second as login) blacklists the other device's token → 401 `TOKEN_REVOKED`. Reproduced by this suite's first run. Fix = `jti: crypto.randomUUID()` in the access payload like refresh tokens. Suggest its own issue/node (`fix-access-token-jti`).
2. `mongodb-memory-server` has a postinstall that downloads mongod on `npm ci` (CI, Docker `deps` stage). Locally it was blocked by npm `allow-scripts` and the binary downloaded lazily on first `MongoMemoryServer.create()`. Option: `MONGOMS_DISABLE_POSTINSTALL=1` in the Dockerfile deps stage, or `mongodb-memory-server-core`. CI run on GitHub not observed yet.
3. `withTimeout` (`src/utils/timeout.ts:21`) never clears its timer when no `signal` is passed → each DB call leaves a 5s timer; cause of Jest's "did not exit one second after" (process exits within ~5s). Pre-existing.

## Seal gate
No outward-facing action (no commit/push). `gh issue develop` created the remote branch ref as part of `/todo` Step 0.
