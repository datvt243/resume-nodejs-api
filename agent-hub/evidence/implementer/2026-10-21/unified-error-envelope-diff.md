# 2026-10-21 - unified-error-envelope (diff)

- Worker: implementer · Version: 0.1.0
- Node: `unified-error-envelope` (PENDING) · Issue #278 · Branch `278-feat-api-phase`
- Status: `sealed_pending_verifier`
- Plan: `evidence/implementer/2026-10-21/unified-error-envelope-plan.md` (includes a disclosed NodeBeforeCode ordering slip)
- `git diff --stat`: 58 files changed, 595 insertions(+), 416 deletions(-), plus untracked `src/__tests__/contract/errorEnvelope.test.ts`

## Diff summary
**One error writer.** `utils/helper.ts` `sendError(res, err, lang, url?)` maps via `toAppError` then logs and writes `{ success:false, error:{ code, message, details?, stack? } }` (stack dev-only; non-operational text hidden outside dev). Used by:
- `errorsMiddleware`, which is now just a call to it. `notFoundHandler` uses `ROUTE_NOT_FOUND` with an i18n message.
- `formatReturn`'s failure branch: the code comes from the new optional `errorCode` prop, else VALIDATION_ERROR (400 + details), else a status→code table (400 BAD_REQUEST, 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT).
- The rate limiter: 429 `RATE_LIMITED`.

`formatReturn` success and `formatResponse` now write `{ success:true, message, data }` (no `errors`). `response.ts` `ok(res, data, message, meta?)` / `created()` drop `errors`. `ListMeta` type added.

**Error codes.** `errors/AppError.ts` adds ROUTE_NOT_FOUND 404, FILE_INVALID_TYPE 400 and RATE_LIMITED 429 to the map. `AppErrorDetails` = `ErrorDetail[]` (`{ field, message }`, exported); the internal property is still named `errors`, but it is written out as `error.details`.

**`details` shape.**
- `utils/valid.ts` formatValidateError returns `{ field: path.join('.'), message }[]`, so nested errors no longer collide. `validateModel` was removed (its only caller, candidate.service handlerUpdate, now `await MODEL.validate()`).
- `services/index.ts` removes `modelValidate`: create/update/patch `await MODEL.validate()`, so a Mongoose ValidationError propagates and becomes translated details.
- toAppError: Mongoose details become `{ field, message }`. The CastError raw text is dropped from the response (log only).

**Lists.**
- `baseFindDocument` (findOne:false) always returns `data: []` + `meta` through `listMeta(total, page?, limit?)`; unpaginated = one page.
- `baseGetAll` passes `meta`.
- search → `data: items` + `meta`.
- `GET /candidate/visits` → `data: visits` + `meta` (was `{ count, visits }`).

**Bulk all-fail.** Throws ValidationError with one detail per item (`items.<i>.<field>`, or `items.<i>` for a non-field failure). The old body with `data.results` is gone; partial success is unchanged (201, `data.results`/`summary`).

**PDF/DOCX failures.** createCV/createCVAts/createCVDocx no longer catch and write `{ status:false }`. The error propagates to fnExportPDF's handleError, giving a 500 envelope (createCV keeps `finally` browser close).

**i18n.** New keys:
- `auth.noToken`, `auth.tokenRevoked`, `auth.invalidTokenPayload`, `auth.csrfInvalid`;
- `errors.routeNotFound`, `errors.rateLimited`;
- `publicProfile.{identifierRequired, notFound, getSuccess, visitRecorded, atsTemplateOnly}`.

They are used in verifyToken, csrf.middleware, notFoundHandler, the rate limiter and `candidate_me/{index,public-pdf,ats-check}`. `profileNotFound(lang)` replaces the `PROFILE_NOT_FOUND` const, so unknown and private profiles still get the identical error.

**Explicit codes.** auth refresh no token → NO_TOKEN; invalid refresh payload → INVALID_TOKEN; logout-all with no token → NO_TOKEN. Upload type errors (CV, LinkedIn ZIP, PDF parse, images) → FILE_INVALID_TYPE.

**verifyToken.** A non-JWT failure (e.g. a blacklist store error) is now forwarded as-is (500, text hidden) instead of a 401 InvalidTokenError carrying `err.message`.

**Swagger and docs.**
- `config/swagger.config.ts`: `ApiResponse` = success envelope with `meta`. New `ErrorResponse` with `code` enum = `Object.values(ErrorCode)` and `details[]`. `Pagination` is described as list `meta`. LimitParam text updated.
- Route JSDoc: 50 error blocks gained `ErrorResponse` content. List descriptions were updated. Search and visits schemas are now array + meta. Public route codes fixed (GET `/api/me/{email}` and visit 400 → 404; download-pdf split into 400 template / 404 unknown-or-private). The spec loads with 72 paths (staging: 72).
- `API-STANDARD.md`: "Current deviations" table emptied, in this repo only.
- `CLAUDE.md`: error/success envelope paragraph, search row, contract test row.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) every error path → envelope, details full dotted path | New `contract/errorEnvelope.test.ts` (12 tests): formatReturn failure for 400 / 400+details / 401 NO_TOKEN / 400 FILE_INVALID_TYPE / 403 / 404 / 409 asserts exact keys `error, success` and `error` ⊂ `code, message, details`; thrown AppError + unexpected Error through `sendError` (500, driver text absent); 429 → RATE_LIMITED; "nested Joi validation → VALIDATION_ERROR with the full dotted field path" (`items.1.company`, `items.2.company`, `items.3.company`). `middlewares/errors.test.ts` (real HTTP): malformed JSON / 413 / CastError / Mongoose details `[{ field:'birthday', ... }]` / duplicate key / prod 500 exact body `{ success:false, error:{ code:'INTERNAL_SERVER_ERROR', message:'Lỗi hệ thống' } }` / dev shows message + stack. `asyncErrors.test.ts` notFoundHandler for GET/POST/PUT/DELETE: keys exactly `error, success`, `error` keys `code, message`, code ROUTE_NOT_FOUND. `BaseController.test.ts` "fnBulkCreate answers every-item-failed with one 400 envelope whose details point at each item". `utils/valid.test.ts` "a nested error carries its full dotted path". PDF/DOCX: `createPDF.test.ts` "closes the browser and rethrows when rendering fails after launch, writing no response" + "rethrows the launch error"; `createPDF.ats.test.ts` "createCVAts rethrows a render failure to the caller instead of writing its own 500" (callers are inside fnExportPDF's try → handleError → errorsMiddleware, covered by errors.test prod-500 row). Private == unknown still identical: `candidate_me/index.test.ts` + `public-pdf.test.ts` (through errorsMiddleware) |
| (2) lists: data array + meta, with and without limit | `BaseController.test.ts` "without limit / with limit, answers data as an array plus meta" (exact body `{ success, message, data:[...], meta }`); `services/baseFindDocument.test.ts` no-limit `meta {1,2,2,1}` and limit `meta {2,2,2,1}` with `data` = the array; `search.test.ts` exact body `{ success:true, message:'', data:[], meta:{...} }`; contract "ok() with meta" |
| (3) i18n of remaining hardcoded messages | verifyToken.test.ts sets `lang:'en'` and asserts `'Access denied. No token provided.'` / `'Token has been revoked.'` / `'Invalid token'` from `t()`; notFound/429 messages from `errors.routeNotFound`/`errors.rateLimited` (contract + asyncErrors); public profile message from `publicProfile.notFound` (public-pdf mock uses the real `t`) |
| (4) swagger + deviations table | spec loads: schemas `ApiResponse`, `ErrorResponse`, `Pagination`; 72 paths (same as staging); `API-STANDARD.md` deviations → "None" |
| existing tests updated, not deleted | staging 438 → 454 tests (+16: 12 contract, 1 nested Joi in valid.test, 1 verifyToken non-JWT, 2 list meta in BaseController.test); the 3 PDF/DOCX failure tests were rewritten in place (expect rethrow), none removed |
| `npm test` | verbatim below |
| `npm run build` | verbatim below, exit 0, `grep -c "error TS"` = 0 |
| lint ≤ baseline | `eslint . -f json` per file vs `git stash` of staging @ 7cc0840: before 276, after 275, no file above its baseline count (4 problems the first pass introduced were fixed: an enum comparison in helper.ts, an `await` of a non-thenable and 2 unneeded assertions in tests) |
| comments per code-comments.md | Added `//` one-sentence WHY: AppError `ErrorDetail`; helper `STATUS_TO_CODE`, `formatReturn.errorCode`, CastError (raw text log-only); valid.ts formatValidateError (full path so nested don't collide); services + candidate.service "A Mongoose ValidationError propagates…" (×4); BaseController bulk all-fail + partial; candidate_me `profileNotFound`; verifyToken non-JWT forward; swagger `Pagination`; createPDF test + contract test one-liners. `/** */`: `sendError` (multi-sentence), `listMeta`, response.ts header (merged into existing block), baseFindDocument pagination block rewritten (no longer says "{ items, pagination }"). Removed: stale createPDF "An Error serializes to {}" comments, bulk "formatResponse nulls data" block. No `(#N)` refs, no stacked `//` |

## Test output (verbatim, `npm test` from repo root)
```
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 49 passed, 49 total
Tests:       454 passed, 454 total
Snapshots:   0 total
Time:        10.784 s
Ran all test suites.
```
The exit warning is pre-existing on staging (see `services-throw-apperror-diff.md`).

## Build output (verbatim, `npm run build`)
```
> resume-nodejs-api@1.14.0 build
> tsc && npm run copy


> resume-nodejs-api@1.14.0 copy
> cp -R ./src/views ./src/public ./dist/
```

## Release note (BREAKING; clients: resume-vuejs-website#252, datvt243.github.io#244)
- Every error body is now `{ success:false, error:{ code, message, details? } }`. Gone: top-level `errorCode`, `message`, `errors`, `data:null`, and PDF/DOCX `{ status:false }`.
- `details` is `[{ field, message }]` with full dotted paths. It was a `{ field: msg }` map (Joi), a field-name array (base services), a message array (Mongoose) or a string (CastError, now dropped).
- Success bodies no longer carry `errors`.
- Lists:
  - every CV-section `GET /` returns `data: []` + `meta`. With `?limit=`, `data` was `{ items, pagination }`; it is now the array, and `pagination` becomes `meta`;
  - `GET /api/me/search` returns `data: []` + `meta` (was `{ items, pagination }`);
  - `GET /candidate/visits` returns `data: []` + `meta.total` (was `{ count, visits }`).
- `/bulk` where every item fails: 400 envelope with `details` per item (`items.3.company`); `data.results` is no longer returned on that path.
- Unknown route: code `ROUTE_NOT_FOUND` (was `NOT_FOUND`). 429: code `RATE_LIMITED`. Upload type errors: `FILE_INVALID_TYPE`. Refresh/logout-all without a token: `NO_TOKEN`; bad refresh payload: `INVALID_TOKEN`.
- Status changes:
  - a non-JWT failure inside `verifyToken`, e.g. a token-store error: 401 → 500;
  - `/api/me/*` missing identifier and template errors stay 400.
- English messages changed for a public profile not found ("Profile not found"); Vietnamese is unchanged.
- Do not `/release` until both clients ship their dual-shape readers (issue #278 acceptance).

## Noticed, not done
- The `API-STANDARD.md` copy changed only in this repo. The wiki page and the copies in resume-vuejs-website and datvt243.github.io must get the same "Current deviations: None" edit. Those are outward-facing pushes to other repos/wiki, so they're left for the operator.
- `AppError` subclass default messages ('Authentication failed', 'Validation failed', …) are still English literals. Every request path in the touched code passes an i18n message, but a bare `new AuthenticationError()` (e.g. `candidate.controller.ts` when `req.user` is missing, unreachable behind verifyToken) would show the English default.
- `UNAUTHORIZED` stays a code (derived for un-coded 401s) even though API-STANDARD.md §3 doesn't list it. No un-coded 401 `formatReturn` site remains after this diff except login's (unreachable after the INVALID_CREDENTIALS early return).
- Upload "file too large" still answers 400 BAD_REQUEST, not the standard's 413 PAYLOAD_TOO_LARGE. That would be a status change; it's a separate decision.
- `candidate.service.ts` own-candidate-missing returns still `{ success:false }`, now written as a 400 envelope.
