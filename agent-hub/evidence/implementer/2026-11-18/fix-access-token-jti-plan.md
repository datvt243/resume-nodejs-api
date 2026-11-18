# 2026-11-18 - fix-access-token-jti (plan)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-access-token-jti` · Task: `/todo "add jti to access tokens"` → issue #490 "add jti to access tokens" (body = same line), label `bug`

## Hub bytes before: 98675

## Feature doc: doctrine/features/auth-session-tokens.md (Behavior #7, #2), doctrine/features/auth-register-login.md (Behavior #6)
Task type: operator chose `fix` (2026-11-18, AskUserQuestion) → pass 0 analyst skipped (INDEX row exists for auth session tokens). Spec: session Behavior #7 — logout blacklists *the access token sent with the request*; today it also revokes any other session whose access token was minted in the same second for the same candidate (byte-identical JWT), which the doc does not allow. register-login #6 says refresh tokens carry a unique `jti`; extending that to access tokens adds, doesn't contradict → no doc edit.

## Acceptance (node criteria)
1. Two logins of one candidate in the same second → different access tokens; logout with one → protected GET with the other still 200 (`npx jest src/__tests__/integration/auth.http.test.ts`).
2. Unit tests assert the access payload carries a `jti` at both sign sites (`npx jest src/__tests__/auth/auth.service.test.ts src/__tests__/auth/refreshToken.test.ts`).
3. `npm test` + `npm run build` green; `npm run lint` ≤ 274, none new in changed files.

## Anchors
- `src/auth/auth.service.ts:103` (`handlerLogin` access sign), `:104` comment covering refresh `jti`.
- `src/auth/auth.controller.ts:167` (`authRefreshToken` access sign), `:168` comment.
- `src/__tests__/auth/auth.service.test.ts:139` (exact `data: { _id }` expectation), `src/__tests__/auth/refreshToken.test.ts:84`.
- `src/__tests__/integration/auth.http.test.ts:34` comment "access tokens carry no jti" becomes false.
- Consumers of the access payload: `verifyToken` reads `_id`/`iat` only (`grep jti src` → only the sign sites).
