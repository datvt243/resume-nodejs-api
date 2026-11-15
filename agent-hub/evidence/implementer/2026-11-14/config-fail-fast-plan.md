# config-fail-fast — plan (implementer, pick_next)

- Date: 2026-11-14
- Task: #458 Config: fail fast at startup when required env vars are missing
- Branch: `458-config-fail-fast` (off `staging`)
- Node: `config-fail-fast` (new row, PENDING, `haven/diagrams/dev-loop.prime-mermaid.md`); slug not in `dev-loop-archive.md` (grep count 0); no other non-SEALED row cites #458.

## Hub bytes before: 97386

## Feature doc: agent-hub/doctrine/features/startup-config-env.md
Spec = Behavior 2-5 (decided by operator 2026-11-14, see `evidence/analyst/2026-11-14/startup-config-env-spec.md`). Open questions: all answered.

## Acceptance criteria (copied from the doc)
1. `npx jest src/__tests__/config/` passes, covering: prod + `TOKEN_SECRET` missing → error naming it; prod + `TOKEN_REFRESH`/`SESSION_SECRET` 31 chars → error; prod + only `MONGO_URI` → no error; prod + no Mongo config → error; prod + each numeric var non-number → error; prod + numeric unset → no error; development + missing secret → no throw.
2. Production boot with `TOKEN_SECRET` missing/short exits non-zero, message names the var, nothing listens.
3. Development boot with `TOKEN_SECRET` unset warns naming it and keeps starting.
4. `npm test` passes, `jest.setup.ts` unchanged.
5. `npm run build` passes.
6. Matches `features/startup-config-env.md` Behavior #2-#5.
Self-check (step 5): each criterion maps to a command; no vague wording — not rewritten.

## Code anchors (grep-confirmed)
- `src/config/process.config.ts` (the warn-only block, lines 8-15)
- `src/__tests__/config/` (existing: cors/helmet/joi/proxy tests) — new `process.config.test.ts`
- Consumers unchanged: `src/database/mongo.db.ts`, `src/config/session.config.ts`, `src/server.ts`

## blocked_by: none
