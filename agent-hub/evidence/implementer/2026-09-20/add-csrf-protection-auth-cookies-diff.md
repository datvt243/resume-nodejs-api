# 2026-09-20 — add-csrf-protection-auth-cookies (diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-csrf-protection-auth-cookies`
- Task: see `add-csrf-protection-auth-cookies-plan.md`. GitHub issue #134.

## Diff
| File | Why |
|---|---|
| `src/utils/authCookies.ts` | `AUTH_COOKIE_OPTIONS.sameSite: 'strict'` → `'none'` (the actual fix for the cross-site cookie-never-arrives bug). `setAuthCookies` now also issues a fresh CSRF cookie (`generateCsrfToken` + `setCsrfCookie`) whenever it sets an auth cookie; `clearAuthCookies` also clears it — same lifecycle, no changes needed at any of its 4 call sites (login/refresh/logout/logout-all). |
| `src/utils/csrf.ts` (new) | Double-submit CSRF primitives: `generateCsrfToken`, `setCsrfCookie`/`clearCsrfCookie` (separate non-httpOnly `csrfToken` cookie), `requiresCsrfCheck(req, tokenSource)`, `isCsrfTokenValid(req)`. |
| `src/utils/helper-auth.ts` | Added `extractTokenWithSource(req, fieldName)` — identical lookup order to the existing `extractTokenFromRequest`, plus which source won. `extractTokenFromRequest` is now a thin wrapper (`.token`) — same signature, same behavior, both existing call sites (`auth.controller.ts`, `verifyToken.middleware.ts`) unaffected. |
| `src/middlewares/verifyToken.middleware.ts` | Switched to `extractTokenWithSource`; after the existing blacklist/logout-all checks, rejects with a new `AuthorizationError(ErrorCode.CSRF_TOKEN_INVALID)` when `requiresCsrfCheck` is true and `isCsrfTokenValid` is false. Covers every route already gated by `verifyToken` (candidate, all 7 CV sections, application tracker, `logout-all`) in one place. |
| `src/middlewares/csrf.middleware.ts` (new) | Standalone `verifyCsrf(fieldName = 'token')` for the 2 auth routes that read a token without going through `verifyToken`. |
| `src/middlewares/index.ts`, `src/utils/index.ts` | Re-export the 2 new modules, matching the existing barrel pattern. |
| `src/routers/api/v1/auth.route.ts` | `POST /refresh` gains `verifyCsrf('refreshToken')`; `POST /logout` gains `verifyCsrf('token')`. `/login` (no session yet) and `/logout-all` (already behind `verifyToken`) untouched. |
| `src/errors/AppError.ts` | Added `ErrorCode.CSRF_TOKEN_INVALID`. |
| `src/__tests__/utils/authCookies.test.ts` (updated) | `sameSite` expectation → `'none'`; new assertions for the CSRF cookie set/clear alongside the auth cookies. |
| `src/__tests__/utils/csrf.test.ts` (new) | `generateCsrfToken` format/uniqueness, `setCsrfCookie`/`clearCsrfCookie` options, `requiresCsrfCheck` truth table (method × source), `isCsrfTokenValid` match/mismatch/missing cases. |
| `src/__tests__/middlewares/csrf.test.ts` (new) | `verifyCsrf` middleware: passthrough on header-sourced token, passthrough on safe method, reject on cookie-sourced POST with no/mismatched CSRF header, pass on matching header, per-field-name behavior (`refreshToken`). |
| `src/__tests__/middlewares/verifyToken.test.ts` (updated) | New `describe('CSRF (issue #134)')` block: cookie-sourced POST with no CSRF header → `AuthorizationError`/`CSRF_TOKEN_INVALID`; matching CSRF header → passes, `req.user` attached; safe method (GET) skips the check; Authorization-header-sourced token skips the check (existing behavior preserved — all pre-existing tests in this file still pass unmodified in their assertions). |

## Command
```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, per `doctrine/MEMORY.md`)

## Output
```
Test Suites: 21 passed, 21 total
Tests:       121 passed, 121 total
Snapshots:   0 total
Time:        5.977 s, estimated 6 s
Ran all test suites.
```
(was 19 suites / 99 tests on this branch before this node — confirmed by
temporarily stashing all tracked-file changes and re-running `npm test`:
`Tests: 99 passed, 99 total`. This diff adds 2 new suites —
`utils/csrf.test.ts` (10 cases) and `middlewares/csrf.test.ts` (6 cases)
— plus 2 new cases in `authCookies.test.ts` and 4 new cases in the
`CSRF (issue #134)` block of `verifyToken.test.ts`: 10+6+2+4 = 22 new
tests, 99+22 = 121, matching the post-diff run above.)

Also ran `npm run build` — `tsc && npm run copy` completed with no errors
or warnings.

## Acceptance
| Criterion | Evidence |
|---|---|
| Auth cookies now use `sameSite: 'none'` so they actually reach a cross-site (GitHub Pages → Render) deployment | `src/utils/authCookies.ts` — `AUTH_COOKIE_OPTIONS.sameSite: 'none'`; `authCookies.test.ts` "sets both token and refreshToken cookies with httpOnly options" — PASS, asserts the `'none'` option object |
| A cross-site forged request relying purely on the auto-attached auth cookie is rejected on every route behind `verifyToken` | `verifyToken.test.ts` "CSRF (issue #134) › calls next with AuthorizationError on a state-changing request authenticated purely via cookie, with no CSRF header" — PASS |
| A legitimate cookie-authenticated state-changing request (matching CSRF header) still succeeds | `verifyToken.test.ts` "... whose CSRF header matches the CSRF cookie" — PASS, `req.user` attached |
| Existing Authorization-header-based auth (today's actual frontend flow) is completely unaffected | `verifyToken.test.ts` "does not require CSRF when the token came from the Authorization header (existing behavior preserved)" — PASS; all 9 pre-existing `verifyToken.test.ts` cases from before this node still PASS unmodified |
| Safe methods (GET) are never blocked by CSRF, even if cookie-sourced | `verifyToken.test.ts` "does not require CSRF for a cookie-sourced token on a safe method (GET)" — PASS |
| `/auth/refresh` and `/auth/logout` (which bypass `verifyToken`) are also covered | `src/routers/api/v1/auth.route.ts` — `verifyCsrf('refreshToken')`/`verifyCsrf('token')` wired; `middlewares/csrf.test.ts` "uses the given field name to resolve the token source (e.g. refreshToken for /auth/refresh)" + the reject/accept cases — all PASS |
| `/auth/login` needs no CSRF check (no session cookie exists yet) | Not wired on that route — matches the issue's own scope note; no regression, `auth.controller.test.ts` `authLogin` cases still PASS unmodified |
| No regression in existing auth/controller/refresh flows | `auth.controller.test.ts` (13 cases), `refreshToken.test.ts` (4 cases) — all still PASS, these test the controller functions directly (module-mocked `@/utils`/`@/utils/helper-auth`), unaffected by the router-level `verifyCsrf` wiring |
| Typecheck/build clean | `npm run build` — `tsc && npm run copy`, no errors |

## Noticed, not done
- Issue proposal bullet 3 (document the real production `CORS_ORIGIN`
  value, `https://datvt243.github.io`) — deferred, see plan note's
  "Deferred" section. Flagged for the operator (Render dashboard env
  var), not a backend code change.
- `resume-vuejs-website#8` (frontend `withCredentials: true` +
  localStorage removal) — different repo, explicitly gated on this node
  per the issue's own bullet 4, not started here.
- `POST /auth/login` intentionally left without `verifyCsrf` — no
  session/cookie exists before login succeeds, so there is nothing to
  double-submit yet; matches the issue's own text ("login doesn't need
  it since there's no session yet").

## Seal gate
None yet — no outward-facing action in this pass (no commit/push; working
tree changes only, on branch `134-csrf-protection-for`). `/todo #134
--ship` will invoke `/ship` separately, which carries its own seal gate
before any commit/push.
