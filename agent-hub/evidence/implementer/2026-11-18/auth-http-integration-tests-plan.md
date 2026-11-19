# 2026-11-18 - auth-http-integration-tests (plan)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `auth-http-integration-tests` · Task: `/todo #463` — "Add HTTP-level integration tests for the auth flow (supertest + in-memory Mongo)"

## Hub bytes before: 97851

## Feature doc: doctrine/features/auth-session-tokens.md (Behavior #2, #3, #4, #5, #6, #7, #9), doctrine/features/auth-register-login.md (Behavior #1, #3, #5, #6)
Spec only — tests assert the documented behavior, no behavior change.

## Task type
Operator picked branch type `chore` (2026-11-18, AskUserQuestion) → not a `feat`; pass 0 analyst skipped (auth area already has verified docs in `doctrine/features/INDEX.md`).

## Acceptance (node criteria)
1. register → login → authenticated GET → refresh → logout; the logged-out access token → 401 `TOKEN_REVOKED` (session Behavior #7, acceptance row "After logout…").
2. Reuse of a rotated refresh token > 10s after rotation → 401 and every session of that candidate revoked (Behavior #6).
3. Cookie-only state-changing request without `x-csrf-token` → 403 `CSRF_TOKEN_INVALID` (Behavior #3).
4. Client-supplied `candidateId` ignored on create (Behavior #4).
5. Unknown route → 404 `{ success:false, error:{ code:'ROUTE_NOT_FOUND', message } }`.
6. Redis never initialised → `isRedisAvailable()` false, flows above pass on the in-memory fallback (Behavior #9).
Commands: `npx jest src/__tests__/integration/auth.http.test.ts`, `npm test`, `npm run build`, `npm run lint` (≤ 274).

## Anchors
- `src/server.ts` — `runServer` builds the app inline and `startServer()` runs on import → factor the middleware chain into exported `createApp()`, guard `startServer()` with `require.main === module`.
- `src/routers/api/v1/auth.route.ts`, `src/auth/auth.controller.ts` (refresh reuse grace `REFRESH_REUSE_GRACE_SECONDS`), `src/middlewares/verifyToken.middleware.ts`, `src/utils/tokenBlacklist.ts`, `src/utils/sessionRevocation.ts`, `src/middlewares/errors.middleware.ts` (`notFoundHandler`).
- IDOR target: `POST /api/v1/profile/create` (only `name` required).
- New dev deps: `supertest`, `@types/supertest`, `mongodb-memory-server`.
