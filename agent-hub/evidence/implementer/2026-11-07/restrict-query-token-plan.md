# 2026-11-07 - restrict-query-token (plan)

- Worker: implementer · Version: 0.1.0
- Node: `restrict-query-token` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #392` — "Restrict the `?token=` query parameter to `/download-pdf`"

## Hub bytes before: 93048

## Feature doc: doctrine/features/auth-session-tokens.md

Behavior #1 changes per the operator's recorded answer ("Change: only /download-pdf — #392").

## Anchors
- `src/utils/helper-auth.ts` `extractTokenWithSource` (shared by verifyToken, csrf.middleware, authRefreshToken/authLogout via `extractTokenFromRequest`)
- `src/middlewares/verifyToken.middleware.ts` `verifyToken`, `verifyTokenByQuery`
- `src/routers/api/v1/index.ts:120` — only `verifyTokenByQuery` user (`/download-pdf`)
- `src/__tests__/middlewares/verifyToken.test.ts`

## Scope decision
Only the access-token path (`verifyToken`) changes, as the issue says. `allowQuery` defaults to `true` so refresh/logout/csrf (Behavior 5/7, `refreshToken` field) are untouched.
