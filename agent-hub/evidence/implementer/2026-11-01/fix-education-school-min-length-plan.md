# 2026-11-01 - fix-education-school-min-length (plan)

- Worker: implementer · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-education-school-min-length` (PENDING, appended)
- Task: `#331 Education school name requires 10+ characters, rejects real names like MIT` (issue body: lower `school` to `min(1)` or `min(2)`; optionally align max 255 vs frontend 100)
- Branch: `331-education-school-name` (off `staging` @ c040129)

## Hub bytes before: 81409
Measured from `agent-hub/` with:
`{ find . -maxdepth 1 -type f; find doctrine -type f; echo haven/diagrams/dev-loop.prime-mermaid.md; find haven/workers -type f; } | xargs cat | wc -c`

## Acceptance
1. `school` in `education.validate.ts` is `min(1)`; `max(255)` kept.
2. Jest test: `MIT`, `RMIT`, `FPT`, `ĐH Huế` accepted by `schemaEducation`.
3. `npm test` + `npm run build` green (only failures identical to base).
4. `npm run lint` adds zero new problems.

## Anchors
- `src/candidate_profile/education/education.validate.ts:11` — the only `school` length rule (`grep -rn school` over `src/`: `education.model.ts:14` has no length, `swagger.config.ts:211` plain string).
- `src/__tests__/utils/valid.test.ts:60` builds its own local `min(10)` schema to test message translation — independent of `schemaEducation`, not changed.

## Decisions
- `min(1)` over `min(2)`: same as `firstName`/`lastName` (#333); `required()` already rejects empty.
- `max` stays 255 (optional per issue; looser than the form rejects nothing real). `SmallestDiff`.
- `.trim().strict()` on this line is #332's scope, not touched here.
- No slug collision in archive; no other open row cites #331.

## Blockers: none
