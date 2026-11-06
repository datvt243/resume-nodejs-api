# analyst — auth-session-tokens — 2026-11-07

## Task (verbatim)
document auth-session-tokens

## Doc
`agent-hub/doctrine/features/auth-session-tokens.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/utils/helper-auth.ts`
- `src/middlewares/verifyToken.middleware.ts`
- `src/middlewares/csrf.middleware.ts`
- `src/utils/csrf.ts`
- `src/utils/tokenBlacklist.ts`
- `src/utils/sessionRevocation.ts`
- `src/utils/authCookies.ts`
- `src/auth/auth.controller.ts`
- `src/routers/api/v1/auth.route.ts`
- `src/routers/api/v1/index.ts`

## Re-check vs code
Behavior 1–9 match code. Extraction order header→body→query→cookie, non-Bearer header returned raw (`helper-auth.ts`). Refresh: rotated check → blacklist → verify → logout-all marker → atomic `claimRotation` (`auth.controller.ts`); reuse grace 10s. Logout blacklists only access token, no verify (`authLogout`). Logout-all marker TTL 30d (`sessionRevocation.ts:21`); no `iat` + marker → revoked (`:86`). No discrepancy.

## Questions + answers
Operator (2026-11-07): "Behavior đúng" (Behavior section confirmed correct).
- `/auth/logout` blacklists only the access token; the refresh token stays usable until it expires and can mint new pairs. Intended? → **Answer (operator 2026-11-07):** Bug: revoke the refresh token too — #391
- The `?token=` query parameter is accepted by every protected route (shared extractor), though the Swagger for `/download-pdf` says it is the only endpoint that accepts it. Restrict it to `/download-pdf`? → **Answer (operator 2026-11-07):** Change: only /download-pdf — #392
- An `Authorization` header without the `Bearer` scheme is accepted as a raw token. Intended? → **Answer (operator 2026-11-07):** Intended
- `/auth/logout` doesn't verify the token (any string gets blacklisted). Fine? → **Answer (operator 2026-11-07):** Intended (harmless)

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/auth-session-tokens-spec.md` set in doc + INDEX row. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "Behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
