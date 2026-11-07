# 2026-11-07 - fix-section-id-empty-query (verdict)
- Worker: verifier · Version: 0.1.0
- Node: `fix-section-id-empty-query` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #381)
- Notes audited: `evidence/implementer/2026-11-07/fix-section-id-empty-query-plan.md`, `evidence/implementer/2026-11-07/fix-section-id-empty-query-diff.md`
- New PM status: SEALED (row collapsed into `haven/diagrams/dev-loop-archive.md`; oldest pointer row `readme-vi-rewrite` (2026-10-24) pruned per step 11c — 21 → 20 pointer rows, its full row already in the archive)

## Isolation proof
Fresh Agent-tool subagent spawned with description "verify_seal fix-section-id-empty-query #381", spawn token `VS-381-2026-11-07-a` — not the implementer's task string (`/todo #381`). No memory of the implement pass; diff not opened, only the two notes.

## Reasoning
| Criterion | Cited evidence |
|---|---|
| 1. Dropped `_id` → `isExist:false` without querying → delete/restore 404, no `updateOne` (Behavior #5/#6) | Output 1: 4 `✓ baseDeleteDocument/baseRestoreDocument answers 404 for "a$b"/"   " instead of acting on the first document`; Diff table: tests assert 404 `NOT_FOUND` and `findOne`/`updateOne` never called, fixture owned by the caller (worst case) |
| 2. Regression tests pass | Output 1 `Tests:       17 passed, 17 total` — superset of the node's command (`baseSoftDelete` + `baseUpdatePatchSoftDelete`) |
| 3a. `npm test` no new failures vs staging | Output 2 `Tests:       5 failed, 576 passed, 581 total` vs baseline `5 failed, 572 passed, 577 total`; same 5 `✕` names (tokenExpiry env `TOKEN_EXP_IN`, ATS no local Chrome) — same pre-existing set prior seals accepted; +4 = new tests |
| 3b. `npm run build` clean / Typecheck (inside Build) | Output 3 `BUILD_EXIT=0` |
| 3c. Lint ≤ 274, none new in touched files | Output 4 `✖ 274 problems (274 errors, 0 warnings)` = baseline; touched files 2/2 before/after, identical messages, both outside the diff — same reading prior seals used |
| 4. comments per code-comments.md | 1 `//` one-sentence WHY/trap in function body (`services/index.ts`), 1 `//` WHY on the test fixture; no `(#N)` in comments (issue ref only in a `describe` title, file idiom) |
| Feature doc `doctrine/features/cv-section-crud.md` Behavior #5/#6 (unknown id → 404) | Same as criterion 1; doc unchanged (no `## Feature doc changed` line needed). Fix SEAL — doc Status left as is (step 11e) |
| Supersedes / Still open | both `none`; grep of active diagram for 381 → only this node |

Forbidden states: ADHOC_WORK no (node on diagram) · NO_EVIDENCE no (plan + diff notes) · EDIT_UNVERIFIED no (verbatim test/build/lint output) · CODE_IN_HAVEN no (no non-md/yaml file in `haven/`) · DIAGRAM_DRIFT no (status moved to SEALED here).
Seal gate: none — no commit/push/API call; `src/` diff shown to operator in chat.
Proportionality: one guard in the shared root-cause helper `baseCheckDocumentById` (all 4 callers get the 404) + one test block. Update/patch also covered is the same helper, not extra scope (Behavior #4 already says unknown `_id` → 404). `project.service.ts`/`application.service.ts` same-shape cases correctly left under "Noticed, not done".

## Re-run
none — audit-only. Output is verbatim, commands match `doctrine/MEMORY.md`, not outward-facing or a `/release` gate, and `doctrine/domains/PROJECT.md` lists no re-run class for this change.
