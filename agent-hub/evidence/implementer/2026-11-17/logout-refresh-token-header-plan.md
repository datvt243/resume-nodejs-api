# 2026-11-17 - logout-refresh-token-header (plan)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `logout-refresh-token-header` (PENDING, added this pass)
Task: `/todo #475` — "Logout still leaves the refresh token valid: refreshToken lookup returns the Authorization header" (issue body: `authLogout`'s `extractTokenFromRequest(req, 'refreshToken')` returns the Authorization header first, so the access token is blacklisted twice and the body `refreshToken` stays valid; expected: refresh-token lookup reads only body/query/cookie).

## Hub bytes before: 97847
## Feature doc: agent-hub/doctrine/features/auth-session-tokens.md (verified)
## Pass 0: skipped — bug with an existing INDEX row (auth-session-tokens, #391/#392)

## Doc conflict → operator question
Issue text ("never the Authorization header") contradicts Behavior #5 (refresh reads header) and #7 (logout reads header/body/query/cookie). `/auth/refresh` with `Bearer <refresh>` is relied on by `src/__tests__/auth/refreshToken.test.ts` (9 cases) + `refreshTokenReuse.test.ts`.
Asked: "Where should the refresh token stop being read from the Authorization header?" → operator: **"Logout only (Recommended)"** — logout's lookup skips the header; `/auth/refresh` unchanged; doc #7 edited, #5 untouched.

## Acceptance (node)
1. Logout with `Authorization: Bearer <access>` + body `refreshToken` blacklists both tokens (unit test using the real helper, red on old code).
2. `npm test` green; `npm run build` (typecheck) exit 0.
3. `npm run lint` ≤ 274 baseline, no new errors in touched files.
4. Matches `features/auth-session-tokens.md` Behavior #7 (as amended); Behavior #5 unchanged.

## Anchors
`src/utils/helper-auth.ts` (`extractTokenWithSource`, `extractTokenFromRequest`), `src/auth/auth.controller.ts:296` (`authLogout`). Other callers checked: `verifyToken.middleware.ts:20`, `csrf.middleware.ts:17`, `auth.controller.ts:128` (refresh) — all keep default `allowHeader = true`.
