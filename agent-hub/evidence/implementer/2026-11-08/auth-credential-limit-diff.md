# 2026-11-08 - auth-credential-limit (diff)
- Worker: implementer · Version: 0.1.0
- Node: `auth-credential-limit` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #387` — "Auth rate limiter never binds, and the v2 auth router has none"
- Plan: `evidence/implementer/2026-11-08/auth-credential-limit-plan.md`

## Hub bytes before
96389

## Feature doc
`doctrine/features/auth-register-login.md`, `doctrine/features/auth-password-reset.md`

## Feature doc changed: auth-register-login.md — new Behavior #9 (register/login 10 req/15 min per client IP, v1 + v2 one bucket, 11th → 429 `RATE_LIMITED`; refresh/logout/logout-all/verify-email global limit only) + open-question answer extended + Changelog; auth-password-reset.md — new Behavior #6 (forgot/reset share that limit) + Changelog — operator: "Bug — #387" / "covered by #387" (2026-11-07) + AskUserQuestion 2026-11-08 → "10 / 15 min (Recommended)"

## Diff
| file | why |
|---|---|
| `src/middlewares/rateLimit.middleware.ts` | one exported `authLimiter` (max 10, 15 min, `auth-rl`) next to `rateLimitMiddleware` — single instance so v1 and v2 hit one bucket |
| `src/routers/api/v1/auth.route.ts` | `router.use(authLimiter)` (150/15 min, never bound) removed; `authLimiter` per route on `POST /register`, `/login`, `/forgot-password`, `/reset-password` |
| `src/routers/api/v2/auth.route.ts` | `authLimiter` on `POST /register`, `/login` (v2 had none) |
| `src/__tests__/auth/v1AuthRoute.test.ts` | `auth limiter wiring`: 4 v1 credential routes + 2 v2 routes run the same `authLimiter` first; `/logout`, `/logout-all`, `/refresh`, `/verify-email` don't; not mounted router-wide |
| `src/__tests__/middlewares/rateLimit.test.ts` | `authLimiter` passes 10, blocks the 11th with 429 |
| `src/__tests__/auth/v2AuthRoute.test.ts` | controller is now the route's LAST handler (`stack[length - 1]`), the limiter is first |
| `CLAUDE.md`, `.claude/rules/api.md` | "150 req/15 min auth" → 10 req/15 min on login/register/forgot/reset (v1 + v2) |
| feature docs | see above |

Order on credential routes: global limiter (`server.ts`, 100/15 min, prefix `rl`) then `authLimiter` (10/15 min, prefix `auth-rl`) — separate keys, the stricter one now binds. `RATE_LIMITED` → 429 (`src/errors/AppError.ts:20,51`).

## Command
- `npx jest src/__tests__/auth/v1AuthRoute.test.ts src/__tests__/auth/v2AuthRoute.test.ts src/__tests__/middlewares/rateLimit.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npm test   (first full run)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 61 passed, 63 total
Tests:       5 failed, 616 passed, 621 total

npm run lint   (first run)
✖ 277 problems (277 errors, 0 warnings)
src/__tests__/middlewares/rateLimit.test.ts | now: ✖ 16 problems | base: ✖ 13 problems
  → +3 from the new authLimiter test (await-thenable ×2, unbound-method ×1 — same pattern the file's existing tests use)
  → fixed: cast `authLimiter` to a Promise-returning handler, assert on a standalone `status` mock

after the fix:
npx eslint src/__tests__/middlewares/rateLimit.test.ts
✖ 13 problems (13 errors, 0 warnings)
npx jest src/__tests__/auth/v1AuthRoute.test.ts src/__tests__/auth/v2AuthRoute.test.ts src/__tests__/middlewares/rateLimit.test.ts
Tests:       19 passed, 19 total
npm run lint
✖ 274 problems (274 errors, 0 warnings)
npm run build | grep -c "error TS"
0

per touched file (now | base):
src/middlewares/rateLimit.middleware.ts | 0 problems | 0 problems
src/routers/api/v1/auth.route.ts | 0 problems | 0 problems
src/routers/api/v2/auth.route.ts | 0 problems | 0 problems
src/__tests__/auth/v1AuthRoute.test.ts | 0 problems | 0 problems
src/__tests__/auth/v2AuthRoute.test.ts | 0 problems | 0 problems
src/__tests__/middlewares/rateLimit.test.ts | ✖ 13 problems | ✖ 13 problems
```
The lint fix touched only the new test's body (same assertions); the full `npm test` above predates it, the 3 touched test files were re-run after (`19 passed`). The 5 failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/trust-proxy-hops-diff.md`; +12 passed = the new tests.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) shared `authLimiter` on the 6 credential routes, not on refresh/logout/logout-all/verify-email, not router-wide; matches the updated Behaviors | wiring tests in `Tests: 19 passed, 19 total` |
| (1) 10 allowed, 11th → 429 | "authLimiter allows 10 requests per window and blocks the 11th" |
| (2) test files pass | `Tests:       19 passed, 19 total` |
| (3) `npm test` no new failures | `5 failed, 616 passed, 621 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274` after fix; per-file now = base |
| comments per code-comments.md | one 1-line why comment on `authLimiter`, no issue ref in non-test `src/` |

## Supersedes: none
`grep '#387' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- The existing `rateLimit.test.ts` tests carry the same 13 await-thenable/unbound-method lint errors (pre-existing, part of the 274 baseline).
## Seal gate
none in this pass — commit/push/merge are `/ship --merge`.
