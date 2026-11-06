# analyst — auth-register-login — 2026-11-07

## Task (verbatim)
document auth-register-login

## Doc
`agent-hub/doctrine/features/auth-register-login.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/auth.route.ts`
- `src/routers/api/v2/auth.route.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/auth.validate.ts`
- `src/config/joi.config.ts`
- `src/utils/authCookies.ts`
- `src/utils/csrf.ts`
- `src/utils/emailVerification.ts`
- `src/middlewares/rateLimit.middleware.ts`
- `src/server.ts`

## Re-check vs code
Behavior 1–8 match code. Citation fix only: rule 1 cited `config/joi.config.ts`; real path `src/config/joi.config.ts:41-42` (TLD allow com/net/vn). Login: GET+POST `/login` same handler (`v1/auth.route.ts`), `schemaAuthLogin` reuses register `password` (`auth.validate.ts`). Global limiter `server.ts:92` (default 100, `rateLimit.middleware.ts:22`) vs authLimiter 150 (`v1/auth.route.ts:16`); v2 router has no limiter.

## Questions + answers
Operator (2026-11-07): "Behavior đúng" (Behavior section confirmed correct).
- `GET /auth/login` reads credentials from the request body; GET bodies are usually dropped by clients/proxies. Keep it, or remove the GET route? → **Answer (operator 2026-11-07):** Change: remove the GET route — #389
- Register skips Mongoose model validation before save (TODO in `auth.service.ts`). Intended for now? → **Answer (operator 2026-11-07):** Intended
- No way to re-send a verification link; tokens live in memory when Redis is down and vanish on restart. Is that acceptable? → **Answer (operator 2026-11-07):** Intended (accepted for now)
- Register success returns no tokens; the client must call login separately. Intended? → **Answer (operator 2026-11-07):** Intended
- The email TLD whitelist (`com`/`net`/`vn`) rejects `.org`, `.io`, `.dev`, `.edu`… on register, login and forgot-password. Intended, or should any valid TLD pass? → **Answer (operator 2026-11-07):** Intended (keep)
- Login re-applies the register password rules, so an account whose password predates the current rules (e.g. < 12 chars) gets 400 and can never log in. Intended? → **Answer (operator 2026-11-07):** Bug: login should only require a non-empty password — #390
- The v2 auth router has no `authLimiter` (only v1 does); and since the global limiter (100/15 min) is stricter than `authLimiter` (150/15 min), the auth limiter never binds. Intended? → **Answer (operator 2026-11-07):** Bug — #387

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/auth-register-login-spec.md` set in doc + INDEX row. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "Behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
