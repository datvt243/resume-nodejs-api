# Account settings: change password and change email

- Status: verified — verified by `evidence/verifier/2026-11-20/account-settings-seal.md`
- Source: feature request
- Issues: #412
- Anchors: `src/routers/api/v1/auth.route.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/auth.validate.ts`, `src/utils/sessionRevocation.ts`, `src/utils/emailVerification.ts`, `src/services/mail.ts`, `src/utils/authCookies.ts`, `src/middlewares/verifyToken.middleware.ts`, `src/middlewares/rateLimit.middleware.ts`, `src/models/candidate.model.ts`

## Goal
A signed-in candidate changes their password or their email from the
frontend Account settings page (`/dashboard/account-settings`), which
today shows both as disabled "coming soon" because the API only has
forgot/reset by token.

## Behavior

### Shared
1. `POST /api/v1/auth/change-password` and `POST /api/v1/auth/change-email`
   require a valid access token (`verifyToken`: Bearer header, or httpOnly
   cookie + CSRF double-submit, see `auth-session-tokens`). No/invalid/
   revoked token → 401. The caller is always `req.user._id`, never a body
   field.
2. Both routes use the auth limit (`authLimiter`): 10 requests per 15
   minutes per client IP, shared with register/login/forgot/reset; the
   11th → 429 `RATE_LIMITED`. The confirm route (rule 9) has only the
   global limit, like `verify-email`.
3. `currentPassword` (both routes) is a required non-empty string ≤ 128
   chars (no strength rule, like login). It is compared to the caller's
   stored bcrypt hash (`.select('+password')`). Wrong → 400 `BAD_REQUEST`,
   message `auth.currentPasswordInvalid`; nothing is changed, no session
   revoked, no token created, no email sent.
4. Caller's id not found → 400 `common.idNotFound` (as `candidate-account`
   rule 7).

### Change password
5. Body `{ currentPassword, password, repassword }`, unknown keys → 400.
   `password` follows exactly the register rules (the `password` Joi rule
   in `auth.validate.ts`: 12–128 chars, `passwordRegex`); `repassword` must
   equal `password`. Invalid → 400 `VALIDATION_ERROR` with per-field
   `details`.
6. Correct current password but `password` equal to it (bcrypt compare
   against the stored hash) → 400 `BAD_REQUEST`, message
   `auth.passwordUnchanged`; nothing changed.
7. Otherwise → the password is replaced with a new bcrypt hash (12
   rounds); every session of the candidate is revoked
   (`invalidateAllSessions`, as `POST /auth/logout-all` / #393); then a
   fresh access + refresh pair is issued to the caller and returned like
   login: 200, `data: { token, tokenRefresh }`, and the `token`,
   `refreshToken`, `csrfToken` cookies are set (`setAuthCookies`). Tokens
   of other devices (issued before the change) → 401 / refresh rejected;
   the new pair works.

### Change email
8. `POST /api/v1/auth/change-email` body `{ currentPassword, email }`,
   unknown keys → 400. `email` uses register's `email` rule (incl. TLD
   whitelist `com`/`net`/`vn`) → invalid 400 `VALIDATION_ERROR`. After the
   rule 3 password check:
   - `email` equal to the caller's current email → 400 `BAD_REQUEST`.
   - `email` used by any other candidate → 409 `EMAIL_EXISTS`.
   - Otherwise a single-use change-email token (24h TTL, Redis with
     in-memory fallback, same pattern as `utils/emailVerification.ts`,
     atomic consume) bound to `{ candidateId, newEmail }` is created and
     `<APP_URL>/confirm-email-change?token=<token>` is emailed to the NEW
     address through `services/mail.ts` (a new mail kind), with the same
     SMTP / `MAIL_FROM` / `?lang=` / plain-text / send-failure /
     no-SMTP rules as `auth-password-reset` rules 8–11 (failed send is
     logged without the token; in production the token or link is never
     logged). → 200 with a generic message; the response is the same
     whether or not the send succeeds.
   - The stored email does not change yet: login, `GET /candidate/:email`,
     `/api/me/<email>` keep using the old one until rule 9.
9. `GET /api/v1/auth/confirm-email-change?token=<t>` (no auth, like
   `verify-email`):
   - missing / unknown / expired / already-used token → 400.
   - valid token → consumed; if `newEmail` is now used by another
     candidate → 409 `EMAIL_EXISTS` and nothing changes; else the
     candidate's `email` is set to `newEmail` (lowercased, as the model
     does) and `emailVerified = true` → 200.
   - Sessions are NOT revoked: existing access/refresh tokens keep
     working.
   - After a successful change, a plain-text notice (no link, no token)
     saying the email was changed to `newEmail` is sent to the OLD
     address through the same mail service and failure/no-SMTP rules; a
     failed notice does not change the 200.
10. Several pending change-email requests: each token stays valid until
    its own TTL; whichever is confirmed first wins, a later one re-runs
    the rule 9 uniqueness check against the then-current data.
11. After the change, `/api/me/<old email>` no longer resolves (404 like
    any unknown identifier); `/api/me/<slug>` and `/api/me/<new email>`
    work.

## Acceptance criteria
- `npx jest src/__tests__/auth/auth.validate.test.ts` passes with cases:
  change-password body missing `currentPassword` → invalid; `password`
  of 11 chars → invalid; `repassword` ≠ `password` → invalid; extra key →
  invalid; change-email with `a@b.io` → invalid; change-email missing
  `currentPassword` → invalid.
- `npx jest src/__tests__/auth/auth.service.test.ts` passes with cases:
  - change-password, wrong `currentPassword` → throws 400 with
    `auth.currentPasswordInvalid`; `CandidateModel.updateOne` and
    `invalidateAllSessions` not called.
  - change-password, new = current → throws 400 `auth.passwordUnchanged`;
    `updateOne` not called.
  - change-password success → `updateOne` called with a hash ≠ the
    plaintext, `invalidateAllSessions` called once with the caller's id,
    result `data` has non-empty `token` and `tokenRefresh`.
  - change-email, wrong `currentPassword` → 400, mail mock not called.
  - change-email, email taken by another candidate → 409 `EMAIL_EXISTS`,
    mail mock not called; same as current → 400.
  - change-email success → mail mock called once with the NEW address and
    a path containing `/confirm-email-change?token=`; candidate `email`
    not updated.
  - confirm, valid token → `updateOne` sets `email` = new and
    `emailVerified: true`; mail mock called with the OLD address (notice);
    `invalidateAllSessions` not called.
  - confirm, same token twice → second throws 400.
  - confirm, new email taken meanwhile → 409, `updateOne` not called.
  - with `NODE_ENV=production`, no `logger` call argument contains the
    change-email token value.
- `npx jest src/__tests__/auth/v1AuthRoute.test.ts` passes with:
  `POST /api/v1/auth/change-password` and `POST /api/v1/auth/change-email`
  without a token → HTTP 401; `GET /api/v1/auth/confirm-email-change`
  without `token` → HTTP 400.
- Observable: after a successful password change, login with the old
  password → HTTP 401, with the new one → HTTP 200; a refresh token from
  before the change → `POST /api/v1/auth/refresh` rejected; the refresh
  token returned by change-password → 200.
- Observable: the 11th change-password request within 15 min from one IP
  → HTTP 429.
- `npm test`, `npm run build` and `npm run lint` pass.

## Edge cases
- Cookie-authenticated call without the `csrfToken` header → 403 (inline
  CSRF in `verifyToken`), nothing changed.
- Redis down → change-email tokens and session revocation fall back to
  in-memory (lost on restart).
- SMTP / `APP_URL` not configured → `auth-password-reset` rule 11 (dev
  logs the link, prod warns and sends nothing, response unchanged).
- Change-email requested with an uppercase address → compared and stored
  lowercased (model `lowercase: true`); equal-to-current check is
  case-insensitive.
- Confirm link opened after the candidate deleted their account → 400
  `common.idNotFound` (account gone), nothing created.
- Confirm link opened after the candidate's sessions were revoked
  (password reset/change, logout-all, refresh-token reuse) at a later
  second than the link was issued → 400 like an invalid token, nothing
  changed (operator 2026-11-20, review finding: a leaked password must
  not still move the email after the owner secures the account).

## Out of scope
- Changing password/email via `PUT`/`PATCH /api/v1/candidate/update`.
- v2 aliases (v2 only has register/login).
- An email notice on password change.
- Cancelling a pending email change; a "resend confirmation" endpoint.
- Redirects for old-email public links.
- Frontend work (datvt243/resume-vuejs-website enables the buttons).

## Open questions
All answered by operator 2026-11-20 ("all defaults").
- Q1. Wrong `currentPassword` status → **Answer:** 400 `BAD_REQUEST`, `auth.currentPasswordInvalid` (rule 3).
- Q2. Caller's own session after password change → **Answer:** revoke all, then issue a fresh pair to the caller (rule 7).
- Q3. Rate limit → **Answer:** `authLimiter` on change-password and change-email (rule 2).
- Q4. New password = current → **Answer:** 400 `auth.passwordUnchanged` (rule 6).
- Q5. Change-email endpoint shape → **Answer:** `POST /api/v1/auth/change-email` `{ currentPassword, email }`, 409 taken, 400 same, generic 200 (rule 8).
- Q6. When the email changes → **Answer:** only after confirmation via a 24h single-use token emailed to the new address (rule 8).
- Q7. Confirm endpoint → **Answer:** `GET /api/v1/auth/confirm-email-change?token=`, re-check uniqueness, set email + `emailVerified=true` (rule 9).
- Q8. Sessions on confirm → **Answer:** keep them (rule 9).
- Q9. Old address notice + old-email links → **Answer:** notify old address (no link); old-email links break (rules 9, 11).
- Q10. Several pending requests → **Answer:** each valid until its TTL, uniqueness re-check settles conflicts (rule 10).

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-20 | Created: change-password Behavior from the issue; change-email pending Q5–Q10 | #412 | - |
| 2026-11-20 | Operator answered Q1–Q10 ("all defaults"); change-email Behavior 8–11 + criteria written; rules renumbered | #412 round 2 | - |
| 2026-11-20 | Edge case: revocation after the request cancels a pending email change (was: still valid) | operator decision on /code-review finding | `account-settings` |
