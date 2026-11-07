# 2026-11-07 - remove-get-login (plan)

- Worker: implementer · Version: 0.1.0
- Node: `remove-get-login` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #389` — "Remove `GET /auth/login` (credentials in a GET body)"

## Hub bytes before: 93048

## Feature doc: doctrine/features/auth-register-login.md

Behavior #5 changes per the operator's recorded answer ("Change: remove the GET route — #389").

## Anchors
- `src/routers/api/v1/auth.route.ts:97` `router.get('/login', asyncHandler(authLogin))` + Swagger `get:` block above it
- `src/routers/api/v2/auth.route.ts:13` — already POST only, untouched
- `.claude/rules/api.md:26` endpoint table row
- new `src/__tests__/auth/v1AuthRoute.test.ts` (same router-stack inspection as `v2AuthRoute.test.ts`)
