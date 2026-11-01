# 2026-11-01 - fix-education-school-min-length (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-education-school-min-length` (#331)
- Graded: `evidence/implementer/2026-11-01/fix-education-school-min-length-diff.md` (plan: `...-plan.md` alongside)
- New PM status: SEALED (collapsed: full row appended to `haven/diagrams/dev-loop-archive.md`, active row replaced in place by a pointer row; oldest pointer row `add-experience-career-break` dropped to keep 20, its full row is already in the archive at line 117)

## Isolation proof
Spawned fresh via the Agent tool, description "Verify seal fix-education-school-min-length", subagent_type general-purpose. This context has no implementation history and did not write the diff.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | `school` `min(1)`, `max(255)` unchanged | diff: `-  school: Joi.string().min(10).max(255)...` / `+  school: Joi.string().min(1).max(255)...` (`education.validate.ts:11`) | Covered |
| 2 | Jest test: `MIT`/`RMIT`/`FPT`/`ĐH Huế` validate in `schemaEducation` | `✓ accepts MIT`, `✓ accepts RMIT`, `✓ accepts FPT`, `✓ accepts ĐH Huế`, `Tests: 4 passed, 4 total` | Covered |
| 3 | `npm test` + `npm run build` green (only pre-existing failures) | `build exit=0`; `Tests: 5 failed, 482 passed, 487 total`, same 2 suites (`tokenExpiry`, `atsPdfIntegration`) as base `5 failed, 478 passed, 483 total` recorded in `evidence/implementer/2026-10-31/fix-lastname-min-length-diff.md:31`; 483 → 487 = +4 new tests | Covered |
| 4 | `npm run lint` adds zero new problems | `✖ 274 problems (274 errors, 0 warnings)`, base 274 (matches the with-diff count at `fix-lastname-min-length-diff.md:49`, which is this branch's base c040129); touched-file eslint: 1 pre-existing `no-unsafe-assignment` on untouched line 10, 0 in the new test | Covered |
| — | Comments per code-comments.md | Row present: one 1-line why comment (school names are often short acronyms), no issue ref, no what-narration. This is consistent with the Keep/Style rules | Covered |

- Commands match `doctrine/MEMORY.md`: `npx jest <path>`, `npm test`, `npm run build`, `npm run lint`, all from the repo root. The output is summary lines with no `...` or "truncated" markers.
- 6b: the note has `## Supersedes: none` / `## Still open: none`. A grep of `haven/diagrams/` for `#331` turned up only this node's row, and `#332` (trim/strict) has no open row.
- Forbidden states (5): none hit. The node exists, the evidence is present, there is no code in `haven/`, the implementer did not set the PM status, and the diff was not self-graded.
- Seal gate: no outward action ("none").
- Proportion: a 1-token source change plus 1 new test file. `max` and `.trim().strict()` were left alone and logged under Noticed (`SmallestDiff`).

## Re-run
none. This was an audit only (the default), and no exception case applies: the node is not outward-facing, it is not a release gate, and the note is complete.
