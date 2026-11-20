# 2026-11-20 - account-settings (diff)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `account-settings` · Task: `/todo #412` (label `enhancement`) · Branch: `feature/412-change-password-email` (cut from `staging` @ f46e58b)
Plan: `evidence/implementer/2026-11-20/account-settings-plan.md`

## Hub bytes before: 99105

## Feature doc: doctrine/features/account-settings.md
Analyst pass 0 (`evidence/analyst/2026-11-20/account-settings-spec.md`, `-spec-r2.md`), operator answered Q1–Q10 "all defaults".

## Feature doc changed
Edge case "Confirm link opened after the password was changed → still valid" (analyst-derived, not an operator answer) → "revocation (password reset/change, logout-all, refresh reuse) after the link was issued → 400". Operator chose "Cancel on revoke" via AskUserQuestion in the main session 2026-11-20, after `/code-review` finding #1. Changelog row added.

## Diff
- `src/utils/emailChange.ts` (new): single-use 24h token store mirroring `utils/emailVerification.ts` (Redis `email-change:<token>` setEx + atomic `getDel`, in-memory fallback with cleanup interval). Payload `{ candidateId, newEmail, issuedAt }` (JSON in Redis, shape-guarded on read).
- `src/auth/auth.validate.ts`: `schemaChangePassword` `{ candidateId, currentPassword, password, repassword }` (register `password` rule), `schemaChangeEmail` `{ candidateId, currentPassword, email }` (register `email` rule). `currentPassword` = string ≤128, required (login rule). `candidateId` allowed because `verifyToken` writes it into every signed-in body; any other key → 400.
- `src/auth/auth.service.ts`: `findWithCurrentPassword` (findById + `+password`, missing → 400 `common.idNotFound`, wrong → 400 `auth.currentPasswordInvalid`). `handlerChangePassword`: check → `password === currentPassword` → 400 `auth.passwordUnchanged` → bcrypt hash → `updateOne` → `invalidateAllSessions` → sign fresh access+refresh (same as login). `handlerChangeEmail`: lowercase new email; check password; equal to current (case-insensitive) → 400 `auth.emailUnchanged`; taken → 409 `EMAIL_EXISTS`; else token + fire-and-forget mail `confirmEmailChange` to the NEW address, path `/confirm-email-change?token=…`. `handlerConfirmEmailChange`: consume token (invalid → 400 `auth.emailChangeTokenInvalid`); sessions revoked after `issuedAt` → same 400; candidate gone → 400 idNotFound; new email taken → 409; else `updateOne { email, emailVerified: true }` + notice `emailChanged` to the OLD address with `{ newEmail }`. No session revocation on confirm. `emailAuthLink` gains optional `params`.
- `src/auth/auth.controller.ts`: `authChangePassword` (validate → service → `setAuthCookies(res, data)` → 200 `data: { token, tokenRefresh }`), `authChangeEmail`, `authConfirmEmailChange` (`?token=`). New handlers narrow `validateSchema`'s result instead of destructuring its `any` `value` (0 new `no-unsafe-*`).
- `src/routers/api/v1/auth.route.ts`: `POST /change-password`, `POST /change-email` = `authLimiter` → `verifyToken` → handler; `GET /confirm-email-change` (global limit only, like `verify-email`). Swagger blocks for all 3.
- `src/services/mail.ts`: kinds `confirmEmailChange`, `emailChanged`; optional `params` filled into `{name}` placeholders in one regex pass (link included).
- `src/locales/{en,vi}.ts`: 7 `auth.*` keys + 2 `mail.*` templates.
- Docs: `.claude/rules/api.md` (3 rows + limiter header), `README.md` feature line.
- Tests: `auth.service.test.ts` (+14 cases, sessionRevocation mock gains `getSessionsInvalidatedAt` + real `isSessionRevoked`; 2 old assertions now expect the 5th `{}` arg; `candidateMock` view avoids new `unbound-method`), `auth.validate.test.ts` (+3), `v1AuthRoute.test.ts` (limiter wiring for the 3 routes), `services/mail.test.ts` (+1 params), `integration/auth.http.test.ts` (+5 real-HTTP flows on Mongo memory server).

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (copied from `doctrine/MEMORY.md`):
- `npx jest src/__tests__/auth src/__tests__/services/mail.test.ts src/__tests__/integration/auth.http.test.ts`
- `npm test`
- `npm run build` (Typecheck = `inside Build`)
- `npm run lint`; per-file/rule diff of `npx eslint . -f json` vs base (`git stash push -u -- src`)
- Red-before: guard short-circuited (`issuedAt < 0 && …`) → the two cancel tests run → file restored from backup

## Output
Targeted:
```
Tests:       110 passed, 110 total
```
Integration, final code (`npx jest src/__tests__/integration/auth.http.test.ts`, tail):
```
  ✓ answers an unknown route with 404 in the standard error shape (4 ms)
    ✓ rejects change-password and change-email without a token (401), confirm without a token (400) (7 ms)
    ✓ change-password logs other sessions out, keeps the caller signed in, and swaps the login password (1837 ms)
    ✓ change-email only takes effect once the link sent to the new address is opened (1162 ms)
    ✓ a password change cancels a pending email change (1143 ms)
    ✓ rate-limits change-password with the shared auth limiter (11th request → 429) (2532 ms)
Tests:       12 passed, 12 total
```
Full:
```
TEST_EXIT=0
Test Suites: 76 passed, 76 total
Tests:       826 passed, 826 total
BUILD_EXIT=0
✖ 273 problems (273 errors, 0 warnings)
before 273 after 273
changed: []
emailChange.ts: 0
```
Red-before (guard disabled):
```
      ✕ confirm rejects a change requested before the sessions were revoked (password reset/change, logout-all) (2 ms)
    ✕ a password change cancels a pending email change (1134 ms)
Tests:       2 failed, 41 passed, 43 total
```
Lint intermediate (caught + fixed before the final run): first full run 294 (controller +12 `no-unsafe-*`, service test +9 `unbound-method`) → both fixed → 273.

## Acceptance
| Criterion (doc) | Evidence |
|---|---|
| validate: missing currentPassword / 11-char password / repassword ≠ / extra key → invalid | `auth.validate.test.ts` "rejects a missing currentPassword, an 11-char password, a mismatched repassword and an extra key" |
| validate: change-email `a@b.io` / missing currentPassword → invalid | "change-email accepts a register-valid email and rejects a non-whitelisted TLD or a missing currentPassword" |
| service: change-password wrong current → 400 `currentPasswordInvalid`, no updateOne/invalidate | "rejects a wrong current password without changing anything" |
| service: new = current → 400 `passwordUnchanged`, no updateOne | "rejects a new password equal to the current one" |
| service: success → hash ≠ plaintext stored, invalidate once with caller id, data has token + tokenRefresh | "stores a new hash, revokes every session and returns a fresh pair" |
| service: change-email wrong current → 400, no mail | "rejects a wrong current password without sending anything" |
| service: taken → 409, same → 400, no mail | "rejects an email taken by another candidate (409) or equal to the current one, case-insensitively (400)" |
| service: success → mail once to NEW address, path `/confirm-email-change?token=`, email not updated | "emails the confirm link to the new address without changing the stored email" |
| service: confirm valid → email + emailVerified set, notice to OLD, no invalidate | "confirm sets the new email + emailVerified, notices the old address and keeps sessions" |
| service: same token twice → 400 | "confirm rejects a token used twice, or an unknown one" (real `emailChange` util, in-memory) |
| service: new email taken meanwhile → 409, no updateOne | "confirm answers 409 without updating when the new email was taken meanwhile" |
| service: prod → no logger arg contains the token | "never logs the change-email token in production, even when the send fails" |
| route: change-* without token → 401; confirm without token → 400 | integration "rejects change-password and change-email without a token (401)…" (real HTTP; wiring also in `v1AuthRoute.test.ts`) |
| observable: old password login 401, new 200; pre-change refresh rejected; returned refresh 200 | integration "change-password logs other sessions out, keeps the caller signed in, and swaps the login password" |
| observable: 11th change-password in 15 min → 429 | integration "rate-limits change-password with the shared auth limiter (11th request → 429)" |
| edge (operator 2026-11-20): revocation after request cancels pending change | service "confirm rejects a change requested before the sessions were revoked…" + integration "a password change cancels a pending email change"; red-before above |
| edge: deleted account at confirm → 400 idNotFound | "confirm answers 400 idNotFound when the account was deleted meanwhile" |
| `npm test`, `npm run build`, `npm run lint` pass | 826/826, BUILD_EXIT=0, lint 273 ≤ 274 baseline with 0 delta per file/rule |
| comments per code-comments.md | Added: `emailChange.ts` header JSDoc (house `@author/@see` like siblings) + `issuedAt` `//` (why); `auth.service.ts` `//` on 400-not-401, plain-compare, same-second revocation, cancel-on-revoke (all why); Vietnamese `/** */` JSDoc on the 3 handlers (matching file idiom); `auth.validate.ts` `//` why `candidateId` allowed; `mail.ts` JSDoc updated + `//` why one pass; test `//` on `candidateMock`, clock shift, logged link. No `(#N)` refs, no history narration. |

## Review
`/code-review medium` (background fork) on the working-tree diff, 9 findings:
1. Pending email-change survives password reset/change/logout-all → **fixed** (operator chose cancel-on-revoke; `issuedAt` vs `getSessionsInvalidatedAt`), doc edge case updated.
2. Several pending tokens live at once → **not changed**: operator decision Q10 (each valid until TTL); with fix 1, owner securing the account cancels them all.
3. `invalidateAllSessions` returning false ignored → **not changed**: same pre-existing behavior as `handlerResetPassword`/logout-all; separate node (Noticed).
4. Same-second `iat < invalidatedAt` → **not changed**: pre-existing mechanism shared with logout-all/reset (Noticed).
5. GET confirm mutates state / no authLimiter → **not changed**: operator Q7 (GET, like `verify-email`, global limit only, spec rule 2); 256-bit token makes guessing moot.
6. Second bcrypt compare for "unchanged" → **fixed** (`password === currentPassword`; current already verified).
7. `emailChange.ts` duplicates the token-store pattern → cleanup, out of scope (Noticed).
8. Token-pair signing duplicated from login → cleanup, out of scope (Noticed; refresh has a 3rd copy already).
9. Sequential placeholder substitution re-substitutes `{link}` inside a value → **fixed** (single regex pass), covered by mail test.
`/security-review`: not run, issue not labeled `security`.

## Supersedes: none
No other active-diagram row cites #412.

## Noticed, not done
- `invalidateAllSessions` failure (Redis write error) is swallowed by every caller (reset-password, logout-all, refresh-reuse, now change-password) — a password change could report "other devices logged out" when it didn't. Own node.
- Revocation is per whole second: a token issued in the same second as the revocation survives (shared by logout-all/reset). Own node if wanted (e.g. ms marker).
- Three near-identical single-use token stores (`passwordReset.ts`, `emailVerification.ts`, `emailChange.ts`) and three copies of access+refresh signing — a `createSingleUseTokenStore`/`issueTokenPair` refactor node.
- Two concurrent confirms to the same free address: the second hits the `email` unique index → Mongo duplicate-key error instead of a clean 409.
- Frontend (`datvt243/resume-vuejs-website`) can now enable the two Account settings buttons; its route `/confirm-email-change` must exist there.
