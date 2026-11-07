# 2026-11-07 - restrict-query-token (diff, round 2)

- Worker: implementer · Version: 0.1.0
- Node: `restrict-query-token` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #392` — "Restrict the `?token=` query parameter to `/download-pdf`"
- Status: sealed_pending_verifier
- Supplements `restrict-query-token-diff.md` (round 1, kept). Answers `evidence/verifier/2026-11-07/restrict-query-token-reopen.md` items 1–4. No `src/` change since round 1.

## Hub bytes before
93048

## Feature doc
doctrine/features/auth-session-tokens.md (Behavior 1 changed — see round 1 note, operator answer "Change: only /download-pdf — #392")

## Diff
Same as round 1 (`src/utils/helper-auth.ts`, `src/middlewares/verifyToken.middleware.ts`, `src/__tests__/middlewares/verifyToken.test.ts`, feature doc).

## Command
- base: `git stash` → `npm test` → `npx eslint src/middlewares/verifyToken.middleware.ts src/utils/helper-auth.ts src/__tests__/middlewares/verifyToken.test.ts` → `git stash pop`
- after: same `npm test` + same eslint, `npx eslint .`, `npx jest src/__tests__/middlewares/verifyToken.test.ts --verbose`
- `npm test` output filtered with `grep -E "^FAIL|^Tests:|^Test Suites:|  ●.*›" | sort -u`

## Output
REOPEN item 1 — failing tests, base vs after (round 1 cited a note that only exists on branch `395-account-delete-should`; replaced by this direct run):
```
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
== AFTER npm test
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 579 passed, 584 total
```
REOPEN item 2 — lint on the 3 changed files:
```
== BASE
✖ 19 problems (19 errors, 0 warnings)
== AFTER
✖ 19 problems (19 errors, 0 warnings)
$ npx eslint .
✖ 274 problems (274 errors, 0 warnings)
```
REOPEN item 3 — the 3 new tests:
```
    query ?token=
      ✓ ignores a query token on a normal protected route (401 NO_TOKEN)
      ✓ falls through to the cookie when a query token is ignored
      ✓ accepts a query token on verifyTokenByQuery (download-pdf) (1 ms)
Tests:       18 passed, 18 total
```
Build (round 1, no src change since): `build exit 0`.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) verifyToken tests incl. new ones | 3 `✓` lines above; "Tests: 18 passed, 18 total" |
| (2) doc's jest commands | round 1: "Tests: 64 passed, 64 total" |
| (3) npm test + build | same 5 `●` failures base and after; 581 → 584 (+3 new); build exit 0 |
| (4) lint ≤ 274, none new in changed files | "274 problems"; changed files "19 problems" base = after |
| (5) Behavior #1 | `✓ ignores a query token … (401 NO_TOKEN)`, `✓ falls through to the cookie …`, `✓ accepts a query token on verifyTokenByQuery (download-pdf)` |
| comments per code-comments.md (item 4) | removed: `// keep for compatibility; extractToken already supports query param` (WHAT, now false); added: `// Only for links opened outside the SPA (\`GET /download-pdf\`): a token in a URL leaks via logs, history and referrers.` (one-line WHY, `//`, no `(#N)`) |

## Supersedes: none

## Noticed, not done
- `refreshToken` still accepted from the query on `/auth/refresh`/`/auth/logout` (Behavior 5) — outside #392's wording.

## Seal gate
none yet — `/ship` after SEAL, operator approves each push.
