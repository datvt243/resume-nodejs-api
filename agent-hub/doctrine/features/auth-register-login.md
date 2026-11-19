# Register, login and email verification

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/auth-register-login-spec.md` (rules 1–9); rules 10–11 draft for #461
- Source: backfill from code
- Issues: #385, #387, #389, #390, #461
- Anchors: `src/routers/api/v1/auth.route.ts`, `src/routers/api/v2/auth.route.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/auth.validate.ts`, `src/utils/emailVerification.ts`, `src/utils/slug.ts`, `src/utils/authCookies.ts`

## Goal
A candidate creates an account with email + password, signs in to get
API tokens, and can confirm their email address.

## Behavior
1. `POST /api/v1/auth/register` with `{ email, password, repassword }`:
   password must be 12–128 chars and match `passwordRegex`; `repassword`
   must equal `password`. `email` must be a valid address whose TLD is
   `com`, `net` or `vn` only (`src/config/joi.config.ts` `email`; e.g.
   `a@b.io`, `a@b.org` → 400). Invalid → 400 with per-field `details`.
2. Register with an email that already exists → 409 (`EMAIL_EXISTS`).
3. Register success → 201, `data: null`. The password is stored as a
   bcrypt hash; a vanity `slug` is auto-generated from the email's
   local part plus a 4-char random suffix (`<base>-xxxx`).
4. On register a single-use email-verification token (24h TTL, Redis or
   in-memory fallback) is created. No email is sent: the link
   `/verify-email?token=<token>` is only written to the server log.
5. `POST /api/v1/auth/login` (POST only; `GET /api/v1/auth/login` → 404
   like any unknown route) with `{ email, password }`, validated with
   the same `email` rule as register (TLD whitelist) and a password that
   is only a non-empty string ≤ 128 chars — no length minimum or
   `passwordRegex`, so an account whose password predates the current
   rules can still log in → else 400. A well-formed unknown email and a
   wrong password both → 401 with the same message.
6. Login success → 200, `data: { user: { email, first_name, last_name,
   email_verified }, token, tokenRefresh }`, and sets httpOnly cookies
   `token` + `refreshToken` plus a readable `csrfToken` cookie (all
   `secure`, `sameSite=none`). The access token expires per
   `TOKEN_EXP_IN` (default 1h), refresh per `TOKEN_REFRESH_EXP_IN`; each
   refresh token carries a unique `jti`.
7. `GET /api/v1/auth/verify-email?token=<t>`: valid unused token → 200
   and `emailVerified=true`; missing/expired/used token → 400.
   Verification never blocks login or any other route.
8. `/api/v2/auth/register` and `/api/v2/auth/login` are aliases: they
   call the same controller functions as v1 (only POST; v2 has no other
   auth routes).
9. Register and login (v1 and v2, one shared bucket per client IP) allow
   10 requests per 15 minutes; the 11th → 429 `RATE_LIMITED`. Other auth
   routes (`/refresh`, `/logout`, `/logout-all`, `/verify-email`) only have
   the global limit.

### #461 — email the verification link, never log the token (draft)
10. When `NODE_ENV=production`, register never writes the verification
    token or link to any log.
11. On register, the new address is emailed a plain-text message with
    `<APP_URL>/verify-email?token=<token>` (a frontend page that calls
    `GET /api/v1/auth/verify-email`), through the same mail service,
    SMTP/`MAIL_FROM`/`?lang=` rules, failure handling and no-SMTP
    handling as `auth-password-reset` rules 8–11. Register's response
    stays as rule 3 (201, `data: null`) even when the send fails.

## Acceptance criteria
- `npx jest src/__tests__/auth/auth.controller.test.ts` passes.
- `npx jest src/__tests__/auth/auth.service.test.ts` passes.
- `npx jest src/__tests__/auth/v2AuthRoute.test.ts` passes (v2 = same handlers as v1).
- Register twice with the same email → second response is HTTP 409.
- `npx jest src/__tests__/auth/auth.validate.test.ts` passes (login accepts a short legacy password; register still rejects it).
- Login with a wrong password and with an unknown email → both HTTP 401, identical `error.message`.
- (#461) `npx jest src/__tests__/auth/auth.service.test.ts` has a register test asserting the mocked mail service is called once with the new email and a link containing the verification token.
- (#461) A test with `NODE_ENV=production` asserts no `logger` call argument contains the verification token value.
- (#461) A register test with the mail mock rejecting → still `{ success: true }` (201 path).

## Edge cases
- `repassword` missing or different → 400.
- Verify-email token used twice → second call 400.
- Redis down → tokens stored in process memory (lost on restart).

## Out of scope
- ~~Actually sending emails (stub logs the link).~~ → in scope from #461.
- (#461) A re-send-verification endpoint (still out of scope, per the 2026-11-07 answer).
- Blocking unverified accounts.

## Open questions
- `GET /auth/login` reads credentials from the request body; GET bodies are usually dropped by clients/proxies. Keep it, or remove the GET route? → **Answer (operator 2026-11-07):** Change: remove the GET route — #389
- Register skips Mongoose model validation before save (TODO in `auth.service.ts`). Intended for now? → **Answer (operator 2026-11-07):** Intended
- No way to re-send a verification link; tokens live in memory when Redis is down and vanish on restart. Is that acceptable? → **Answer (operator 2026-11-07):** Intended (accepted for now)
- Register success returns no tokens; the client must call login separately. Intended? → **Answer (operator 2026-11-07):** Intended
- The email TLD whitelist (`com`/`net`/`vn`) rejects `.org`, `.io`, `.dev`, `.edu`… on register, login and forgot-password. Intended, or should any valid TLD pass? → **Answer (operator 2026-11-07):** Intended (keep)
- Login re-applies the register password rules, so an account whose password predates the current rules (e.g. < 12 chars) gets 400 and can never log in. Intended? → **Answer (operator 2026-11-07):** Bug: login should only require a non-empty password — #390
- The v2 auth router has no `authLimiter` (only v1 does); and since the global limiter (100/15 min) is stricter than `authLimiter` (150/15 min), the auth limiter never binds. Intended? → **Answer (operator 2026-11-07):** Bug — #387; limit (operator 2026-11-08): 10 / 15 min on login/register/forgot/reset, v1 + v2

### #461 (answered by operator 2026-11-19, round 2)
- Q8. Verification link target? → **Answer:** frontend `APP_URL/verify-email?token=...`.
- Provider, sender, language, failure and no-SMTP handling: see `auth-password-reset.md` Q1–Q7 answers.

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified; joi.config path corrected to `src/config/joi.config.ts` | analyst backfill re-check, see `evidence/analyst/2026-11-07/auth-register-login-spec.md` | - |
| 2026-11-07 | Issues += #385 (also covers the non-atomic GET+DEL in `src/utils/emailVerification.ts`) | operator | - |
| 2026-11-07 | Behavior 5: GET /auth/login removed (POST only) | operator answer #389 | remove-get-login |
| 2026-11-08 | Behavior 9: auth limit 10/15 min on credential routes, v1 + v2 | operator answer #387 | auth-credential-limit |
| 2026-11-08 | Behavior 5: login password = non-empty string ≤ 128, strength rules on register/reset only | operator answer #390 | login-password-any-length |
| 2026-11-19 | Rules 10–11 + criteria + Q8: email the verification link, never log the token in prod (draft) | #461 | - |
| 2026-11-19 | Operator answered Q8 (frontend link); rule 11 made concrete; send failure keeps 201 | #461 round 2 | - |
