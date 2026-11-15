# 2026-11-15 - upload-route-tests (SEAL)

- Worker: verifier · Version: 0.1.0
- Node: `upload-route-tests` (`haven/diagrams/dev-loop.prime-mermaid.md`) · Issue: #402 (label: testing) · Branch: `402-add-tests-for` (staging is an ancestor of HEAD)
- New PM status: SEALED. The full row is archived to `haven/diagrams/dev-loop-archive.md` and the active row is replaced by a pointer. That made 21 pointers, so the oldest one (`trust-proxy-hops`) was dropped. Its full row is already in the archive.
- Notes audited: `evidence/implementer/2026-11-15/upload-route-tests-plan.md`, `evidence/implementer/2026-11-15/upload-route-tests-diff.md`
- Feature docs: `doctrine/features/cv-file-upload-import.md` (Behavior #2-3), `doctrine/features/cv-section-crud.md` (Behavior #9). Both are `verified`.

## Isolation proof
Fresh Agent-tool spawn, spawn=fresh. The task string starts "You are the agent-hub **verifier** worker for the Resume API repo" and lists "Run `verify_seal` on: Node: `upload-route-tests`". That is not the implementer's task string ("#402 Add tests for stored-CV upload/download and section image upload"). This context wrote no part of the diff.

## Reasoning
| # | Criterion (node row + plan + feature doc) | Evidence in note | Result |
|---|---|---|---|
| 1 | Targeted jest on the 2 new files passes, through the real routers over HTTP | `Tests:       35 passed, 35 total` (8 CV + 27 = 9 × award/certificate/project) | Covered |
| 1a | upload-cv (Behavior #2): valid PDF → 200 `{ originalName, uploadedAt }` + stored; > 5MB → 400; wrong mime / wrong extension → 400 `FILE_INVALID_TYPE`; no file → 400 | ✓ lines: "stores a valid PDF and answers 200 with { originalName, uploadedAt }", "rejects a file over 5MB with 400 cvFileTooLarge", "rejects a non-PDF mime type…", "rejects a non-.pdf extension…", "answers 400 when the request carries no file". The "previous CV kept on a rejected upload" part of #2 stays covered by the existing `uploadCV.middleware.test.ts` (per the note) | Covered |
| 1b | cv-file (Behavior #3): no upload → 404; record but file missing → 404; download under the original name | ✓ "answers 404 on GET /cv-file before any upload, even with a file on disk", "…when the record exists but the file is gone", "downloads the stored file under its original name" | Covered |
| 1c | images (Behavior #9), each section: 200 existing + new URLs; unknown / soft-deleted → 404, nothing written; other candidate's → 403, nothing written; no files / > 5MB / > 5 files / wrong type → 400 | 9 ✓ lines × 3 sections, matching each branch. The mutation check (dropping `|| document.deletedAt` → 3 failed) shows the soft-delete test catches a real regression. The note says it was reverted, and `git status --short src` now shows only the 2 new files | Covered |
| 2 | `npm test` passes | `5 failed, 738 passed, 743 total`. The 5 are the known env-only failures: tokenExpiry ×1 (`Received: 10800`, local `.env`) and atsPdfIntegration ×4 (no Chrome). This is the same set accepted in `config-fail-fast-seal.md` and earlier seals. No tracked file changed, so 0 new failures | Covered |
| 3 | `npm run build` (Typecheck inside Build) | `build rc=0` | Covered |
| 4 | Lint: 0 in the new files, total ≤ baseline 274 | `✖ 274 problems (274 errors, 0 warnings)` = baseline; `npx eslint <2 new files>` → `lint-new rc=0` | Covered |
| 5 | Comments per code-comments.md | File-header `/** */` gives the WHY; one `//` WHY line; no `(#N)` refs | Covered |
| 6 | Supersedes / Still open | `## Supersedes: none`, `## Still open: none`. My own grep of `#402` on the active diagram finds only this row | Covered |

- Commands match `doctrine/MEMORY.md` (Test one file, Test, Build/Typecheck inside Build, Lint with the baseline count cited), run from the repo root.
- Truncation: none. The summary lines are quoted verbatim.
- Feature doc: a `## Feature doc` line is present. It has no `## Feature doc changed` line (docs untouched), so no operator answer is needed.
- Review: `/code-review medium` found 10 issues, none of them correctness bugs in production code. 1-7 and 9 are fixed (stronger assertions, a soft-delete case, a "record but file gone" case, a disk-empty check on rejection). 8 and 10 are cleanups moved to `## Noticed, not done`. A `/security-review` is not required because the issue is labeled `testing`.
- Forbidden states: ADHOC_WORK no (the node is on the diagram and not in the archive before this SEAL). NO_EVIDENCE no. EDIT_UNVERIFIED no. CODE_IN_HAVEN no (only `.md` edits under `haven/`). DIAGRAM_DRIFT resolved by this SEAL.
- Seal gate: none needed. The diff only adds test files and has no outward action. The note has no explicit `## Seal gate` line, which is a format gap but not a reason to REOPEN, since nothing was outward-facing.
- Proportionality: 2 new test files and no production change. My own check, `git diff --quiet staging -- src`, passes, and `git status --short src` lists only those 2 files. This matches the node.
- Residual risk (from the note): the tests write into the real `src/public/uploads/images` and `src/storage/cv`. A killed run can leave `test-img-routes-*` / `test-cv-routes-*` files behind (they are gitignored). The note shows cleanup count `0` after the full run.
- Doctrine proposal: none.
- 11e: this is a tests-only SEAL against already-`verified` docs, so their Status and INDEX rows are left as they are.

## Re-run
none. This was audit-only. The note is verbatim, the commands match doctrine and every criterion is cited. The node is not outward-facing or a release gate, and PROJECT.md has no re-run rule for it. Only read-only git checks were run (src diff vs staging, status, ancestry).
