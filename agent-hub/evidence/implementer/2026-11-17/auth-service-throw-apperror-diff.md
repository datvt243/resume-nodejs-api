# 2026-11-17 - auth-service-throw-apperror (diff)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `auth-service-throw-apperror` · Branch: `refactor/460-auth-service-throw` (worktree `/Users/_david/Workspace/Project/resume/resume-nodejs-api-460`, base `origin/staging` @ 7bb612f)
Task: GitHub #460 "Auth service: throw AppError instead of returning { success: false }" (verbatim title; body in plan note)
Status: sealed_pending_verifier

## Hub bytes before: 97847

## Feature doc: doctrine/features/auth-register-login.md, doctrine/features/auth-password-reset.md
Behavior unchanged: register duplicate → 409 `EMAIL_EXISTS` (register-login #2); bad credentials → 401 `INVALID_CREDENTIALS`; unknown/expired/used verify token → 400 (register-login, line 39); unknown/expired/used reset token → 400 (password-reset, line 26). Not edited.

## Acceptance criteria clarified
See plan note: `grep "success: false" src/auth` → scoped to `src/auth/auth.service.ts` + "controller no longer branches on a service `success` flag". Remaining controller hits are `formatReturn(res, { success:false })` validation/no-token responses (house idiom, already routed through `sendError` at `utils/helper.ts:166-169`). Flagged to operator.

## Diff
| File | Why |
|---|---|
| `src/auth/auth.service.ts` | 5 `return { success:false, message }` → `throw`: register `AppError{EMAIL_EXISTS}`, verify-email `BadRequestError`, login ×2 `InvalidCredentialsError`, reset-password `BadRequestError`; i18n `t(key, lang)` messages kept |
| `src/auth/auth.controller.ts` | Dropped the `success` branching in register/login/verify-email/reset-password (errors now reach `handleError` via the existing `catch`); unused `AppError`/`InvalidCredentialsError` imports removed |
| `src/__tests__/auth/auth.service.test.ts` | 5 failure tests now assert `rejects.toMatchObject({ errorCode, statusCode, message })`; + 1 test: invalid-credentials message localized with `lang='en'` (replaces the controller-level fallback-localization test whose branch no longer exists) |
| `src/__tests__/auth/auth.controller.test.ts` | duplicate-email / failed-login tests: service rejects → `formatReturn` not called, `handleError` called with the error (no cookies on failed login); removed the controller fallback-message test (branch gone, proof moved to service test) |
| `src/__tests__/contract/errorEnvelope.test.ts` | + `it.each` contract: real `authResetPassword` / `authVerifyEmail` with the token consumer resolving `null`, error piped through real `errorsMiddleware` → status 400, envelope `{ success:false, error:{ code:'BAD_REQUEST', message } }`, exact localized message |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api-460` (the worktree — same repo, branch checkout; `node_modules` symlinked to the primary checkout's):
- `npx jest src/__tests__/auth src/__tests__/contract`
- `npm test`
- `npm run build` (Typecheck row: `inside Build`)
- `npm run lint`
- per-file lint count, before (`git stash`) vs after, on the 5 touched files: `npx eslint <files> -f json`

## Output
`npx jest src/__tests__/auth src/__tests__/contract`:
```
Test Suites: 9 passed, 9 total
Tests:       83 passed, 83 total
```
`npm test`:
```
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 1 failed, 71 passed, 72 total
Tests:       4 failed, 779 passed, 783 total
```
The 4 failures are pre-existing/environmental — on the base (`git stash`, diff removed) `npx jest src/__tests__/services/atsPdfIntegration.test.ts` → `Tests:       4 failed, 4 total`; cause: `Could not find Chrome (ver. 127.0.6533.88)` (real-Puppeteer suite; skipped under `CI_NO_CHROME` per `CLAUDE.md`). No auth/contract test touches Puppeteer.
`npm run build`:
```
> resume-nodejs-api@2.8.0 copy
> cp -R ./src/public ./dist/
build_exit=0
```
`npm run lint`:
```
✖ 274 problems (274 errors, 0 warnings)
```
Per-file errors (after | before): `auth.controller.test.ts` 0|0 · `auth.service.test.ts` 10|10 · `errorEnvelope.test.ts` 0|0 · `auth/auth.controller.ts` 19|19 · `auth/auth.service.ts` 0|0.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) no `success: false` in `auth.service.ts`; controller no longer branches on service `success` | `grep -n "success: false" auth.service.ts` → no output, `exit=1`; controller diff removes `if (!success)`, `if (!_result.success)`, `StatusCodes[success ? 'OK' : 'BAD_REQUEST']` ×2 |
| (2) contract tests assert `{ success:false, error:{ code, message } }` for invalid reset/verify tokens | `errorEnvelope.test.ts` new `invalid %s token → 400 BAD_REQUEST envelope` (2 cases, via `expectEnvelope` = keys exactly `error,success`, `error.code`, string `error.message`) — inside "Tests: 83 passed, 83 total" |
| (3) behavior per feature docs unchanged (409/401/400) | service tests assert `statusCode: 409/401/400` + codes; contract test asserts status 400 end-to-end — inside "Tests: 83 passed" |
| (4) `npm test` + `npm run build` green, lint ≤ baseline, none new in touched files | build_exit=0; tests 779 passed, only the 4 pre-existing Chrome failures (identical on base); lint 274 = baseline 274; per-file counts identical before/after |
| comments per code-comments.md | One comment touched: the existing login enumeration `//` moved in the test file and reworded "message" → "error" (WHY comment, single `//`); no new comments in `src/` shipped code |

## Supersedes: none
`grep -n "#460" haven/diagrams/dev-loop.prime-mermaid.md` → 1 hit (this node only).

## Review
`/code-review medium` was invoked but its forked run executed in the primary checkout (`resume-nodejs-api`, branch `fix/475-logout-refresh-token`) and reviewed `git diff HEAD~1` there (PR #482 / #475 logout code) — not this diff; its 7 findings are all on `authLogout`/`authRefreshToken`/`helper-auth.ts`, none on lines this node touches → not applicable here (see Noticed). Fallback per step 6c: inline pass over the touched files in full + callers:
- Only caller of the 5 service handlers is `src/auth/auth.controller.ts` (grep, excl. tests); controllers wired by `routers/api/v1/auth.route.ts` and `routers/api/v2/auth.route.ts` — both get the new behavior via the same controllers.
- Thrown errors reach the envelope: each controller already `catch`es → `handleError` → `toAppError` returns an `AppError` unchanged (`utils/helper.ts:44`) → `errorsMiddleware` → `sendError`. Proven end-to-end by the new contract test.
- Login enumeration invariant preserved: same `InvalidCredentialsError` + same message for unknown email and wrong password.
- Reset/verify failure still short-circuits before any write (`bcryptGenerateSalt`/`updateOne`/`invalidateAllSessions` not called — asserted).
- Findings: none (correctness/security).

## Noticed, not done
- `authVerifyEmail` / `authResetPassword` still destructure `success` from the service, which is now always `true` — harmless; left for `SmallestDiff`.
- `auth.loginFailed` i18n key was referenced only by the removed login fallback and does not exist in `src/locales` (grep empty) — nothing to clean.
- The misdirected `/code-review` produced 7 findings on the #475 logout/refresh code (forced-logout via CSRF gap on `/logout` when `token` comes from body, rotated-token marker overwritten by logout, `/refresh` header-precedence, ignored `addToBlacklist` result, refresh-only logout → 400, unverified refresh strings blacklisted, boolean-trap param in `helper-auth.ts`). Belong to #475's own review, not this node.
- Pre-existing lint errors in touched files (`auth.controller.ts` 19, `auth.service.test.ts` 10) — unchanged counts.

## Seal gate: none
No commit/push/external action taken.
