# 2026-11-02 - add-familiar-skills (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `add-familiar-skills` (#349)
- Graded: `evidence/implementer/2026-11-02/add-familiar-skills-diff.md` (plan: `add-familiar-skills-plan.md` alongside)
- New PM status: SEALED (collapsed: full row appended to `haven/diagrams/dev-loop-archive.md`, active row replaced by a pointer row; oldest pointer row `services-throw-apperror` (2026-10-21) dropped to keep 20, its full row is already in the archive)

## Isolation proof
Spawned fresh via the Agent tool with description "verify_seal add-familiar-skills #349". This context has no implementation history and did not write the diff.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | Model field `familiarSkills` default `[]` | Diff row: `familiarSkills: { type: [personalSkills], default: [] }` after `mainSkills` | Covered |
| 2 | Joi array of `{ name }`, no `.max()`, 20 accepted, proven by test | Diff row: `Joi.array().items({ name: Joi.string() })`, no `.max()`, shared by PUT + PATCH. Output: `✓ accepts any number of familiar skills`, `Tests: 3 passed, 3 total` | Covered |
| 3 | Type + swagger (no maxItems) + vi/en label | Diff rows: `familiarSkills?: Skill[]`; swagger array without `maxItems`; `Kỹ năng quen thuộc` / `Familiar skills`; `build exit 0` | Covered |
| 4a | `npm test` green (pre-existing env failures excepted) | `Tests: 5 failed, 490 passed, 495 total`. The failures are `tokenExpiry` + `atsPdfIntegration`, the same 5 recorded on base at the `add-main-skills` seal (488 passed then) | Covered (pre-existing only) |
| 4b | `npm run build` green (Typecheck inside Build, per MEMORY.md) | `build exit 0` | Covered |
| 4c | Lint ≤ 274, none in changed files | `✖ 274 problems (274 errors, 0 warnings)` = baseline. The 2 `no-unsafe-assignment` in `generalInformation.validate.ts` exist with and without the diff (stash compare), only shifted lines 48/53 → 51/56. Same pair the `add-main-skills` seal accepted | Covered |
| — | Comments per code-comments.md | Row present: no comments added/changed | Covered |

- Commands match `doctrine/MEMORY.md` (`npx jest <path>`, `npm test`, `npm run build`, `npm run lint`). Output has no `...`/"truncated" markers.
- Step 6: `## Supersedes: none`, `## Still open: none`. A grep of the active diagram for `349` found only this node's row.
- Forbidden states (5): none hit. The node exists, the evidence exists, there is no code in `haven/`, the status was PENDING (not set by the implementer), and the diff was not self-graded.
- Seal gate: no outward action ("none").
- Proportion: `git status --short src/` shows exactly the 7 files in the Diff table. Export rendering was left out (listed under Noticed, not requested), so the PDF-export standard does not apply.

## Re-run
none. This was an audit only. The node is not outward-facing, it is not a release gate, and the note is complete. The only check beyond the note was `git status --short src/`, run to confirm the file list.
