# 2026-09-20 — add-csrf-protection-auth-cookies (plan)

- Worker: implementer
- Version: 0.1.0
- Node: `add-csrf-protection-auth-cookies` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: GitHub issue #134 — issue #119's httpOnly auth cookies were set
  with `sameSite: 'strict'`, which never attaches the cookie to a
  cross-site request at all. This app's real deployment IS cross-site
  (GitHub Pages frontend, Render API), so those cookies never reach the
  API in production as configured. Fix requires `sameSite: 'none'`
  (needs `secure: true`, already set), but 'none' removes the incidental
  CSRF protection 'strict' gave for free, so real CSRF defense must land
  alongside it. `add-csrf-protection-auth-cookies` is the node name the
  `add-httponly-cookie-jwt-auth`/#119 node itself already flagged as the
  follow-up if picked up.

## Hub bytes before: 74273

## Anchors
- `src/utils/authCookies.ts:12-17` — `AUTH_COOKIE_OPTIONS.sameSite: 'strict'`
- `src/middlewares/verifyToken.middleware.ts` — the one chokepoint every
  protected route (candidate, all 7 CV sections, application tracker,
  logout-all) already passes through
- `src/auth/auth.controller.ts` (`authRefreshToken`, `authLogout`) — the
  2 auth routes that read a token WITHOUT going through `verifyToken`
  (refresh reads the refresh token via `extractTokenFromRequest(req,
  'refreshToken')`; logout reads the about-to-be-blacklisted token the
  same way) — these need their own CSRF check, `verifyToken`'s doesn't
  cover them
- `src/utils/helper-auth.ts:extractTokenFromRequest` — token lookup order
  (Authorization header > body > query > cookie); doesn't expose which
  source won, needed to know when a request is cookie-only

## Plan
1. `src/utils/authCookies.ts` — `sameSite: 'strict'` → `'none'`.
2. New `src/utils/csrf.ts` — double-submit CSRF token: `generateCsrfToken`
   (crypto.randomBytes(32).hex), `setCsrfCookie`/`clearCsrfCookie` (a
   SEPARATE, non-httpOnly cookie `csrfToken` — must be JS-readable so the
   frontend can echo it back in a header), `requiresCsrfCheck(req,
   tokenSource)` (true only for a state-changing method whose token came
   from the cookie alone — a Bearer header or explicit body/query value
   can't be forged onto the victim's browser the way a cookie
   auto-attaches), `isCsrfTokenValid(req)` (cookie === header, both
   non-empty).
3. `src/utils/helper-auth.ts` — add `extractTokenWithSource(req,
   fieldName)`, same lookup as today's `extractTokenFromRequest` but also
   returns which source won (`'header' | 'body' | 'query' | 'cookie' |
   null`); `extractTokenFromRequest` becomes a thin wrapper over it — no
   behavior change for either of its 2 existing call sites.
4. `src/middlewares/verifyToken.middleware.ts` — switch to
   `extractTokenWithSource`; after the existing token/blacklist/
   logout-all checks pass, call `requiresCsrfCheck` + `isCsrfTokenValid`
   and reject with a new `AuthorizationError(..., ErrorCode.
   CSRF_TOKEN_INVALID)` on mismatch. Covers every route already gated by
   `verifyToken` (candidate, all CV sections, application tracker,
   logout-all) with one change, no per-route-file edits.
5. New `src/middlewares/csrf.middleware.ts` — standalone `verifyCsrf
   (fieldName = 'token')` for the 2 auth routes that bypass
   `verifyToken`: wired as `verifyCsrf('refreshToken')` on `POST
   /auth/refresh` and `verifyCsrf('token')` on `POST /auth/logout`.
   `POST /auth/login` needs no check (no session cookie exists yet,
   matches the issue's own scope note); `POST /auth/logout-all` already
   goes through `verifyToken`, already covered by step 4.
6. `src/utils/authCookies.ts` — `setAuthCookies` also issues a fresh CSRF
   cookie whenever it sets an auth cookie; `clearAuthCookies` also clears
   it. Keeps every existing call site (login, refresh, logout, logout-
   all) correct with no changes to `auth.controller.ts` itself.
7. `src/errors/AppError.ts` — add `ErrorCode.CSRF_TOKEN_INVALID`.

## Deferred (not in this diff)
- Issue proposal bullet 3 ("document the required `CORS_ORIGIN`
  production value") — `.env.example` already documents the variable
  generically (`CORS_ORIGIN=https://your-frontend-domain.example`); the
  actual production value is a Render dashboard setting, not something
  verifiable or settable from this repo. Flagged for the operator, not
  fixed here (out of `SmallestDiff` scope for a backend code node).
- `resume-vuejs-website#8` (dropping `localStorage` + adding
  `withCredentials: true`) — different repo, explicitly gated on this
  node landing first per the issue's own bullet 4.
