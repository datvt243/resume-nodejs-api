# 2026-11-01 - delete-all-visits (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `delete-all-visits` (#345)
- Graded: `evidence/implementer/2026-11-01/delete-all-visits-diff.md` (plan: `delete-all-visits-plan.md` alongside)
- New PM status: SEALED (collapsed: full row appended to `haven/diagrams/dev-loop-archive.md`, active row replaced in place by a pointer row; oldest pointer row `fix-status-codes` (2026-10-21) dropped to keep 20, its full row is already in the archive)

## Isolation proof
Spawned fresh via the Agent tool with the task string "You are the agent-hub **verifier** worker ... run `verify_seal` on ... Node: `delete-all-visits` ... (GitHub issue #345 ...)", which the implementer pass did not have. This context has no implementation history and did not write the diff.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | service `handlerDeleteVisits` + controller `fnDeleteVisits` + route in `candidate.route.ts`, candidateId only from JWT | Diff rows 1-3: `MODELS.Visit.deleteMany({ candidateId }).exec()` → `data: { deletedCount }`; controller takes the id only from `req.user._id` (AuthenticationError otherwise); `router.delete('/visits', ...)` on the same router as GET /visits, behind verifyToken (inline CSRF for cookie-only auth) | Covered |
| 2 | Test proves `deleteMany` called with `{ candidateId }` and returns deletedCount | Diff row 6: asserts `mock.calls` `[[{ candidateId: 'cand1' }]]` and `data: { deletedCount: 3 }`; `Tests: 9 passed, 9 total` | Covered |
| 3 | vi/en message + `.claude/rules/api.md` row | Diff rows 4-5 (`candidate.deleteVisitsSuccess`, DELETE `/visits` row); all 3 files show `M` in `git status --short` | Covered |
| 4a | `npm test` green except pre-existing env failures | `Tests: 5 failed, 489 passed, 494 total`; the same 2 suites (`tokenExpiry`, `atsPdfIntegration`) / 5 tests fail on the stashed base (cited from add-main-skills-diff.md, matches that seal); 489 = 488 + 1 new test | Covered (pre-existing only) |
| 4b | `npm run build` green (Typecheck: inside Build, per MEMORY.md) | `build exit=0` | Covered |
| 4c | `npm run lint` ≤ 274, none new in changed files | `✖ 274 problems (274 errors, 0 warnings)` = baseline. The 1 new `unbound-method` from the first run was fixed (275 → 274). Remaining errors in touched files are on untouched lines (test 121/136/172-174; controller 44/59/112 unchanged, 236/238/251 = base 225/227/240 shifted +11). Same treatment as the add-main-skills seal | Covered |
| — | Comments per code-comments.md | Row present: 1 WHY comment on `handlerDeleteVisits` (hard delete because Visit has no deletedAt); controller comment mirrors `fnGetVisitStats` | Covered |

- Commands match `doctrine/MEMORY.md`: `npx jest <path>`, `npm test`, `npm run build` (Typecheck inside Build), `npm run lint`, all run from the repo root. The output has no `...` or "truncated" markers.
- Step 6: `## Supersedes: none`. A grep of the active diagram for `345` found only this node's row.
- Forbidden states (5): none hit. The node exists, the evidence is present, there is no code in `haven/`, the PM status was still PENDING (the implementer did not set it), and the diff was not self-graded.
- Seal gate: no outward action ("none").
- Proportion: `git diff --stat -- src .claude` shows exactly the 7 files in the Diff table (53+/2-). Nothing extra. Orphaned Visits on account delete and a controller-level test are listed under "Noticed, not done", which is the correct scope.

## Re-run
none. This was an audit only (the default). No exception case applies: the node is not outward-facing, it is not a release gate, and the note is complete. The only checks beyond the note were `git status --short` and `git diff --stat`, run to confirm the file list.
