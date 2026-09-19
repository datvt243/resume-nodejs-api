# 2026-09-19 — fix-soft-delete-bypass-on-update-patch (diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-soft-delete-bypass-on-update-patch`
- Task: see `fix-soft-delete-bypass-on-update-patch-plan.md`

## Diff
| File | Why |
|---|---|
| `src/services/index.ts` | `baseCheckDocumentById` gains an opt-in `{ excludeDeleted?: boolean }` 4th param; when set, its `findOne` query includes `deletedAt: null` (same pattern as `baseFindDocument`). `baseUpdateDocument` and `basePatchDocument` now call it with `excludeDeleted: true`. `baseDeleteDocument`/`baseRestoreDocument` call sites left unchanged (default `excludeDeleted` unset). |
| `src/__tests__/services/baseUpdatePatchSoftDelete.test.ts` (new) | Regression coverage: `baseUpdateDocument`/`basePatchDocument` must fail (no `updateOne` call) when the target document has `deletedAt` set, and must still succeed normally on a non-deleted document. |

## Command
```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, per `doctrine/MEMORY.md`)

## Output
```
Test Suites: 18 passed, 18 total
Tests:       96 passed, 96 total
Snapshots:   0 total
Time:        5.887 s, estimated 6 s
Ran all test suites.
```
Also ran `npm run build` — `tsc && npm run copy` completed with no errors
or warnings.

## Acceptance
| Criterion | Evidence |
|---|---|
| A soft-deleted document can no longer be updated via `baseUpdateDocument` | `src/__tests__/services/baseUpdatePatchSoftDelete.test.ts` — "fails without touching the document when it has been soft-deleted" (update suite) — PASS, asserts `model.updateOne` not called |
| A soft-deleted document can no longer be patched via `basePatchDocument` | same file, patch suite — PASS, same assertion |
| Non-deleted documents are unaffected (no regression) | same file — both "still updates/patches a normal (non-deleted) document (regression check)" tests — PASS |
| `baseRestoreDocument` still restores an already-soft-deleted document (not broken by this change) | `src/__tests__/services/baseSoftDelete.test.ts` — "clears deletedAt when the owner matches, even for an already soft-deleted document" — PASS (unchanged existing test, re-run clean) |
| No regression elsewhere | `npm test` — `Tests: 96 passed, 96 total` (was 92 on `staging`; +4 from this node's new test file) |
| Typecheck/build clean | `npm run build` — `tsc && npm run copy`, no errors |

## Noticed, not done
- `basePatchDocument` performs no ownership check at all (`userID` isn't
  even a parameter) — unrelated to this node's soft-delete scope, but
  worth flagging: unlike `baseUpdateDocument`/`baseDeleteDocument`, a
  PATCH caller's identity is never cross-checked against the document's
  `candidateId` inside this shared helper. Not fixed here — out of scope
  for issue #136, own node if this is confirmed to be reachable without
  an ownership check elsewhere in the call chain (e.g. the controller
  layer).
- Sibling code-review finding (this session, finding 1 of 10) —
  `fix-candidate-me-nosql-filter-collapse` (issue #135) — is a separate,
  independent node on its own branch, not part of this diff.

## Seal gate
None — no outward-facing action in this pass (no commit/push/publish;
working tree changes only, on branch `136-soft-deleted-cv-section`).
