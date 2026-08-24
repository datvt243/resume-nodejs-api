# 2026-08-25 — add-forgot-reset-password-flow (implement)

- Worker: implementer
- Version: 0.1.0
- Node: `add-forgot-reset-password-flow` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "Issue #70: Forgot password / reset password flow —
  POST /api/v1/auth/forgot-password + POST /api/v1/auth/reset-password"
  (scope resolved by operator via `AskUserQuestion`: stub email delivery —
  see `forgot-password-reset-flow-plan.md`)

## Diff
| File | Why |
|---|---|
| `src/utils/passwordReset.ts` (new) | Single-use, 15-min TTL reset token store — Redis `setEx`/`get`/`del` with in-memory `Map` fallback, mirrors the existing `utils/tokenBlacklist.ts` pattern exactly. |
| `src/auth/auth.validate.ts` | Added `schemaForgotPassword` (email only) and `schemaResetPassword` (token + password + repassword, `.with()` match check, reuses the file's existing `password` schema). |
| `src/auth/auth.service.ts` | Added `handlerForgotPassword` (looks up email, always returns the same generic message to avoid user enumeration, logs the reset link instead of emailing — stub per operator decision) and `handlerResetPassword` (consumes the token, bcrypt-hashes, `CandidateModel.updateOne`). `user._id` guarded (`user && user._id`) before `.toString()` — same class of bug as the sealed `fix-candidate-me-candidateid-not-string` trap (ObjectId vs string), avoided here by construction. |
| `src/auth/auth.controller.ts` | Added `authForgotPassword` / `authResetPassword`, same `validateSchema` → `formatReturn` → `handleError` shape as the existing `authRegister`/`authLogin`. Validation failures return `400` (not the `401` the existing register/login use — that looked like a pre-existing quirk, not something to replicate in new code; out of `SmallestDiff` scope to "fix" the old ones). |
| `src/routers/api/v1/auth.route.ts` | Added `POST /forgot-password`, `POST /reset-password` routes with Swagger docs, same style as `/register`/`/login`. Already covered by the router's existing `authLimiter` (150 req/15 min). |
| `src/locales/vi.ts`, `src/locales/en.ts` | Added 3 new `auth.*` keys (`forgotPasswordRequested`, `resetTokenInvalid`, `resetPasswordSuccess`) in both languages, following the existing i18n convention from `feat-i18n-api-messages-auth`/`feat-i18n-full-coverage`. |
| `src/__tests__/auth/auth.service.test.ts` | Added 4 tests: `handlerForgotPassword` (token created when email exists; same generic message when it doesn't, and `createResetToken` NOT called — proves no user enumeration) and `handlerResetPassword` (password updated on valid token; nothing touched on invalid/expired token). Mocks `@/utils/passwordReset` and `@/logger`, same mocking style as the rest of the file. |

## Command
```
npm test
```
(run from `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied verbatim from `doctrine/MEMORY.md`)

## Output (verbatim, tail)
```
PASS src/__tests__/auth/auth.service.test.ts
  auth.service
    isEmailAlreadyExists
      ✓ should return true if email exists (3 ms)
      ✓ should return false if email does not exist (1 ms)
    handlerRegister
      ✓ should register successfully with new email
      ✓ should fail if email already exists
    handlerLogin
      ✓ should login successfully with correct credentials (1 ms)
      ✓ should fail if user not found (1 ms)
      ✓ should fail if password incorrect
    handlerForgotPassword
      ✓ creates a reset token when the email exists
      ✓ returns the same generic success message when the email does not exist (no user enumeration)
    handlerResetPassword
      ✓ updates the password when the reset token is valid (1 ms)
      ✓ fails without touching the password when the token is invalid/expired

...

Test Suites: 9 passed, 9 total
Tests:       49 passed, 49 total
Snapshots:   0 total
Time:        5.293 s
Ran all test suites.
```
Baseline before this task's tests were added: 45 passed (see prior sealed
note `evidence/verifier/2026-08-22/fix-redis-init-blocks-dev-startup-seal.md`
for the last known-clean run at 9 suites). This run: 9 suites, 49 tests, 0
failures — the +4 are exactly the new `handlerForgotPassword`/
`handlerResetPassword` tests.

Also ran `npm run build` (extra, not the required gate) — `tsc && npm run
copy` completed with no output (no errors) and the `copy` step ran
normally.

## Acceptance
| Criterion | Evidence |
|---|---|
| `POST /api/v1/auth/forgot-password` exists, validates `email`, generic success response either way | `auth.route.ts` route added; `handlerForgotPassword` tests above — both branches return the identical message |
| `POST /api/v1/auth/reset-password` exists, validates `token`+`password`+`repassword` match, single-use token, bcrypt-hashes new password | `auth.route.ts` route added; `schemaResetPassword.with('password','repassword')`; `handlerResetPassword` test — `CandidateModel.updateOne` called with the bcrypt hash only when `consumeResetToken` resolves non-null |
| No real email sent (operator-approved stub) | `handlerForgotPassword` calls `logger.info(...)`, no mail dependency added — confirmed no new mail package in this diff |
| `npm test`: all tests pass | Verbatim output above — `Tests: 49 passed, 49 total` |
| i18n keys added both languages | `vi.ts`/`en.ts` diff rows above |

## Noticed, not done (out of scope)
- Existing `authRegister`/`authLogin` return `401` on validation failure instead of `400` — pre-existing quirk, not touched (`SmallestDiff`).
- Real email delivery (nodemailer/SMTP or a transactional API) — explicitly deferred by operator decision; would need its own node once a provider is chosen.
- No rate limit specific to `/forgot-password` beyond the router-wide `authLimiter` — could be abused to spam token generation/log lines; not requested by issue #70, flagged here for a future node if it becomes a real problem.

## Seal gate
No outward-facing action (no commit/push) — nothing to gate yet. `src/` diff shown above and in the real files for operator review.
