# Register, login and email verification

- Status: draft
- Source: backfill from code
- Issues: -
- Anchors: `src/routers/api/v1/auth.route.ts`, `src/routers/api/v2/auth.route.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/auth.validate.ts`, `src/utils/emailVerification.ts`, `src/utils/slug.ts`, `src/utils/authCookies.ts`

## Goal
A candidate creates an account with email + password, signs in to get
API tokens, and can confirm their email address.

## Behavior
1. `POST /api/v1/auth/register` with `{ email, password, repassword }`:
   password must be 12–128 chars and match `passwordRegex`; `repassword`
   must equal `password`. `email` must be a valid address whose TLD is
   `com`, `net` or `vn` only (`config/joi.config.ts` `email`; e.g.
   `a@b.io`, `a@b.org` → 400). Invalid → 400 with per-field `details`.
2. Register with an email that already exists → 409 (`EMAIL_EXISTS`).
3. Register success → 201, `data: null`. The password is stored as a
   bcrypt hash; a vanity `slug` is auto-generated from the email's
   local part plus a 4-char random suffix (`<base>-xxxx`).
4. On register a single-use email-verification token (24h TTL, Redis or
   in-memory fallback) is created. No email is sent: the link
   `/verify-email?token=<token>` is only written to the server log.
5. `POST /api/v1/auth/login` (also `GET /api/v1/auth/login`, same
   handler, reading the body) with `{ email, password }`, validated with
   the same `email` and `password` rules as register (TLD whitelist,
   12–128 chars, `passwordRegex`) → else 400. A well-formed unknown email
   and a well-formed wrong password both → 401 with the same message.
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

## Acceptance criteria
- `npx jest src/__tests__/auth/auth.controller.test.ts` passes.
- `npx jest src/__tests__/auth/auth.service.test.ts` passes.
- `npx jest src/__tests__/auth/v2AuthRoute.test.ts` passes (v2 = same handlers as v1).
- Register twice with the same email → second response is HTTP 409.
- Login with a wrong (but rule-conforming) password and with an unknown email → both HTTP 401, identical `error.message`.

## Edge cases
- `repassword` missing or different → 400.
- Verify-email token used twice → second call 400.
- Redis down → tokens stored in process memory (lost on restart).

## Out of scope
- Actually sending emails (stub logs the link).
- Blocking unverified accounts.

## Open questions
- `GET /auth/login` reads credentials from the request body; GET bodies are usually dropped by clients/proxies. Keep it, or remove the GET route?
- Register skips Mongoose model validation before save (TODO in `auth.service.ts`). Intended for now?
- No way to re-send a verification link; tokens live in memory when Redis is down and vanish on restart. Is that acceptable?
- Register success returns no tokens; the client must call login separately. Intended?
- The email TLD whitelist (`com`/`net`/`vn`) rejects `.org`, `.io`, `.dev`, `.edu`… on register, login and forgot-password. Intended, or should any valid TLD pass?
- Login re-applies the register password rules, so an account whose password predates the current rules (e.g. < 12 chars) gets 400 and can never log in. Intended?
- The v2 auth router has no `authLimiter` (only v1 does); and since the global limiter (100/15 min) is stricter than `authLimiter` (150/15 min), the auth limiter never binds. Intended?

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
