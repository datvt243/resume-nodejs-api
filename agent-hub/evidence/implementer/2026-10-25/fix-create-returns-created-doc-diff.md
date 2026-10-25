# 2026-10-25 - fix-create-returns-created-doc (diff)

- Worker: implementer · Version: 0.1.0
- Node: `fix-create-returns-created-doc` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #319): "POST /{section}/create trả về toàn bộ danh sách (mảng) thay vì document vừa tạo — regression của #157"
- Plan: `evidence/implementer/2026-10-25/fix-create-returns-created-doc-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 81405

## Diff
| File | Why |
|---|---|
| `src/services/index.ts` | `baseCreateDocument`: `MODEL.create({ ...document, _id: new Types.ObjectId() })` instead of `{ _id: null, ...document }` — returned doc has the real id. Stale #157 comment replaced by a WHY JSDoc + 1-line hook note. `document['_id']` is still deleted first, so a client id can't win. |
| `src/candidate_profile/BaseService.ts` | Removed the `hookAfterSave` that refetched the whole candidate list → `data` = created doc. |
| `src/candidate_profile/general_information/generalInformation.service.ts` | Same list-refetch hook removed (returned a 1-item array). |
| `src/models/visit.model.ts` | Comment said baseCreateDocument "passes `_id: null` as a workaround" → now "generates the `_id` itself". |
| `src/__tests__/candidate_profile/BaseService.test.ts` | Rewritten for the new contract: education + award (it.each) create twice → `data` not an array, is the 2nd doc, `_id` is an ObjectId === the persisted doc's, `find` never called; generalInformation create → `data` is the created doc; real `Award` model: Mongoose doc built from what `create()` receives has an ObjectId `_id`. |
`hookAfterSave` param kept in `baseCreateDocument` (own tests in `baseCreateDocument.test.ts`, unchanged, still pass).

## Command
From repo root per `doctrine/MEMORY.md`: `npx jest src/__tests__/candidate_profile/BaseService.test.ts src/__tests__/services/baseCreateDocument.test.ts`; `npm test`; `npm run build` (Typecheck); `npm run lint` (staging baseline 275, measured today in /release v2.2.1 gate); `npx eslint <touched files>`. Regression proof: temporarily restored `_id: null` line via sed, ran BaseService.test.ts, restored.

## Output
Targeted:
```
PASS src/__tests__/services/baseCreateDocument.test.ts (3 tests ✓)
PASS src/__tests__/candidate_profile/BaseService.test.ts
    ✓ education: returns the created document (not a list) with its persisted _id, also on a second create
    ✓ award: returns the created document (not a list) with its persisted _id, also on a second create
    ✓ returns the created document, not a one-item array
    ✓ the Mongoose document create() builds carries a real ObjectId, not null
Tests:       7 passed, 7 total
```
With old `_id: null` restored: `Tests: 3 failed, 1 passed, 4 total` (education ✕, award ✕, real-model ✕) → tests catch the bug.

`npm test`:
```
Test Suites: 2 failed, 50 passed, 52 total
Tests:       5 failed, 468 passed, 473 total
```
Failures = `auth/tokenExpiry.test.ts` (1) + `services/atsPdfIntegration.test.ts` (4) only. Same with diff stashed: `Tests: 5 failed, 2 passed, 7 total` (pre-existing local env: `.env` TOKEN_EXP_IN, no Puppeteer Chrome — same as add-graceful-shutdown/enforce-https notes). 473 = 470 + 3 net new tests.

`npm run build`: `BUILD_RC=0`.
`npm run lint`: `✖ 274 problems (274 errors, 0 warnings)` vs baseline 275 → 0 new (old BaseService.test.ts had 1, new has 0: `npx eslint src/__tests__/candidate_profile/BaseService.test.ts` → 0 errors). A first lint run showed 278 (4 in the new test: require-await / unnecessary assertion) → fixed in the test, rerun 274. `services/index.ts` 2 errors at lines 238/265 are pre-existing (same 3 total with diff stashed for test+services).

## Acceptance
| # | Criterion | Evidence |
|---|---|---|
| 1 | `baseCreateDocument` generates `_id`, `create()` return has real id | diff `services/index.ts`; `✓ the Mongoose document create() builds carries a real ObjectId, not null`; fails with old line |
| 2 | section + generalInformation `handlerCreate` return single created doc; hooks removed | diffs BaseService.ts / generalInformation.service.ts; `✓ education…`, `✓ award…`, `✓ returns the created document, not a one-item array` |
| 3 | tests: object not array, `_id` matches persisted, ≥2 sections, second create | it.each education+award, 2 creates, `_id` toBe `model.docs[1]._id`, `Array.isArray` false |
| 4 | test/build no new failures, lint 0 new | 5 failures = pre-existing 5; `BUILD_RC=0`; lint 274 ≤ 275 |
| 5 | comments per code-comments.md | Added: JSDoc in services/index.ts (WHY generate id: models redeclare `_id`), `//` hook-replacement note, test-file JSDoc + `//` WHY cast / stand-in. Removed `(issue #157)`/`#181`/`#177` refs from the rewritten test file. visit.model.ts comment corrected, no new refs. |

## Supersedes: none
Grepped active diagram for `#319` — only this node.

## Noticed, not done
- `bulk` create (`BaseController.fnBulkCreate`) spreads `...result` per item → each result's `data` is now the created doc instead of the list (improvement, no code change needed).
- Swagger example for create not re-checked beyond the issue's "Award created" note.

## Seal gate: none
No commit/push yet.
