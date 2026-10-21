# 2026-10-21 - services-throw-apperror (diff)

- Worker: implementer · Version: 0.1.0
- Node: `services-throw-apperror` (PENDING, appended) · Issue #277 · Branch `277-refactor-api-phase`
- Status: `sealed_pending_verifier`
- Plan: `evidence/implementer/2026-10-21/services-throw-apperror-plan.md`

## Diff summary (src, 26 production/test files + 2 new; `git diff --stat`: 29 files changed, 320 insertions(+), 345 deletions(-), plus 3 untracked)
- `src/errors/AppError.ts`: `ERROR_STATUS: Record<ErrorCode, number>` (compiler forces an entry per code); AppError takes one options object and sets `statusCode = ERROR_STATUS[errorCode]`; `statusCode` option + positional overload removed; every subclass drops its hand-passed status; `ErrorCode.SERVICE_UNAVAILABLE` added; `IErrorOptionsWithStatus` → `IAppErrorOptions` (re-exported in `errors/index.ts` with `ERROR_STATUS`).
- Hand-passed statuses removed: `auth/auth.controller.ts` (EMAIL_EXISTS), `utils/helper.ts` toAppError (MALFORMED_JSON, PAYLOAD_TOO_LARGE, 500), `middlewares/errors.middleware.ts` notFoundHandler.
- `src/utils/timeout.ts`: withTimeout rejects with `AppError(SERVICE_UNAVAILABLE)` (503) instead of a plain Error (500); new i18n key `errors.serviceUnavailable` (vi/en).
- `src/services/index.ts`: delete/restore/update/patch throw `NotFoundError` (missing id) / `AuthorizationError` 403 (another candidate's id) / `ValidationError` (model validation); create throws `BadRequestError` (no candidateId) / `ValidationError`; delete/restore `modifiedCount === 0` → `NotFoundError` (no more success text on a failure); swallowing catch blocks removed, driver errors propagate to errorsMiddleware (500, text hidden in prod); `hookHasErrors` still called, then rethrow; unused `handlerCatchError` + `logger` import removed.
- `src/candidate_profile/BaseService.ts`: the 4 try/catch blocks that turned any error (incl. timeout) into `{ success:false }` removed.
- `application.service.ts`: unowned/deleted profileId → throws `BadRequestError` (400, unchanged status); `ProfileLinkCheck` union removed.
- `generalInformation.service.ts`: second create → throws `ConflictError` (**409**, was 400); swallowing catch removed.
- `src/utils/response.ts` (new): `ok()`/`created()`, body keys `success, message, errors: null, data` (today's success keys); re-exported from `utils/index.ts`.
- Controllers: `BaseController.ts` getAll/delete/restore/create/update → `ok`/`created`; service type → `Promise<BaseReturn>`; `fnBulkCreate` catches per item (one throw doesn't abort the rest; non-operational text replaced by `common.createFailed` and logged). `generalInformation.controller.ts` get/create/update → `ok`/`created` (stale narrowing comment removed). `candidate.controller.ts` fnGetInformationById/Email → `next(NotFoundError)` / `ok`.
- `candidate_me`: `handlerGetAboutMe` and `handlerRecordVisit` throw `NotFoundError(PROFILE_NOT_FOUND)`; `fnGetAboutMe` and `public-pdf.ts` private profile → `next(NotFoundError(PROFILE_NOT_FOUND))`, i.e. the same message through the same writer → identical body; `fnExportPDF` + `ats-check.ts` "Candidate not found" → 404, their dead `if (!success)` branches removed.
- `CLAUDE.md`: `utils/response.ts` row + one paragraph on ERROR_STATUS / throw-not-return.

## Decision (issue asks to decide + document)
Another candidate's id → **403 FORBIDDEN**, not hidden as 404: API-STANDARD.md §2/§3 says FORBIDDEN = "resource belongs to another candidate", and `baseUploadImages` already answered 403. Recorded in code (AuthorizationError) and here.

## Acceptance
| Criterion | Evidence |
|---|---|
| single code→status map, no caller passes a status | `grep -rn "statusCode:" src --include='*.ts'` outside tests/AppError → only `formatReturn` call sites (response writers, not AppError); `utils/timeout.test.ts` "ERROR_STATUS is the only source of an AppError status" iterates every ErrorCode |
| update/delete/restore missing id → 404 | `baseSoftDelete.test.ts` delete + restore "fails when the document does not exist" → `{statusCode:404, errorCode:'NOT_FOUND'}`; `baseUpdatePatchSoftDelete.test.ts` soft-deleted (update+patch) and "answers 404 for an id that does not exist" |
| another candidate's id → 403 | `baseSoftDelete.test.ts` delete + restore not-owner → `{403,'FORBIDDEN'}`; `baseUpdatePatchSoftDelete.test.ts` "answers 403 without touching another candidate's document" |
| modifiedCount 0 never says success | `baseSoftDelete.test.ts` two new "answers 404, never a ... successfully message" tests |
| DB timeout → 503 | `utils/timeout.test.ts` "rejects with a 503 SERVICE_UNAVAILABLE AppError" + "propagates a DB timeout out of the CRUD factory instead of answering success:false" |
| public profile unknown/private → 404, identical body | `candidate_me/index.test.ts` "GET /api/me/:email answers a private profile with the same 404 body as an unknown one" (through real errorsMiddleware); `public-pdf.test.ts` "answers a private profile exactly like an unknown identifier" now asserts 404 + `NOT_FOUND`; handler-level rejects in `index.test.ts` (QuerySafe-rejected identifier/email, unknown email) |
| candidate not found → 404 | `candidate.controller.test.ts` "GET /:id / GET /:email answers 404, not 400" |
| create failure never 2xx, bulk keeps results | `BaseController.test.ts` "fnCreate never answers 2xx for a failed create", bulk all-fail still 400 with `data.results`/`summary`, new "fnBulkCreate keeps going after an item throws, and hides an unexpected error's text" |
| controller 400 for unowned profile kept | `application.service.test.ts` "answers 400 rather than the 201" now through errorsMiddleware |
| existing tests updated, not deleted | 8 test files modified, 0 tests removed: 426 → 436 tests (+10 new) |
| `npm test` (MEMORY.md) | verbatim below |
| `npm run build` (MEMORY.md) | verbatim below, exit 0, `grep -c "error TS"` = 0 |
| lint ≤ baseline | `eslint . -f json` per-file vs `git stash` of staging: before 276, after 276, no file increased |
| comments per code-comments.md | added: `AppError.ts` `//` one-sentence WHY (the one place a status is decided); `timeout.ts` `// shortcut:` limit + upgrade (DEFAULT_LANG message); `services/index.ts` soft-delete `/** */` rewritten (WHY: driver error propagates, text hidden in prod) and restore `//` WHY (nothing modified = nothing to restore); `BaseController.ts` bulk `//` WHY; `candidate_me/index.ts` `//` WHY on PROFILE_NOT_FOUND (private indistinguishable) and visit 404 one-liner replacing a now-false 5-line block; `response.ts` file JSDoc merged into the header block. No `(#N)` refs, no stacked `//`. Removed: stale narrowing comment in generalInformation.controller.ts |

## Test output (verbatim, `npm test` from repo root)
```
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 48 passed, 48 total
Tests:       436 passed, 436 total
Snapshots:   0 total
Time:        12.965 s
Ran all test suites.
```
The "failed to exit gracefully" warning is pre-existing: same `npm test` on stashed `staging` printed it too (`Tests: 426 passed, 426 total`).

## Build output (verbatim, `npm run build`)
```
> resume-nodejs-api@1.14.0 build
> tsc && npm run copy


> resume-nodejs-api@1.14.0 copy
> cp -R ./src/views ./src/public ./dist/
```

## Release note (status changes for clients: resume-vuejs-website#252, datvt243.github.io#244)
- CV-section `PUT /update`, `DELETE /delete/:id`, `POST /restore/:id`: unknown or soft-deleted id **400 → 404 `NOT_FOUND`**; another candidate's id **400 → 403 `FORBIDDEN`**; restore of a non-deleted entry **400 with a "restored successfully" message → 404**.
- Any DB/Redis timeout behind `withDBTimeout`/`withRedisTimeout`: **400/500 → 503 `SERVICE_UNAVAILABLE`**.
- Model-validation failure in the base services: still 400, now `errorCode: VALIDATION_ERROR` with message `validation.hasErrors` (was empty).
- `POST /generalInformation/create` when one already exists: **400 → 409 `CONFLICT`**.
- `GET /api/me/:email`, `GET /api/me/:identifier/download-pdf`, `POST /api/me/:email/visit`: unknown or private profile **400 → 404 `NOT_FOUND`** (private still identical to unknown).
- `GET /api/v1/download-pdf`, `POST /api/v1/cv/ats-check`: candidate not found **400 → 404**.
- `GET /candidate/:email` (and by id): not found **400 → 404**.
- Error bodies on these rows now come from errorsMiddleware (`success, errorCode, message, errors`), so they carry `errorCode` and no longer carry `data: null`. Success bodies keep their keys; `errors` is now `null` on every success (was `{}` on some).

## Noticed, not done
- `candidate.service.ts` handlerUpdate/handlerUploadCV/handlerDelete still return `{ success:false, idNotFound }` (→ 400) for a missing own candidate (`_id` comes from the token, so only reachable after account deletion). Not in the audit rows this issue lists; phase 5 or its own node.
- Remaining controller `formatReturn` failure sites (validation, uploads, `!id` guards in BaseController) still write errors directly. They already use correct statuses; moving them to thrown errors belongs with phase 5's envelope change.
- `baseFindDocument` still returns `formatReturnFailed` when called without fields (unreachable from current callers).
- `notFoundHandler` still uses `NOT_FOUND`, not the standard's `ROUTE_NOT_FOUND` ("existing code names stay").
- `withTimeout` never clears its timer when the wrapped promise wins (pre-existing; may be related to the pre-existing jest exit warning).
- API-STANDARD.md "Current deviations" row for phase 4 not edited: the file is mirrored across 3 repos + wiki and has to change in all of them in the same round.
