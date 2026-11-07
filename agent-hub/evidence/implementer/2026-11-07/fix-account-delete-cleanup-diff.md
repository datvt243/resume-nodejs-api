# 2026-11-07 - fix-account-delete-cleanup (diff)

- Worker: implementer · Version: 0.1.0
- Node: `fix-account-delete-cleanup` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #395` — "Account delete should remove visits and revoke all sessions"
- Status: sealed_pending_verifier

## Hub bytes before
93048

## Feature doc
doctrine/features/candidate-account.md

## Feature doc changed: Behavior 6 "…uploaded CV file on disk, and every uploaded section image on disk. → 200" → "…every uploaded section image on disk, and every `Visit` of the candidate; then revokes every session (same as `POST /auth/logout-all`)…" — operator: "Bug: delete visits + revoke all sessions — #395" (recorded in the doc's Open questions, 2026-11-07)

## Diff
| File | Why |
|---|---|
| `src/candidate/candidate.service.ts` | `handlerDelete`: `MODELS.Visit.deleteMany({ candidateId: _id }).exec()` before the candidate delete; `invalidateAllSessions(_id)` after it (import from `@/utils/sessionRevocation`) |
| `src/__tests__/candidate/candidate.service.test.ts` | mock `@/utils/sessionRevocation`; default `Visit.deleteMany` mock in the handlerDelete `beforeEach`; not-found test asserts neither is called; new test asserts both are called with the id |
| `agent-hub/doctrine/features/candidate-account.md` | Behavior 6 + Changelog row |

## Command
- `npx jest src/__tests__/candidate/candidate.service.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build)
- `npm run lint` (baseline 274)

## Output
```
$ npx jest src/__tests__/candidate/candidate.service.test.ts
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total

$ npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 577 passed, 582 total

$ npm run build
build exit 0

$ npx eslint .
✖ 274 problems (274 errors, 0 warnings)
$ npx eslint src/candidate/candidate.service.ts src/__tests__/candidate/candidate.service.test.ts
✖ 5 problems (5 errors, 0 warnings)      # same 5 on the base (git stash): "✖ 5 problems (5 errors, 0 warnings)"
```

Pre-existing failures, proven on the clean base (`git stash -u`, then
`npx jest src/__tests__/auth/tokenExpiry.test.ts src/__tests__/services/atsPdfIntegration.test.ts`):
```
● access vs refresh token expiry … › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
Tests:       5 failed, 2 passed, 7 total
```
Local env only: `.env` sets `TOKEN_EXP_IN` (line 27), and no local Chrome for Puppeteer. Untouched by this diff.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) service test incl. new assertions passes | "Tests: 10 passed, 10 total" |
| (2) `npm test` + `npm run build` pass | build exit 0; npm test "577 passed", the 5 failures are the same 5 as on the clean base (above) |
| (3) lint ≤ 274, none new in changed files | "274 problems"; changed files 5 = base 5 |
| (4) matches Behavior #6 | code: Visit.deleteMany + invalidateAllSessions; doc updated |
| comments per code-comments.md | one `//` WHY line, no `(#N)` ref |

## Supersedes: none

## Noticed, not done
- `tokenExpiry.test.ts` fails whenever the local `.env` sets `TOKEN_EXP_IN` (test does not isolate env).
- Delete order: if `invalidateAllSessions` fails it logs and returns false; delete still returns 200 (same as `authLogoutAll`, which also ignores the boolean).

## Seal gate
none (no commit/push yet — `/ship` runs after SEAL, approved by the operator choosing "Ship each")
