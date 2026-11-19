# Password reset

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/auth-password-reset-spec.md` (rules 1–6); rules 7–11 draft for #461
- Source: backfill from code
- Issues: #385, #387, #393, #461
- Anchors: `src/routers/api/v1/auth.route.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/auth.validate.ts`, `src/utils/passwordReset.ts`, `src/__tests__/auth/auth.service.test.ts`

## Goal
A candidate who forgot their password can set a new one through a
single-use reset link.

## Behavior
1. `POST /api/v1/auth/forgot-password` with `{ email }`: invalid email
   format (incl. a TLD other than `com`/`net`/`vn`, see
   `auth-register-login` rule 1) → 400. Otherwise always 200 with the same generic message,
   whether or not the email is registered.
2. If the email exists, a single-use reset token (15 min TTL, Redis or
   in-memory fallback) is created. No email is sent: the link
   `/reset-password?token=<token>` is only written to the server log.
3. `POST /api/v1/auth/reset-password` with `{ token, password,
   repassword }`: same password rules as register (12–128 chars,
   `passwordRegex`, `repassword` must match) → else 400.
4. Valid unused token → password replaced with a new bcrypt hash, every
   session of that candidate revoked (same as `POST /auth/logout-all`:
   old access and refresh tokens → 401), 200.
   Unknown, expired or already-used token → 400.
5. The token is deleted the first time a request that passes validation
   presents it; a request rejected by validation (rule 3) does not
   consume it.
6. `forgot-password` and `reset-password` share the auth limit with
   register/login: 10 requests per 15 minutes per client IP; the 11th →
   429 `RATE_LIMITED`.

### #461 — deliver the link by email, never log the token (draft)
7. When `NODE_ENV=production`, forgot-password never writes the reset
   token, the link, or the email address to any log. For a registered
   email it logs only that a reset was requested, with the candidate id.
8. If the email exists, the system emails that address a plain-text
   message (no HTML) containing `<APP_URL>/reset-password?token=<token>`,
   sent with Nodemailer over SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
   `SMTP_PASS`), `From` = `MAIL_FROM`. The message is in the request's
   `?lang=` language (`vi`/`en`, default as today).
9. The mail service is a single module that tests replace with a mock
   (`jest.mock`); `npm test` makes no real SMTP connection.
10. The forgot-password response stays exactly as rule 1 (200, same
    generic message) in every case, including a failed send. A failed
    send is logged as an error without the token or link.
11. SMTP not configured:
    - `NODE_ENV !== production` → the full link is logged to the console
      as today, nothing is sent.
    - `NODE_ENV=production` → a warning without the token is logged and
      sending is skipped; the app still starts and the response is still
      rule 1's 200.

## Acceptance criteria
- `npx jest src/__tests__/auth/auth.service.test.ts` passes.
- forgot-password for a registered and an unregistered email → both HTTP 200 with identical `message`.
- reset-password reusing the same token a second time → HTTP 400.
- (#461) `npx jest src/__tests__/auth/auth.service.test.ts` has a
  forgot-password test that asserts the mocked mail service was called
  exactly once with the registered email and a link containing the
  token, and not called for an unregistered email.
- (#461) A test with `NODE_ENV=production` asserts no `logger` call
  argument contains the reset token value (`'raw-token'` in the existing
  fixture).
- (#461) A test with the mail mock rejecting → forgot-password still
  resolves `{ success: true }` with the generic message, and the logged
  error contains no token.
- (#461) A test with `NODE_ENV=production` and no `SMTP_HOST` → mail
  service not called (or no-op), a `logger.warn` is called, no logger
  argument contains the token.
- (#461) `npm run build` passes (typecheck incl. the new mail module).

## Edge cases
- Token presented after 15 minutes → 400.
- Redis down → token kept in process memory, lost on restart.
- (#461) Unregistered email → no mail sent, no token created, same 200.
- (#461) SMTP env missing → rule 11 (dev: log link; prod: warn, skip, 200).
- (#461) SMTP send error/timeout → rule 10 (200, error logged without token).
- (#461) `APP_URL` missing → open question Q9.
- (#461) `?lang=` absent or unsupported → same default language the API already uses for `t()` messages.

## Out of scope
- ~~Sending real emails (stub logs the link).~~ → in scope from #461.
- (#461) HTML email design, bounce/complaint handling, a mail queue/retry
  worker, per-email resend throttling beyond the auth limit (#387).

## Open questions
- A successful reset does not revoke existing sessions (no logout-all), so a stolen session survives a password change. Intended? → **Answer (operator 2026-11-07):** Change: reset revokes all sessions — #393
- Requesting several resets leaves several valid tokens alive at once. Intended? → **Answer (operator 2026-11-07):** Intended (each expires in 15 min)
- forgot-password has no per-email throttle beyond the global auth rate limit. Enough? → **Answer (operator 2026-11-07):** covered by #387
- With Redis, `consumeResetToken` does `GET` then `DEL` (not atomic, `utils/passwordReset.ts`), so two concurrent resets with the same token can both succeed — single-use is not guaranteed under concurrency (same pattern in `utils/emailVerification.ts`). Use `GETDEL`? → **Answer (operator 2026-11-07):** Bug — #385

### #461 (answered by operator 2026-11-19, round 2)
- Q1. Provider? → **Answer:** Nodemailer over SMTP, configured by `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` (provider-agnostic).
- Q2. Sender? → **Answer:** `From` from env `MAIL_FROM`.
- Q3. Link base URL? → **Answer:** env `APP_URL`; reset link = `APP_URL/reset-password?token=...`.
- Q4. Language/format? → **Answer:** follows request `?lang=` (vi/en); plain text only.
- Q5. Send failure? → **Answer:** still the generic 200; log the error without the token.
- Q6. Prod log on reset request? → **Answer:** candidate id only (no email/PII).
- Q7. No SMTP configured? → **Answer:** non-production → keep logging the full link to console as today; production → log a warning (no token), skip sending, do not fail startup.

### #461 — left for the implementer (does not change Behavior)
- Q9. `APP_URL` unset while SMTP is set: not specified by the operator. Treat as rule 11 ("not configured" — dev logs the link, prod warns and skips) unless the operator says otherwise; implementer must not send a link without a base URL.

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/auth-password-reset-spec.md` | - |
| 2026-11-07 | Behavior 4: reset also revokes every session | operator answer #393 | reset-revokes-sessions |
| 2026-11-08 | Behavior 6: auth limit 10/15 min shared with register/login | operator answer #387 | auth-credential-limit |
| 2026-11-19 | Rules 7–10 + criteria/edge cases/out-of-scope + Q1–Q7 for emailing the link and not logging the token (draft) | #461 | - |
| 2026-11-19 | Operator answered Q1–Q7; rules 7–11 made concrete (SMTP env, MAIL_FROM, APP_URL, lang, failure + no-SMTP handling) | #461 round 2 | - |
