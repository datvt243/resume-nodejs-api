# 2026-09-12 — add-soft-delete-restore-cv-sections

- Worker: implementer
- Version: 0.1.0
- Node: `add-soft-delete-restore-cv-sections` (new, appended to
  `haven/diagrams/dev-loop.prime-mermaid.md` — no existing node matched
  this task)
- Task (verbatim, via `/todo #121`):
  > Issue #121: Soft-delete + restore for CV sections and candidate account.
  > Problem: All CV section deletes go through baseDeleteDocument
  > (services/index.ts) → MODEL.deleteOne({ _id }). Account-level DELETE
  > /api/v1/candidate wipes the candidate plus every section document.
  > Both are hard, irreversible deletes.
  > Proposal: add deletedAt: number | null (default null) to the CV
  > section models and Candidate; baseDeleteDocument sets deletedAt =
  > Date.now() instead of deleteOne (same ownership check, same return
  > shape); baseFindDocument / baseGetAll exclude deletedAt-set documents
  > by default via the existing QuerySafe-built filter — no caller changes
  > needed elsewhere; add a restore endpoint POST /:collection/restore/:id
  > mirroring the existing DELETE /delete/:id pattern in
  > BaseController.ts, same ownership check. Scheduled hard-delete cleanup
  > is out of scope.
  > GitHub issue: https://github.com/datvt243/resume-nodejs-api/issues/121

## Hub bytes before: 63350

## Diff
| File | Why |
|---|---|
| `src/models/{experience,education,project,certificate,award,generalInformation}.model.ts`, `reference.modal.ts`, `candidate.model.ts` | Add `deletedAt: { type: Number, default: null }` (issue #121 proposal bullet 1) |
| `src/services/index.ts` | `baseFindDocument`: `idQuerySafe.safeQuery({}, fields)` → `idQuerySafe.safeQuery({ deletedAt: null }, fields)` (bullet 3, no caller changes needed). `baseDeleteDocument`: `MODEL.deleteOne({_id})` → `MODEL.updateOne({_id}, {deletedAt: Date.now()})`, same ownership check/return shape (bullet 2). New `baseRestoreDocument`: mirrors `baseDeleteDocument`, sets `deletedAt: null`, same ownership check (bullet 4). |
| `src/candidate_profile/BaseController.ts` | New `baseRestore` handler mirroring `baseDelete`, calls `baseRestoreDocument` |
| `src/routers/api/v1/{education,experience,award,certificate,project,reference}.route.ts` | New `POST /restore/:id` route wired to `baseRestore` + `Collections.<X>`, mirrors the existing `DELETE /delete/:id` route registration exactly. `generalInformation.route.ts` NOT touched — it has no `delete` route today (single doc per candidate), so no `restore` route either; only its model gained `deletedAt`. |
| `src/locales/{vi,en}.ts` | New `common.cannotRestore` / `restoreSuccess` / `restoreFailed` / `restoreNotYours` keys, mirroring the existing delete-message set |
| `src/__tests__/services/baseFindDocument.test.ts` | 3 pre-existing assertions (`findOne`/`find`/`countDocuments` called-with) updated to include `deletedAt: null` — this is the intended behavior change from bullet 3, not a regression |
| `src/__tests__/services/baseSoftDelete.test.ts` (new) | 6 new tests: `baseDeleteDocument` sets `deletedAt` on owner match / refuses on non-owner / fails on not-found; `baseRestoreDocument` clears `deletedAt` on owner match (incl. already-deleted doc) / refuses on non-owner / fails on not-found |

## Command
`npm test`

## Output
```
Test Suites: 14 passed, 14 total
Tests:       83 passed, 83 total
Snapshots:   0 total
Time:        3.549 s, estimated 4 s
Ran all test suites.
```
Also ran `npm run build` (`tsc && npm run copy`) — exit clean, no compiler errors.

## Acceptance
| Criterion | Evidence |
|---|---|
| `deletedAt` field added to all 7 CV section models + Candidate | `git diff` on the 8 model files above — each adds `deletedAt: { type: Number, default: null }` |
| `baseDeleteDocument` soft-deletes instead of hard-deletes, same ownership check + return shape | `src/services/index.ts` diff: `MODEL.updateOne({_id},{deletedAt:Date.now()})` replaces `MODEL.deleteOne`; ownership check line (`candidateId.toString() !== userID`) untouched |
| `baseFindDocument`/`baseGetAll` exclude soft-deleted docs by default, no caller changes | `idQuerySafe.safeQuery({deletedAt:null}, fields)` change in `baseFindDocument`; `baseGetAll` (`BaseController.ts`) calls `baseFindDocument` unchanged — confirmed by the 3 updated `baseFindDocument.test.ts` assertions now expecting `deletedAt: null` in the query passed to `findOne`/`find`/`countDocuments` |
| Restore endpoint `POST /:collection/restore/:id`, same ownership check as delete | `baseRestore` in `BaseController.ts` (mirrors `baseDelete` exactly, same `req.body.candidateId` source — forced to `req.user._id` by `verifyToken.middleware.ts`) + 6 router registrations |
| Real test run, output read back | `Tests: 83 passed, 83 total` above (77 pre-existing + 6 new), verbatim `npm test` output |

## Noticed, not done
- **Account-level delete not converted.** `candidate.service.ts::handlerDelete` (`DELETE /api/v1/candidate`) still hard-deletes the Candidate doc, cascades `deleteMany({candidateId})` on all 7 CV-section models, and unlinks the uploaded CV/image files from disk. Issue #121's "Proposal" bullets only specify adding `deletedAt` to the Candidate model (done) and changing `baseDeleteDocument`/`baseFindDocument`/restore for CV sections — they don't describe an account-delete cascade behavior or a restore-account endpoint. Converting account delete to soft-delete would also need a decision on the uploaded-file cleanup (currently unlinked immediately, which itself defeats "recoverable" if converted naively) — left as a follow-up, not invented here per `SmallestDiff`.
- Pre-existing stale comment at `BaseController.ts` (originally lines 96-99, unchanged by this diff) still says "see the still-open fix-idor-broken-access-control trap" — that trap is actually already SEALED (2026-09-08). Not touched here (out of this task's scope), flagging so a future pass doesn't trip over the stale wording.
- `fix-candidate-password-leak`, `fix-refresh-token-expiry-unused`, `fix-v2-register-missing-await`, `fix-create-response-null-id`, `add-candidate-self-delete` (already done per PROJECT.md trap list but node still shows PENDING — likely another bookkeeping gap, not investigated here), `fix-candidate-me-candidateid-not-string`, `fix-chrome-executable-path` remain PENDING on the diagram, untouched — out of scope for issue #121.

## Seal gate
None — no commit/push/publish/delete/external-API call happened in this pass. Diff stays in the working tree, shown in full to the operator above (`git diff` output for `src/services/index.ts`, `BaseController.ts`, all 8 model files, both locale files, and one representative router — the other 5 routers apply the identical pattern).
