# 2026-10-25 - fix-create-returns-created-doc (verdict)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `fix-create-returns-created-doc` (GitHub #319) in `haven/diagrams/dev-loop.prime-mermaid.md`
- Evidence audited: `evidence/implementer/2026-10-25/fix-create-returns-created-doc-plan.md`, `evidence/implementer/2026-10-25/fix-create-returns-created-doc-diff.md`
- New PM status: SEALED

## Isolation proof
Spawned as a fresh subagent via the Agent tool with description "Verify seal fix-create-returns-created-doc" and a task prompt naming this node and the two implementer notes; no implementation history in this context. Did not open the diff (only the notes + diagram + `git status` file list from the spawn context).

## Reasoning
- Command (step 4): `npm test`, `npx jest <file>`, `npm run build`, `npm run lint` — all match `doctrine/MEMORY.md`. Build row present: `BUILD_RC=0`.
- Output (step 5): no `...`/"truncated" markers; summary lines verbatim (`Tests: 7 passed, 7 total`; `Tests: 5 failed, 468 passed, 473 total`; `✖ 274 problems`).
- AC1 (`baseCreateDocument` generates `_id`, real id on return): `✓ the Mongoose document create() builds carries a real ObjectId, not null`; regression proof — restoring `_id: null` → `Tests: 3 failed, 1 passed, 4 total` incl. real-model ✕.
- AC2 (section + generalInformation `handlerCreate` return single doc; both hooks removed): diff table rows for `BaseService.ts`/`generalInformation.service.ts`; `✓ education…`, `✓ award…`, `✓ returns the created document, not a one-item array`.
- AC3 (tests: object not array, `_id` == persisted, ≥2 sections, second create, real Mongoose check): it.each education+award, two creates, `_id` toBe `model.docs[1]._id`, `Array.isArray` false, `find` never called; real `Award` model test.
- AC4 (test/build/lint no new): 5 failures = `auth/tokenExpiry` (1) + `atsPdfIntegration` (4), same 5 with diff stashed (local env: TOKEN_EXP_IN, no Chrome — matches prior SEALed notes); `BUILD_RC=0`; lint 274 vs staging baseline 275 → 0 new, touched test file 0 errors.
- Comments per code-comments.md: row present — WHY JSDoc on id generation, 1-line hook note, issue refs `(#157)/#181/#177` removed from rewritten test, stale `visit.model.ts` `_id: null` comment corrected. No rule violation cited.
- 6b Supersedes: `## Supersedes: none`; grep of active diagram + archive for `#319`/slug → only this row. OK.
- Forbidden states (step 7): ADHOC_WORK — node on diagram; NO_EVIDENCE — plan+diff notes present; EDIT_UNVERIFIED — runs cited verbatim; CODE_IN_HAVEN — no code files under `haven/`; DIAGRAM_DRIFT — resolved by this SEAL. None hit.
- Seal gate (step 8): `none` — no commit/push yet; correct.
- Proportion (step 9): 5 src files, all required by the node (incl. `visit.model.ts` comment that became false). `hookAfterSave` param kept, not churned. No overreach.

## Re-run
none — audit-only (note verbatim, commands match doctrine, every criterion cited; node is not a `/release` gate).

## PM update
Row collapsed: full row appended (state SEALED) to `haven/diagrams/dev-loop-archive.md`; pointer row left in place. Pointer count hit 21 → deleted the oldest pointer `add-refresh-token-reuse-detection` (2026-10-16, full row already in archive).
