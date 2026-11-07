# 2026-11-07 - restrict-query-token (diff)

- Worker: implementer · Version: 0.1.0
- Node: `restrict-query-token` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #392` — "Restrict the `?token=` query parameter to `/download-pdf`"
- Status: sealed_pending_verifier

## Hub bytes before
93048

## Feature doc
doctrine/features/auth-session-tokens.md

## Feature doc changed: Behavior 1 "…body `token`, query `token`, cookie `token`…" → "…body `token`, cookie `token`… Query `token` is read (between body and cookie) only on `GET /api/v1/download-pdf`; elsewhere it is ignored." — operator: "Change: only /download-pdf — #392" (doc Open questions, 2026-11-07)

## Diff
| File | Why |
|---|---|
| `src/utils/helper-auth.ts` | `extractTokenWithSource(req, fieldName, allowQuery = true)`: query lookup only when `allowQuery`; default keeps refresh/logout/csrf callers unchanged |
| `src/middlewares/verifyToken.middleware.ts` | body moved into private `authenticate(req, next, allowQuery)`; `verifyToken` → `false`, `verifyTokenByQuery` → `true`; stale "extractToken already supports query" comment replaced by a WHY line |
| `src/__tests__/middlewares/verifyToken.test.ts` | 3 tests: query token ignored → 401 `NO_TOKEN`; ignored query falls through to cookie; `verifyTokenByQuery` accepts query |
| `agent-hub/doctrine/features/auth-session-tokens.md` | Behavior 1 + Changelog row |

Swagger: `src/routers/api/v1/index.ts` (`/download-pdf` documents `?token=`) and `cv.route.ts:24` ("does NOT accept a `?token=`") already match — no change.

## Command
- `npx jest src/__tests__/middlewares/verifyToken.test.ts src/__tests__/middlewares/csrf.test.ts src/__tests__/utils/tokenBlacklist.test.ts src/__tests__/utils/authCookies.test.ts src/__tests__/utils/csrf.test.ts src/__tests__/auth/refreshToken.test.ts src/__tests__/auth/refreshTokenReuse.test.ts`
- `npx jest src/__tests__/middlewares/verifyToken.test.ts` (after lint fix)
- `npm test`
- `npm run build` (Typecheck: inside Build)
- `npm run lint` (baseline 274)

## Output
```
$ npx jest <7 auth/session suites above>
Test Suites: 7 passed, 7 total
Tests:       64 passed, 64 total

$ npx jest src/__tests__/middlewares/verifyToken.test.ts
Tests:       18 passed, 18 total

$ npm test
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 579 passed, 584 total

$ npm run build
build exit 0

$ npx eslint .
✖ 274 problems (274 errors, 0 warnings)
```
The 5 failures are the same pre-existing `tokenExpiry.test.ts` (local `.env` sets `TOKEN_EXP_IN`) + `atsPdfIntegration.test.ts` (no local Chrome) as `evidence/implementer/2026-11-07/fix-account-delete-cleanup-diff.md` proved on the clean base; 584 = 581 base + 3 new tests.

Lint, changed files: base (`git stash`) "✖ 19 problems" for the 3 files; first run with the diff "✖ 22 problems" (3 `no-unnecessary-type-assertion` on my new test lines 210/218/221) → casts removed → test file "✖ 15 problems", whole repo 274.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) verifyToken tests incl. new ones pass | "Tests: 18 passed, 18 total" |
| (2) doc's jest commands pass | "Tests: 64 passed, 64 total" (tokenExpiry excluded, env-dependent per the doc itself) |
| (3) npm test + build | "579 passed", 5 = pre-existing; build exit 0 |
| (4) lint ≤ 274, none new in changed files | "274 problems"; changed files base 19 → now 19 (test file 15 + middleware/helper 4) |
| (5) Behavior #1 | query read only when `allowQuery` (verifyTokenByQuery); doc updated |
| comments per code-comments.md | one `//` WHY line; removed a stale WHAT comment; no `(#N)` |

## Supersedes: none

## Noticed, not done
- `refreshToken` is still accepted from the query on `/auth/refresh`/`/auth/logout` (Behavior 5) — same URL-leak class, outside #392's wording.

## Seal gate
none yet — `/ship` after SEAL, operator approves each push.
