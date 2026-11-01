# 2026-11-01 - add-main-skills (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `add-main-skills` (#343)
- Graded: `evidence/implementer/2026-11-01/add-main-skills-diff.md` (plan: `add-main-skills-plan.md` alongside)
- New PM status: SEALED (collapsed: full row appended to `haven/diagrams/dev-loop-archive.md`, active row replaced in place by a pointer row; oldest pointer row `fix-error-middleware-mapping` (2026-10-21) dropped to keep 20, its full row is already in the archive)

## Isolation proof
Spawned fresh via the Agent tool with the task string "You are the agent-hub **verifier** worker ... You are a fresh, independent context — you did NOT write this diff (NeverVerifyOwnWork)", which the implementer pass did not have. This context has no implementation history and did not write the diff.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | Model field `mainSkills` default `[]` in `generalInformation.model.ts` | Diff row: `mainSkills: { type: [personalSkills], default: [] }`, which reuses the personalSkills sub-schema | Covered |
| 2 | Joi `mainSkills` max 5: 6 rejected, 5 accepted, proven by a test in `generalInformation.validate.test.ts` | Diff row: `.max(5)` in `_sub` (PUT and PATCH). New test: `Tests: 2 passed, 2 total`, i.e. 5 accepted and 6 rejected with path `['mainSkills']`. The file is present untracked in `git status --short` | Covered |
| 3 | Type, swagger and locale label updated | Diff rows: `candidate.type.ts` `mainSkills?: Skill[]`; `swagger.config.ts` `maxItems: 5`; `vi.ts`/`en.ts` `Kỹ năng chính`/`Main skills`. All 4 files show `M` in `git status --short` | Covered |
| 4a | `npm test` green | `Tests: 5 failed, 488 passed, 493 total`. The same 2 suites (`tokenExpiry`, `atsPdfIntegration`) fail on the stashed base (`5 failed, 2 passed, 7 total`). They are environment-dependent and match prior seals on this base (491 total there; 493 = +2 new tests) | Covered (pre-existing only) |
| 4b | `npm run build` green (Typecheck: inside Build, per MEMORY.md) | `build exit=0` | Covered |
| 4c | `npm run lint` ≤ 274 with none in changed files | `✖ 274 problems (274 errors, 0 warnings)` = baseline. The 2 errors in `generalInformation.validate.ts` (`positionDesired`/`career`, `no-unsafe-assignment`) exist on the stashed base at 43:3/48:3 and moved +5 lines to 48:3/53:3. They are on untouched lines, so this diff adds none. Fixing them would be out of scope (`SmallestDiff`) | Covered |
| — | Comments per code-comments.md | Row present: no comments added | Covered |

- Commands match `doctrine/MEMORY.md`: `npx jest <path>`, `npm test`, `npm run build` (Typecheck inside Build), `npm run lint`, all run from the repo root. The output has no `...` or "truncated" markers.
- Step 6: the note has `## Supersedes: none`. A grep of the active diagram for `343` found only this node's row.
- Forbidden states (5): none hit. The node exists, the evidence is present, there is no code in `haven/`, the PM status was still PENDING (the implementer did not set it), and the diff was not self-graded.
- Seal gate: no outward action ("none").
- Proportion: `git status --short` shows exactly the 6 `src/` files plus 1 new test that the Diff table lists. Nothing extra. PDF/DOCX/ATS export rendering was deliberately left out (it is under Noticed, not requested), so the PDF-export standard does not apply.

## Re-run
none. This was an audit only (the default). No exception case applies: the node is not outward-facing, it is not a release gate, and the note is complete. The only check beyond the note was `git status --short`, run to confirm the file list.
