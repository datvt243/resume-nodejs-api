# 2026-09-17 — add-httponly-cookie-jwt-auth

- Worker: implementer
- Version: 0.1.0
- Node: `add-httponly-cookie-jwt-auth` (new, appended to
  `haven/diagrams/dev-loop.prime-mermaid.md` — no existing node matched
  this task)
- Task (verbatim, via `/todo #119`):
  > GitHub issue #119: [MEDIUM] Security: hỗ trợ httpOnly cookie cho JWT
  > auth (thay localStorage phía frontend). Frontend
  > (`resume-vuejs-website`) stores the JWT in `localStorage` (XSS risk).
  > Backend does not set any cookie today — `extractTokenFromRequest`
  > reads `req.cookies[fieldName]` as a fallback but nothing ever writes
  > it. Work items from the issue: (1) add `cookie-parser`; (2) on
  > login/refresh, `res.cookie('token', jwt, { httpOnly: true, secure:
  > true, sameSite: 'strict', path: '/' })` alongside the existing
  > response-body tokens during the transition; (3) CORS must allow
  > credentials from a specific origin allow-list, never `'*'` with
  > credentials; (4) consider CSRF protection; (5) logout must clear the
  > cookie. Blocks frontend issue
  > https://github.com/datvt243/resume-vuejs-website/issues/8.

## Hub bytes before: 66100

## Acceptance criteria (from the issue)
| # | Criterion | In scope this pass? |
|---|---|---|
| 1 | `cookie-parser` middleware added | Yes |
| 2 | Login/refresh set `token`/`refreshToken` httpOnly cookies | Yes (register excluded — it never issues tokens, so there is nothing to set a cookie from) |
| 3 | CORS allows credentials from an explicit origin allow-list, never `'*'` | Yes |
| 4 | CSRF protection | Deferred — see `## Noticed, not done` in the diff note |
| 5 | Logout clears the cookie | Yes (`/logout` and `/logout-all`) |

## Files (anchors, real paths in `src/`)
- `src/config/cors.config.ts:8` — the `origin: '*'` trap already recorded in `doctrine/domains/PROJECT.md`
- `src/utils/helper-auth.ts` — orphaned `req.cookies[fieldName]` read, confirms cookie names `token`/`refreshToken`
- `src/auth/auth.controller.ts` — `authLogin`, `authRefreshToken`, `authLogout`, `authLogoutAll`
- `src/server.ts` — middleware stack, needs `cookie-parser` wired in before routes
