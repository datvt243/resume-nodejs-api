# 2026-11-07 - atomic-token-consume (diff)

- Worker: implementer · Version: 0.1.0
- Node: `atomic-token-consume` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #385` — "Password-reset and email-verify tokens are not single-use under concurrency"
- Status: sealed_pending_verifier

## Hub bytes before
93048

## Feature doc
doctrine/features/auth-password-reset.md (Behavior #2), doctrine/features/auth-register-login.md (Behavior #4) — unchanged, the fix restores "single-use".

## Diff
| File | Why |
|---|---|
| `src/utils/passwordReset.ts` | Redis branch: `return await redis.getDel(\`password-reset:${token}\`)` replaces `get` + conditional `del` |
| `src/utils/emailVerification.ts` | same, key `email-verify:` |
| `src/__tests__/utils/singleUseTokens.test.ts` | new: fake Redis with only `setEx` + atomic `getDel`; for both token kinds, two concurrent consumes → exactly one returns the candidateId, the other null |

## Command
- base: `git stash` (src edits stashed, new untracked test file kept) → `npm test 2>&1 | grep -E "^FAIL|^Tests:|^Test Suites:|  ●.*›" | sort -u` → `npx eslint src/utils/passwordReset.ts src/utils/emailVerification.ts` → `npx jest src/__tests__/utils/singleUseTokens.test.ts` → `git stash pop`
- after: same `npm test` filter; `npx eslint src/utils/passwordReset.ts src/utils/emailVerification.ts src/__tests__/utils/singleUseTokens.test.ts; echo "eslint exit $?"`; `npx eslint .`; `npm run build` (Typecheck: inside Build); `npx jest src/__tests__/auth/auth.service.test.ts`; `npx jest src/__tests__/utils/singleUseTokens.test.ts --verbose`

## Output
```
$ npx jest src/__tests__/utils/singleUseTokens.test.ts --verbose      (after)
    ✓ lets only one of two concurrent consumes succeed (2 ms)
    ✓ lets only one of two concurrent consumes succeed
Tests:       2 passed, 2 total

== BASE npm test
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
  ● email-verify token (redis) › lets only one of two concurrent consumes succeed
  ● reset token (redis) › lets only one of two concurrent consumes succeed
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
FAIL src/__tests__/utils/singleUseTokens.test.ts
Test Suites: 3 failed, 57 passed, 60 total
Tests:       7 failed, 576 passed, 583 total
== BASE eslint changed          (no output — 0 problems)
== BASE (stashed src, new test file kept) race test
    ✕ lets only one of two concurrent consumes succeed (5 ms)
    ✕ lets only one of two concurrent consumes succeed (1 ms)
Tests:       2 failed, 2 total
== AFTER npm test
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 58 passed, 60 total
Tests:       5 failed, 578 passed, 583 total
== AFTER eslint changed
eslint exit 0

$ npx eslint .
✖ 274 problems (274 errors, 0 warnings)

$ npm run build
build exit 0

$ npx jest src/__tests__/auth/auth.service.test.ts
Tests:       13 passed, 13 total
```
Base → after: the 2 new race tests go red → green; the other 5 failures are the same pre-existing local ones (local `.env` sets `TOKEN_EXP_IN`; no local Chrome) in both runs.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) race test red on base, green after | base "✕ … Tests: 2 failed, 2 total"; after "✓ … Tests: 2 passed, 2 total" |
| (2) auth.service tests | "Tests: 13 passed, 13 total" |
| (3) npm test + build | after: only the 5 pre-existing `●`; "578 passed, 583 total"; build exit 0 (`getDel` typechecks) |
| (4) lint ≤ 274, none in changed files | "274 problems"; changed files "eslint exit 0" |
| (5) Behavior "single-use" | one atomic `getDel` per consume; race test proves only one consume wins |
| comments per code-comments.md | added in both files: `// One atomic GETDEL: a separate GET then DEL lets two concurrent requests both read the token.` (one-line WHY, no `(#N)`); test file `/** */` overview explains why the fake only has `getDel` |

## Supersedes: none

## Noticed, not done
- `GETDEL` needs Redis server ≥ 6.2. Server version not checked here (no Redis image in the compose files; prod Redis is external). On an older server the command errors → caught → `null` → reset/verify fails closed (no token accepted), not open.

## Seal gate
none yet — `/ship` after SEAL, operator approves each push.
