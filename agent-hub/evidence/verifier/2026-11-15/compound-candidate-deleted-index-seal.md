# 2026-11-15 - compound-candidate-deleted-index (SEAL)

- Worker: verifier · Version: 0.1.0 · Verdict: **SEAL**
- Node: `compound-candidate-deleted-index` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING → SEALED)
- Graded note: `evidence/implementer/2026-11-15/compound-candidate-deleted-index-diff.md` (plan: `...-plan.md` same dir)
- Issue #465, branch `465-add-compound-index` (uncommitted)

## Isolation proof
Fresh Agent-tool spawn; task string opens "You are the agent-hub **verifier** for the Resume API repo ... You are a fresh, isolated subagent: you have NOT seen the implementer's session" and names node `compound-candidate-deleted-index` — not the implementer's task string. This context wrote no part of the diff and did not open it (EvidenceOnly).

## Re-run: none
Not outward-facing, not a /release gate, PROJECT.md lists no re-run class for model index changes; note cites every MEMORY.md command with the decisive output lines.

## Command check (step 4-5)
- `npx jest <file>` / `npm test` / `npm run build` (Typecheck = inside Build) / `npm run lint` — verbatim from MEMORY.md, run from repo root.
- Lint 274 = baseline 274; `npx eslint` on touched files: 0 problems.
- No `...`/truncated markers; build/lint shown as tails containing the result lines (build exit 0, 274 problems).

## Reasoning (criteria from the node row)
| # | Criterion | Evidence | Result |
|---|---|---|---|
| 1 | 8 schemas declare `{candidateId:1, deletedAt:1}`, no `index: true` on `candidateId`, asserted via `schema.indexes()` | new `src/__tests__/models/candidateIndex.test.ts`: `Tests: 8 passed, 8 total`; with change stashed `Tests: 8 failed, 8 total` (test bites). git status lists exactly the 8 model files + the test | Covered |
| 2 | `npm test` green | `Test Suites: 72 passed, 72 total` / `Tests: 781 passed, 781 total` | Covered |
| 3 | `npm run build` 0 errors | `build exit 0` after `copy` step | Covered |
| 4 | lint ≤ 274, none in touched files | `✖ 274 problems`; touched-file eslint no output | Covered |
| - | Comments per code-comments.md | one 1-line why comment per model, `visit.model.ts:39` style; no violation cited | Covered |

- Feature doc `doctrine/features/cv-section-crud.md` (verified): no Behavior change claimed (index only); its listed jest suites are within the green 781-test run. No `## Feature doc changed`. Status line untouched (not a feat for a draft doc).
- `## Review`: `/code-review medium`, 6 findings each fixed/false-positive/Noticed with reason. Not security-labeled.
- `## Supersedes: none` / `## Still open: none` — no other #465 row on the active diagram.
- No `## Doctrine proposal`.

## Forbidden states (step 7)
ADHOC_WORK: node exists. NO_EVIDENCE: plan + diff notes. EDIT_UNVERIFIED: real outputs cited. CODE_IN_HAVEN: none. DIAGRAM_DRIFT: PM status updated here. None hit.

## Seal gate / proportionality
No outward-facing action (nothing committed/pushed). Diff = 8 models + 1 test, exactly the node scope; out-of-scope items (visit redundant index, plugin refactor, sort indexes) left in Noticed.

## Operator follow-up (from implementer note, not a seal blocker)
After deploy, drop the old `candidateId_1` index on the 8 collections in staging/prod once `candidateId_1_deletedAt_1` exists (Mongoose autoIndex does not drop it).

## PM update
Row archived to `haven/diagrams/dev-loop-archive.md`; active row → pointer; pointer count hit 21, oldest (`cv-upload-temp-rename`, 2026-11-08, already in archive) removed.
