# 2026-11-08 - login-password-any-length (diff, round 2)
- Worker: implementer · Version: 0.1.0
- Node: `login-password-any-length` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #390` — "Login rejects accounts whose password predates the current password rules"
- Plan: `evidence/implementer/2026-11-08/login-password-any-length-plan.md`
- REOPEN addressed: `evidence/verifier/2026-11-08/login-password-any-length-reopen.md` — wrong password → 401 needed a cited named test (incl. a password < 12 chars). No code change: existing tests already cover each link; round 1 only cited a bare count.

## Hub bytes before
96376

## Feature doc
`doctrine/features/auth-register-login.md`

## Feature doc changed: Behavior #5 "validated with the same `email` and `password` rules as register (TLD whitelist, 12–128 chars, `passwordRegex`)" → "same `email` rule as register and a password that is only a non-empty string ≤ 128 chars — no length minimum or `passwordRegex`"; acceptance "wrong (but rule-conforming) password" → "wrong password" + new `auth.validate.test.ts` criterion; Changelog row — operator: "Bug: login should only require a non-empty password — #390" (2026-11-07, recorded in the doc's Open questions)

## Diff
| file | why |
|---|---|
| `src/auth/auth.validate.ts` | `schemaAuthLogin.password` = `Joi.string().max(PASSWORD_MAX_LENGTH).label('Password').required()` (Joi rejects `''` by default); register/reset keep the shared `password` rule; 1-line why comment |
| `src/__tests__/auth/auth.validate.test.ts` (new) | short legacy password accepted by login; missing/empty/>128 rejected; register still rejects the short one |

No `.trim().strict()` on the login rule: a stored legacy password may contain surrounding spaces and must compare as typed. Wrong password → 401 comes from `authLogin` (service), unchanged.

## Command
- `npx jest src/__tests__/auth` ; `npx jest src/__tests__/auth/auth.validate.test.ts` (new code, then with `git show HEAD:src/auth/auth.validate.ts` swapped in, then restored)
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npx jest src/__tests__/auth
FAIL src/__tests__/auth/tokenExpiry.test.ts
    ✕ falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default) (12 ms)
Tests:       1 failed, 68 passed, 69 total

old schema + new test:
    ✕ accepts a short password that predates the current strength rules (2 ms)
    ✓ rejects a missing, empty or over-long password (1 ms)
    ✓ register still enforces the strength rules
Tests:       1 failed, 2 passed, 3 total
new schema (restored):
Tests:       3 passed, 3 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 62 passed, 64 total
Tests:       5 failed, 622 passed, 627 total

npm run build | grep -c "error TS"
0
npm run lint
✖ 274 problems (274 errors, 0 warnings)
per touched file (now | base):
src/auth/auth.validate.ts | 0 | 0
src/__tests__/auth/auth.validate.test.ts | 0 | 0 (new file)
```
The 5 failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/cv-upload-temp-rename-diff.md`; 622 = 619 + 3 new tests.

## Round 2 — wrong password stays 401 (named tests)
Command: `npx jest src/__tests__/auth/auth.service.test.ts src/__tests__/auth/auth.controller.test.ts src/__tests__/auth/auth.validate.test.ts --verbose -t "should fail if user not found|should fail if password incorrect|answers a failed login with 401|schemaAuthLogin"`
```
PASS src/__tests__/auth/auth.validate.test.ts
    ✓ accepts a short password that predates the current strength rules (2 ms)
    ✓ rejects a missing, empty or over-long password (1 ms)
    ✓ register still enforces the strength rules
PASS src/__tests__/auth/auth.service.test.ts
      ✓ should fail if user not found (3 ms)
      ✓ should fail if password incorrect
PASS src/__tests__/auth/auth.controller.test.ts
      ✓ answers a failed login with 401 INVALID_CREDENTIALS via errorsMiddleware (28 ms)
Tests:       30 skipped, 6 passed, 36 total
```
Chain for a short wrong password, each link a named passing test:
1. validation — `schemaAuthLogin` now lets a short password through ("accepts a short password…", `abc123`, 6 chars).
2. service — `handlerLogin` "should fail if password incorrect" (`src/__tests__/auth/auth.service.test.ts:161-171`) uses `password: 'wrongpass'` (9 chars, < 12) and asserts `{ success: false, message: 'Email hoặc mật khẩu không chính xác' }`; "should fail if user not found" (`:152-159`, `password: 'pass'`, 4 chars) asserts the identical object → same `error.message` for both.
3. controller — "answers a failed login with 401 INVALID_CREDENTIALS via errorsMiddleware" (`src/__tests__/auth/auth.controller.test.ts:179-191`) → `statusCode: 401, errorCode: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không chính xác'`.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) Behavior #5 — short legacy password passes login validation, empty/missing/>128 → 400 | "accepts a short password…" + "rejects a missing, empty or over-long password" in `Tests: 3 passed, 3 total` |
| (1) register keeps strength rules | "register still enforces the strength rules" |
| (1) wrong password (incl. < 12 chars) and unknown email → 401, same `error.message` | Round 2: "should fail if password incorrect" (`wrongpass`, 9 chars) + "should fail if user not found" (same object) + "answers a failed login with 401 INVALID_CREDENTIALS via errorsMiddleware" — `Tests: 30 skipped, 6 passed, 36 total` |
| (2) test passes, red on old schema | `3 passed, 3 total`; old: `1 failed, 2 passed, 3 total` |
| (3) `npm test` no new failures | `5 failed, 622 passed, 627 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file 0 |
| comments per code-comments.md | one 1-line `//` WHY above `schemaAuthLogin`, no issue ref |

## Supersedes: none
`grep '#390' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done: none
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
