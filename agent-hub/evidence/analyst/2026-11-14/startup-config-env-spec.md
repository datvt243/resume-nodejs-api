# analyst — startup-config-env — 2026-11-14

## Task (verbatim)
Backfill — document the feature touched by: GitHub issue #458 (label: bug, security)
Title: Config: fail fast at startup when required env vars are missing
Body:
## Problem
`src/config/process.config.ts:8-15` only `console.warn`s when `TOKEN_SECRET`, `TOKEN_REFRESH`, `SESSION_SECRET`, Mongo credentials are missing, then boots anyway. The failure surfaces later at request time (e.g. `utils/jwt.ts:22` throws on login → 500), and `session.config.ts` silently falls back to `SESSION_SECRET || ''`.
The required list is also wrong: `MONGO_URI` is a valid alternative to `MONGOBD_USER` + `MONGOBD_PASSWORD`, but is not accepted.
## Proposal
Validate `process.env` with a Joi schema in `process.config.ts` (Joi is already a dependency) and throw on error when `NODE_ENV=production`:
- `TOKEN_SECRET` / `TOKEN_REFRESH` required, min 32 chars
- either `MONGO_URI` or both `MONGOBD_USER` + `MONGOBD_PASSWORD`
- numeric vars (`LOCAL_PORT`, `MONGO_*_POOL_SIZE`, `TRUST_PROXY_HOPS`) typed
## Acceptance
- Prod boot with a missing/short secret exits non-zero with a clear message
- Unit test for the schema (missing secret, `MONGO_URI`-only config)

## Doc
`agent-hub/doctrine/features/startup-config-env.md` (new, Status: draft, Source: backfill from code) + INDEX row added. No existing INDEX row covered config/env loading.

## Sources read
- `agent-hub/haven/workers/analyst/manifest.yaml`, `SOUL.md`, `recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`, `doctrine/domains/PROJECT.md` (Invariants, Decisions — MONGO_URI priority decision), `doctrine/MEMORY.md` (test commands)
- `src/config/process.config.ts`, `src/config/session.config.ts`, `src/config/proxy.config.ts`, `src/config/cors.config.ts`, `src/config/index.ts`
- `src/database/mongo.db.ts`, `src/server.ts`, `src/utils/jwt.ts`, `jest.setup.ts`
- grep of `process.env` / `process.config` consumers across `src/` (auth.service, auth.controller, verifyToken, redis, helper, httpsRedirect, winston, rateLimit, createPDF*)
- `.env.example` read was denied by permissions — not used.

## Questions + answers
Unanswered (change Behavior/Acceptance of the #458 fix):
1. Outside production (`development`, `test`, unset `NODE_ENV`): keep today's warn-and-continue, or also fail? The issue only says "throw ... when `NODE_ENV=production`".
2. `SESSION_SECRET`: it is in today's required list but not in the issue's proposal. Required in production? Min 32 chars like the token secrets, or just non-empty?
3. Numeric vars (`LOCAL_PORT`, `MONGO_MAX_POOL_SIZE`, `MONGO_MIN_POOL_SIZE`, `TRUST_PROXY_HOPS`) set to a non-number in production: fail boot, or keep falling back to the default? Unset stays allowed (optional)?
4. `TOKEN_EXP_IN`: stay optional with the `1h` fallback, or required/format-checked in production?
5. Should the min-32 rule also apply to dev/test? If yes, `jest.setup.ts` defaults (`test-token-secret`, 17 chars) must change.

Not verified by running: exit code / listen behavior when `LOCAL_PORT` is non-numeric (NaN passed to `app.listen`) — noted as an edge case, not claimed.

## Result (round 1)
status: needs_input. Doc stays draft. No code touched, no diagram touched.

## Round 2 — operator answers (2026-11-14, relayed by the coordinator)
1. Outside production (development/test/unset NODE_ENV): keep warn-and-continue (console.warn), do NOT fail.
2. SESSION_SECRET in production: required, min 32 chars (same as TOKEN_SECRET/TOKEN_REFRESH).
3. Numeric vars (LOCAL_PORT, MONGO_MAX_POOL_SIZE, MONGO_MIN_POOL_SIZE, TRUST_PROXY_HOPS) set to a non-number in production: fail boot. Unset stays allowed (optional).
4. TOKEN_EXP_IN: stays optional with the existing `1h` fallback.
5. Min-32 rule does NOT apply in dev/test (only warn there) — jest.setup.ts defaults stay unchanged.

Folded into the doc as Behavior 2–5 (marked #458), Acceptance criteria 1–5, Edge cases; Open questions now list the answers.
Reading notes (not new decisions): answer 5 read as "a short secret never blocks boot outside production"; a non-numeric numeric var outside production keeps today's silent default (answer 3 covers production only) — listed as an edge case, not a new rule.

## Result (round 2)
status: spec_ready. Doc stays `Status: draft` — the operator answered the questions but did not confirm the backfilled Behavior as correct, and the #458 items become verified only when the fix's node is SEALED. INDEX row unchanged (draft). No code, no diagram touched.

## Isolation proof
Separate spawned analyst agent, blank context. Received only the dispatch
prompt (bundle paths, backfill mode, issue #458 title/body, "don't modify
src/"). No implementer reasoning, no main-session transcript. Every
Behavior item was read from code myself.
