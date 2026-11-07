# 2026-11-07 - reset-revokes-sessions (diff)

- Worker: implementer · Version: 0.1.0
- Node: `reset-revokes-sessions` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #393` — "Password reset does not revoke existing sessions"
- Status: sealed_pending_verifier

## Hub bytes before
93048

## Feature doc
doctrine/features/auth-password-reset.md

## Feature doc changed: Behavior 4 "Valid unused token → password replaced with a new bcrypt hash, 200." → "Valid unused token → password replaced with a new bcrypt hash, every session of that candidate revoked (same as `POST /auth/logout-all`: old access and refresh tokens → 401), 200." — operator: "Change: reset revokes all sessions — #393" (doc Open questions, 2026-11-07)

## Diff
| File | Why |
|---|---|
| `src/auth/auth.service.ts` | `handlerResetPassword`: `await invalidateAllSessions(candidateId)` after `CandidateModel.updateOne` (import from `@/utils/sessionRevocation`); not reached on an invalid token (early return) |
| `src/__tests__/auth/auth.service.test.ts` | mock `@/utils/sessionRevocation`; success test asserts `invalidateAllSessions('user_id')`; bad-token test asserts it is not called |
| `agent-hub/doctrine/features/auth-password-reset.md` | Behavior 4 + Changelog row |

## Command
- red check: `git stash push src/auth/auth.service.ts` (test edits kept) → `npx jest src/__tests__/auth/auth.service.test.ts` → `git stash pop`
- base: `git stash` → `npm test 2>&1 | grep -E "^FAIL|^Tests:|^Test Suites:|  ●.*›" | sort -u` → `npx eslint src/auth/auth.service.ts src/__tests__/auth/auth.service.test.ts` → `git stash pop`
- after: same `npm test` filter, same eslint, `npx eslint .`, `npm run build` (Typecheck: inside Build), `npx jest src/__tests__/auth/auth.service.test.ts --verbose`

## Output
```
== BASE (service stashed, new assertions kept)
      ✕ updates the password when the reset token is valid (1 ms)
Tests:       1 failed, 12 passed, 13 total

$ npx jest src/__tests__/auth/auth.service.test.ts --verbose   (after)
    handlerResetPassword
      ✓ updates the password when the reset token is valid
      ✓ fails without touching the password when the token is invalid/expired
Tests:       13 passed, 13 total

== BASE npm test
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 576 passed, 581 total
== BASE eslint changed
✖ 10 problems (10 errors, 0 warnings)
== AFTER npm test
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 576 passed, 581 total
== AFTER eslint changed
✖ 10 problems (10 errors, 0 warnings)
✖ 274 problems (274 errors, 0 warnings)
build exit 0
```
No new test cases (assertions added to 2 existing ones), so the count stays 581; the same 5 pre-existing local failures base and after (local `.env` sets `TOKEN_EXP_IN`; no local Chrome).

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) service tests incl. new assertions; success assertion red on base | base "✕ updates the password when the reset token is valid … 1 failed"; after "✓ updates the password …", "✓ fails without touching the password …", "Tests: 13 passed, 13 total" |
| (2) npm test + build | same 5 `●` base and after; "576 passed, 581 total"; build exit 0 |
| (3) lint ≤ 274, none new in changed files | "274 problems"; changed files "10 problems" base = after |
| (4) Behavior #4 | `invalidateAllSessions(candidateId)` after the hash update; doc updated |
| comments per code-comments.md | added: `// A session stolen before the reset must not survive it, same as logout-all.` (one-line WHY, no `(#N)`) |

## Supersedes: none

## Noticed, not done
- Same-second edge, inherited from logout-all: `isSessionRevoked` uses `iat < invalidatedAt`, so a token issued in the very same second as the reset survives.
- `invalidateAllSessions` returning `false` (Redis error) is ignored, same as `authLogoutAll`; reset still → 200.

## Seal gate
Operator, mid-run 2026-11-07: "tự ship không càn hỏi" (ship without asking) — /ship runs on SEAL without a separate approval prompt.
