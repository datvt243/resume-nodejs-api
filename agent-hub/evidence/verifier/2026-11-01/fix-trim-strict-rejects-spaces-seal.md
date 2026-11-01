# 2026-11-01 - fix-trim-strict-rejects-spaces (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-trim-strict-rejects-spaces` (#332)
- Graded: `evidence/implementer/2026-11-01/fix-trim-strict-rejects-spaces-diff.md` (plan: `...-plan.md` alongside)
- New PM status: SEALED (collapsed: full row appended to `haven/diagrams/dev-loop-archive.md`, active row replaced in place by a pointer row; oldest pointer row `fix-async-errors-and-404` (2026-10-21) dropped to keep 20, its full row is already in the archive at line 119)

## Isolation proof
Spawned fresh via the Agent tool, description "Verify seal fix-trim-strict-rejects-spaces", subagent_type general-purpose. This context has no implementation history and did not write the diff.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | `.strict()` dropped from the 11 user-typed fields; validated `value` (saved by callers) is trimmed | Diff table names all 11: `joi.config.ts` `email`, `firstName`, `lastName`, `fullName`, `company`, `position`, `phone`, `_stringDefault`; `education.validate.ts:11-12` `school`, `major`; `profile.validate.ts:16` `name`. Caller anchors `valid.ts:27-30`, `BaseController.ts:214-218,227-231`; `✓ trims surrounding spaces instead of rejecting them`, `✓ trims surrounding spaces from school and major` | Covered |
| 2 | Passwords, `token`, `companyId` keep `.strict()` | Post-diff grep lists exactly 4 lines: `joi.config.ts:47` password, `auth.validate.ts:10` password, `auth.validate.ts:28` token, `project.validate.ts:15` companyId | Covered |
| 3 | Tests: `' An '` → `'An'`, `' MIT '` trimmed, numbers still rejected, all-space still rejected | `Tests: 14 passed, 14 total` with `✓ trims surrounding spaces instead of rejecting them`, `✓ trims surrounding spaces from school and major`, `✓ still rejects 123`, `✓ still rejects "   "`. The diff table records `' An '` → `{ value: 'An' }`. The `string.base` code is not shown by name in the output. Rejection is the requirement, so this does not block the seal | Covered |
| 4 | `npm test` + `npm run build` green (only pre-existing failures) | `build exit=0`; `Tests: 5 failed, 486 passed, 491 total`, same 2 suites (`tokenExpiry`, `atsPdfIntegration`) as base `5 failed, 482 passed, 487 total` (matches the with-diff count in the prior seal of `fix-education-school-min-length`, i.e. this branch's base 2f45cde); 487 → 491 = +4 new tests | Covered |
| 5 | `npm run lint` adds zero new problems | `✖ 274 problems (274 errors, 0 warnings)`, base 274 | Covered |
| — | Comments per code-comments.md | Row present: no comments added or changed | Covered |

- Commands match `doctrine/MEMORY.md`: `npx jest <path>`, `npm test`, `npm run build`, `npm run lint`, all from the repo root. The output has no `...` or "truncated" markers.
- 6b: the note has `## Supersedes: none` / `## Still open: none`. A grep of `haven/diagrams/` for `#332` found only this node's row.
- Forbidden states (5): none hit. The node exists, the evidence is present, there is no code in `haven/`, the implementer did not set the PM status, and the diff was not self-graded.
- Seal gate: no outward action ("none").
- Proportion: 11 one-token `.strict()` removals across 3 files plus +4 tests. The 4 deliberate keeps and the "14 vs 15 sites" discrepancy are logged under Noticed (`SmallestDiff`).

## Re-run
none. This was an audit only (the default), and no exception case applies: the node is not outward-facing, it is not a release gate, `doctrine/domains/PROJECT.md` names no re-run class for it, and the note is complete.
