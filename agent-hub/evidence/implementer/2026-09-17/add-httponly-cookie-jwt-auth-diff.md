# 2026-09-17 — add-httponly-cookie-jwt-auth (diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-httponly-cookie-jwt-auth`

## Diff
| File | Why |
|---|---|
| `package.json` / `package-lock.json` | Add `cookie-parser` (dependency) + `@types/cookie-parser` (devDependency) — real `npm install`, not hand-edited |
| `src/server.ts` | `app.use(cookieParser())` right after `requestLogger`, before any route/body-parser — populates `req.cookies` for `extractTokenFromRequest`'s existing fallback read |
| `src/utils/authCookies.ts` (new) | `setAuthCookies(res, {token, tokenRefresh})` / `clearAuthCookies(res)` — literal options from the issue: `{ httpOnly: true, secure: true, sameSite: 'strict', path: '/' }`. Cookie names `token`/`refreshToken` match what `extractTokenFromRequest` (`@/utils/helper-auth.ts`) already reads as a fallback field name |
| `src/utils/index.ts` | `export * from './authCookies'` — barrel export, same pattern as every other `utils/*` module |
| `src/auth/auth.controller.ts` | `authLogin`: `setAuthCookies` after a successful `handlerLogin`, alongside the existing response-body `data.token`/`data.tokenRefresh` (dual, transitional per the issue). `authRefreshToken`: `setAuthCookies` with the rotated pair. `authLogout`: `clearAuthCookies`. `authLogoutAll`: `clearAuthCookies` on the caller's own cookies too (not explicitly required by the issue text, but leaving a stale httpOnly cookie after a "log out everywhere" call would defeat the point) |
| `src/config/process.config.ts` | Export new `CORS_ORIGIN` env var |
| `src/config/cors.config.ts` | `origin: '*'` → comma-separated allow-list from `CORS_ORIGIN`, `credentials: true` added. No `CORS_ORIGIN` configured: reflect caller origin (`true`) in dev, fail closed (`false`) in production. Also resolves the pre-existing `CORS origin: '*'` trap in `doctrine/domains/PROJECT.md` |
| `.env.example` | Document `CORS_ORIGIN` |
| `src/__tests__/auth/auth.controller.test.ts` | 4 new assertions (`setAuthCookies`/`clearAuthCookies` called with the right args) in the existing login/refresh/logout/logout-all tests — this file already does `jest.mock('@/utils')`, so no other change needed |
| `src/__tests__/auth/refreshToken.test.ts` | `res.cookie: jest.fn()` added to the shared mock `res` — this file does NOT mock `@/utils`, so `authRefreshToken`'s new (real) `setAuthCookies` call was hitting `res.cookie is not a function`, caught by `handleError`/`next(err)`, which silently swallowed the 200 response. This is the one pre-existing test the change genuinely broke; fixed by mocking the method every real Express `res` actually has |
| `src/__tests__/utils/authCookies.test.ts` (new) | Real, unmocked `setAuthCookies`/`clearAuthCookies` — asserts exact cookie names + options |
| `src/__tests__/config/cors.config.test.ts` (new) | Real `corsConfig()` under 4 env combinations (`CORS_ORIGIN` set/unset × dev/prod) via `jest.resetModules()` + `jest.doMock('@/config/process.config', ...)` — locks in "never a literal `'*'` with `credentials: true`" and the fail-closed-in-prod default |

## Command
`npm test`

## Output
```
Test Suites: 17 passed, 17 total
Tests:       92 passed, 92 total
Snapshots:   0 total
Time:        5.365 s, estimated 9 s
Ran all test suites.
```
Also ran `npm run build` (`tsc && npm run copy`) — exit clean, no compiler errors.

## Acceptance
| Criterion | Evidence |
|---|---|
| `cookie-parser` added and wired in before routes | `package.json` diff + `src/server.ts` diff (`app.use(cookieParser())` before `languageMiddleware`/session/CORS/router) |
| Login sets `token`+`refreshToken` httpOnly cookies | `authLogin` diff + `src/__tests__/auth/auth.controller.test.ts` `authLogin` test now asserts `setAuthCookies` called with `{ token: 'token', tokenRefresh: 'refresh' }` |
| Refresh rotates the cookies to the new pair | `authRefreshToken` diff + both `auth.controller.test.ts` and `refreshToken.test.ts` pass with the new `res.cookie` call in place |
| CORS never combines `'*'` with `credentials: true` | `src/__tests__/config/cors.config.test.ts` — `expect(config.origin).not.toBe('*')` + `credentials` always `true`, plus the 2 fail-closed/dev-reflect cases, all green in the `Tests: 92 passed, 92 total` run above |
| Logout clears the cookies | `authLogout`/`authLogoutAll` diff + `auth.controller.test.ts` assertions `clearAuthCookies` called with `res` |
| Real test run, output read back | `Tests: 92 passed, 92 total` above (85 pre-existing + 1 modified-mock fix + 6 new: 3 `authCookies.test.ts` + 4 `cors.config.test.ts` minus... see note below) |

Note on the 92 count: pre-existing suite was 85 tests (`add-vanity-slug-public-profile`'s last recorded run: "85/85"). This pass adds 2 new suites — `authCookies.test.ts` (3 tests) and `cors.config.test.ts` (4 tests) — for 85 + 7 = 92. The 4 new `expect(...setAuthCookies/clearAuthCookies...)` lines added inside already-existing `it` blocks in `auth.controller.test.ts` are extra assertions, not new tests, so they don't add to the count.

## Noticed, not done
- **CSRF protection (issue bullet 4) deferred.** The issue frames this as "cân nhắc" (consider), not a hard requirement, and scoping a real CSRF defense (double-submit cookie or a header token, plus which routes need it) is a separate design decision the issue itself defers to the frontend-side issue's comparison (`resume-vuejs-website#8`). Partial mitigation already in place from taking the issue's own `sameSite: 'strict'` value literally: a `Strict` cookie is never sent on any cross-site request at all (not just top-level navigation), which blocks the classic CSRF vector for as long as the frontend stays same-site with the API. **Caveat, flagged for the operator**: if `resume-vuejs-website` and this API are ever deployed on different eTLD+1 domains (not sub-domains of one parent), `sameSite: 'strict'` will prevent the browser from ever sending the cookie cross-site, and the frontend integration will not work at all — that would need `sameSite: 'none'` (which then does need real CSRF protection, since `None` sends the cookie on every cross-site request). Not investigated here since the actual deployment topology isn't visible from this repo. Own node if picked up, e.g. `add-csrf-protection-auth-cookies`.
- **`register` intentionally not touched.** It never issues tokens (`data: null` in the response) — nothing to set a cookie from. No cookie behavior needed there per the issue's own scope.
- **Cookie `maxAge`/`expires` not set** — cookies are session-scoped (cleared when the browser closes) rather than mirroring `TOKEN_EXP_IN`/`TOKEN_REFRESH_EXP_IN`. Kept out of scope to avoid parsing a duration string (`'7d'`, `'1h'`) with no already-declared dependency for it (`ms` is only a transitive dependency today, not a direct one) — actual token validity is still enforced server-side by JWT expiry regardless of the cookie's own lifetime. Own node if a "remember me" duration is wanted later.
- `dev-loop.prime-mermaid.md` is now 19792B+ (was already over the 15KB `/hub-tokens` archive threshold before this node was appended) — an archive pass is due, not done as part of this task (out of scope, separate explicit action per `/hub-tokens`' own rules).

## Seal gate
None — no commit/push/publish/delete/external-API call happened in this pass. Diff stays in the working tree, shown in full to the operator above (every changed/new file under `src/`, `.env.example`, `package.json`).
