# 2026-11-07 - logout-revokes-refresh (diff)

- Worker: implementer · Version: 0.1.0
- Node: `logout-revokes-refresh` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #391` — "Logout leaves the refresh token valid"
- Status: sealed_pending_verifier

## Hub bytes before
93048

## Feature doc
doctrine/features/auth-session-tokens.md

## Feature doc changed: Behavior 7 "…else the access token is blacklisted until its own expiry, auth cookies are cleared, 200." → "…the access token is blacklisted until its own expiry, the refresh token sent with the request (header/body/query/cookie `refreshToken`, if any) is blacklisted too — a later refresh with it → 401 `TOKEN_REVOKED` — auth cookies are cleared, 200." — operator: "Bug: revoke the refresh token too — #391" (doc Open questions, 2026-11-07)

## Diff
| File | Why |
|---|---|
| `src/auth/auth.controller.ts` | `authLogout`: after blacklisting the access token, `extractTokenFromRequest(req, 'refreshToken')` and `addToBlacklist` it when present |
| `src/__tests__/auth/auth.controller.test.ts` | new test "also blacklists the refresh token sent with the request": extractor returns `refresh_token` for field `refreshToken`, `access_token` otherwise; both passed to `addToBlacklist` |
| `agent-hub/doctrine/features/auth-session-tokens.md` | Behavior 7 + Changelog row |

## Command
- base: `git stash` → `npm test 2>&1 | grep -E "^FAIL|^Tests:|^Test Suites:|  ●.*›" | sort -u` → `npx eslint src/auth/auth.controller.ts src/__tests__/auth/auth.controller.test.ts` → `git stash pop`
- after: same `npm test` filter, same eslint, `npx eslint .`, `npm run build` (Typecheck: inside Build)
- `npx jest src/__tests__/auth/auth.controller.test.ts src/__tests__/auth/refreshToken.test.ts src/__tests__/auth/refreshTokenReuse.test.ts --verbose` (grepped for the 2 relevant test names + summary)

## Output
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
== BASE eslint changed
✖ 19 problems (19 errors, 0 warnings)
== AFTER npm test
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 577 passed, 582 total
== AFTER eslint changed
✖ 19 problems (19 errors, 0 warnings)
✖ 274 problems (274 errors, 0 warnings)
build exit 0
      ✓ also blacklists the refresh token sent with the request
    ✓ returns 401 TOKEN_REVOKED when refresh token is blacklisted (1 ms)
Tests:       37 passed, 37 total
```
Same 5 pre-existing local failures base and after (local `.env` sets `TOKEN_EXP_IN`; no local Chrome); 581 → 582 = the 1 new test.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) auth.controller tests incl. new one | "✓ also blacklists the refresh token sent with the request"; "Tests: 37 passed, 37 total" (3 auth suites) |
| (2) blacklisted refresh → 401 TOKEN_REVOKED | "✓ returns 401 TOKEN_REVOKED when refresh token is blacklisted" (existing test; `addToBlacklist` without `rotatedAt` stores `revoked`, so `getRotatedAt` → null and `isBlacklisted` → true) |
| (3) npm test + build | same 5 `●` base and after; "577 passed, 582 total"; build exit 0 |
| (4) lint ≤ 274, none new in changed files | "274 problems"; changed files "19 problems" base = after |
| (5) Behavior #7 | code + doc updated (above) |
| comments per code-comments.md | added: `// Otherwise the refresh token could still mint a fresh pair and revive the session.` (one-line WHY, no `(#N)`) |

## Supersedes: none

## Noticed, not done
- (1)+(2) are two unit links (logout blacklists → blacklisted refresh is rejected); no single end-to-end test with the real blacklist. Not live-tested over HTTP.
- A logout carrying only a refresh token (no access token) still → 400, unchanged (issue says "also").

## Seal gate
none yet — `/ship` after SEAL, operator approves each push.
