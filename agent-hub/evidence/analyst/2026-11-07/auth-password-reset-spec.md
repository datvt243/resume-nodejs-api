# analyst — auth-password-reset — 2026-11-07

## Task (verbatim)
document auth-password-reset

## Doc
`agent-hub/doctrine/features/auth-password-reset.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/auth.validate.ts`
- `src/utils/passwordReset.ts`
- `src/utils/emailVerification.ts`
- `src/routers/api/v1/auth.route.ts`

## Re-check vs code
Behavior 1–5 match code. Validation runs before `consumeResetToken` (`authResetPassword`), so a 400 by validation doesn't consume. TTL 15 min (`passwordReset.ts`). Redis path GET then DEL (non-atomic); same in `emailVerification.ts:67-68`. Reset updates password only, no session revocation (`handlerResetPassword`). No discrepancy.

## Questions + answers
Operator (2026-11-07): "Behavior đúng" (Behavior section confirmed correct).
- A successful reset does not revoke existing sessions (no logout-all), so a stolen session survives a password change. Intended? → **Answer (operator 2026-11-07):** Change: reset revokes all sessions — #393
- Requesting several resets leaves several valid tokens alive at once. Intended? → **Answer (operator 2026-11-07):** Intended (each expires in 15 min)
- forgot-password has no per-email throttle beyond the global auth rate limit. Enough? → **Answer (operator 2026-11-07):** covered by #387
- With Redis, `consumeResetToken` does `GET` then `DEL` (not atomic, `utils/passwordReset.ts`), so two concurrent resets with the same token can both succeed — single-use is not guaranteed under concurrency (same pattern in `utils/emailVerification.ts`). Use `GETDEL`? → **Answer (operator 2026-11-07):** Bug — #385

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/auth-password-reset-spec.md` set in doc + INDEX row. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "Behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
