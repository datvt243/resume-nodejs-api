# Password reset

- Status: draft
- Source: backfill from code
- Issues: -
- Anchors: `src/routers/api/v1/auth.route.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/auth.validate.ts`, `src/utils/passwordReset.ts`

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
4. Valid unused token → password replaced with a new bcrypt hash, 200.
   Unknown, expired or already-used token → 400.
5. The token is deleted the first time a request that passes validation
   presents it; a request rejected by validation (rule 3) does not
   consume it.

## Acceptance criteria
- `npx jest src/__tests__/auth/auth.service.test.ts` passes.
- forgot-password for a registered and an unregistered email → both HTTP 200 with identical `message`.
- reset-password reusing the same token a second time → HTTP 400.

## Edge cases
- Token presented after 15 minutes → 400.
- Redis down → token kept in process memory, lost on restart.

## Out of scope
- Sending real emails (stub logs the link).

## Open questions
- A successful reset does not revoke existing sessions (no logout-all), so a stolen session survives a password change. Intended?
- Requesting several resets leaves several valid tokens alive at once. Intended?
- forgot-password has no per-email throttle beyond the global auth rate limit. Enough?
- With Redis, `consumeResetToken` does `GET` then `DEL` (not atomic, `utils/passwordReset.ts`), so two concurrent resets with the same token can both succeed — single-use is not guaranteed under concurrency (same pattern in `utils/emailVerification.ts`). Use `GETDEL`?

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
