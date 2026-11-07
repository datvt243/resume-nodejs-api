# 2026-11-08 - auth-credential-limit (plan)
- Worker: implementer · Version: 0.1.0
- Node: `auth-credential-limit` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug grep active + archive: 0 hits; no prior active row for #387
- Task: `/todo #387` — "Auth rate limiter never binds, and the v2 auth router has none"
- Branch: `387-auth-rate-limiter` (via `gh issue develop`, fast-forwarded to `staging` @ be96cb1 after #386 merged — operator chose "Fix #386 first, then #387")

## Hub bytes before
96389

## Feature doc: `doctrine/features/auth-register-login.md` (+ `doctrine/features/auth-password-reset.md`)
Open questions answered 2026-11-07: "Bug — #387" (register-login) and "covered by #387" (password-reset). Neither Behavior list states a rate limit → new Behavior line in each + Changelog. Limit value not in any doc → operator answer 2026-11-08 (AskUserQuestion): **"10 / 15 min (Recommended)"**, scope login/register/forgot-password/reset-password on v1 + v2; refresh/logout/verify-email on the global limit only (stated in the question).

## Acceptance
1. One shared `authLimiter` (max 10, 15 min, `auth-rl`) on v1 `POST /login`, `/register`, `/forgot-password`, `/reset-password` and v2 `POST /login`, `/register`; not on v1 `/logout`, `/logout-all`, `/refresh`, `/verify-email`; no `router.use(authLimiter)`.
2. Tests via `npx jest src/__tests__/auth/v1AuthRoute.test.ts src/__tests__/auth/v2AuthRoute.test.ts src/__tests__/middlewares/rateLimit.test.ts` (route wiring + 11th request blocked).
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/routers/api/v1/auth.route.ts:15-17` (current `authLimiter` + `router.use`), routes at :45, :73, :190, :226
- `src/routers/api/v2/auth.route.ts:12-13`
- `src/middlewares/rateLimit.middleware.ts:141-143` (`rateLimitMiddleware` instance — same place for `authLimiter`)
- `src/__tests__/auth/v2AuthRoute.test.ts` (uses `route.stack[0]` as the controller → must point at the last handler)
- `.claude/rules/api.md:21`, `CLAUDE.md:77` ("150 req/15 min auth")
