# Session tokens: refresh, logout, logout from all devices

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/auth-session-tokens-spec.md`
- Source: backfill from code
- Issues: #391, #392
- Anchors: `src/routers/api/v1/auth.route.ts`, `src/auth/auth.controller.ts`, `src/middlewares/verifyToken.middleware.ts`, `src/middlewares/csrf.middleware.ts`, `src/utils/helper-auth.ts`, `src/utils/tokenBlacklist.ts`, `src/utils/sessionRevocation.ts`, `src/utils/authCookies.ts`, `src/utils/csrf.ts`, `src/utils/jwt.ts`

## Goal
Keep a signed-in candidate authenticated safely: renew tokens, sign out
one session or every session, and reject stolen or reused tokens.

## Behavior
1. Every protected route reads the token from, in order: `Authorization`
   header (`Bearer <t>`, or the raw header value), body `token`, query
   `token`, cookie `token`. None → 401 `NO_TOKEN`.
2. A protected request is rejected with 401 when the token is
   blacklisted, expired (`TOKEN_EXPIRED`), invalid, has no `_id`, or was
   issued before the candidate's last logout-all.
3. When the token came from the cookie and the method is not
   GET/HEAD/OPTIONS, the `x-csrf-token` header must equal the
   `csrfToken` cookie, else 403 `CSRF_TOKEN_INVALID`.
4. On success the request is bound to the token's candidate:
   `req.body.candidateId` is always overwritten with that id.
5. `POST /auth/refresh` (refresh token from header/body `refreshToken`/
   query/cookie `refreshToken`, CSRF-checked when from cookie): no token
   → 401; blacklisted, revoked by logout-all, or lost a concurrent
   rotation → 401 `TOKEN_REVOKED`; success → 200 with a new
   `{ token, tokenRefresh }` pair and rotated cookies. The old refresh
   token is marked `rotated:<unix s>` and can't be used again.
6. Reusing a rotated refresh token more than 10s after rotation revokes
   every session of that candidate (same as logout-all), unless the token
   already predates the last revocation. The caller sees the same 401 as
   any revoked token.
7. `POST /auth/logout` (CSRF-checked when token from cookie): no token →
   400; else the access token is blacklisted until its own expiry, auth
   cookies are cleared, 200.
8. `POST /auth/logout-all` (requires a valid access token): marks every
   token issued for this candidate before now as revoked (30-day marker),
   clears the caller's cookies, 200.
9. Blacklist and revocation markers live in Redis; when Redis is
   unavailable they fall back to process memory.

## Acceptance criteria
- `npx jest src/__tests__/auth/refreshToken.test.ts` passes.
- `npx jest src/__tests__/auth/refreshTokenReuse.test.ts` passes.
- `npx jest src/__tests__/auth/tokenExpiry.test.ts` passes. (Fails locally when the repo's `.env` sets `TOKEN_EXP_IN`: its "falls back to 1h" case reloads config and picks it up — 2026-11-06: expected 3600, got 10800. Env-dependent, not a code failure.)
- `npx jest src/__tests__/middlewares/verifyToken.test.ts src/__tests__/middlewares/csrf.test.ts src/__tests__/utils/tokenBlacklist.test.ts src/__tests__/utils/authCookies.test.ts src/__tests__/utils/csrf.test.ts` passes.
- After logout, a request with the same access token → HTTP 401 `TOKEN_REVOKED`.
- After logout-all, a refresh with a pre-existing refresh token → HTTP 401.

## Edge cases
- Two tabs refreshing with the same refresh token within 10s → one wins, the other gets 401, no global revocation.
- Token with no `iat` while a revocation marker exists → treated as revoked.
- Redis down → markers are per-process; in a multi-instance deploy they don't propagate.

## Out of scope
- Listing or naming individual sessions/devices.

## Open questions
- `/auth/logout` blacklists only the access token; the refresh token stays usable until it expires and can mint new pairs. Intended? → **Answer (operator 2026-11-07):** Bug: revoke the refresh token too — #391
- The `?token=` query parameter is accepted by every protected route (shared extractor), though the Swagger for `/download-pdf` says it is the only endpoint that accepts it. Restrict it to `/download-pdf`? → **Answer (operator 2026-11-07):** Change: only /download-pdf — #392
- An `Authorization` header without the `Bearer` scheme is accepted as a raw token. Intended? → **Answer (operator 2026-11-07):** Intended
- `/auth/logout` doesn't verify the token (any string gets blacklisted). Fine? → **Answer (operator 2026-11-07):** Intended (harmless)

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/auth-session-tokens-spec.md` | - |
