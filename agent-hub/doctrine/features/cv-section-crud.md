# CV section CRUD (education, experience, award, certificate, project, reference)

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-section-crud-spec.md`
- Source: backfill from code
- Issues: #381, #402, #403, #404
- Anchors: `src/candidate_profile/BaseController.ts`, `src/candidate_profile/BaseService.ts`, `src/services/index.ts`, `src/routers/api/v1/education.route.ts`, `src/routers/api/v1/experience.route.ts`, `src/routers/api/v1/award.route.ts`, `src/routers/api/v1/certificate.route.ts`, `src/routers/api/v1/project.route.ts`, `src/routers/api/v1/reference.route.ts`, `src/candidate_profile/education/`, `src/candidate_profile/experience/`, `src/candidate_profile/awards/`, `src/candidate_profile/certificates/`, `src/candidate_profile/project/`, `src/candidate_profile/reference_information/`, `src/middlewares/uploadImages.middleware.ts`

## Goal
A signed-in candidate manages the list-style sections of their CV with
one shared contract, so every section behaves the same way.

## Behavior
Shared contract, `/api/v1/<section>` for `education`, `experience`,
`award`, `certificate`, `project`, `reference` (route files are
structurally identical; checked 2026-11-06):
1. All routes require a valid access token. `candidateId` is always the
   caller's (from the token), never the client's.
2. `GET /` → 200, `data: []` of the caller's non-deleted entries + `meta`.
   Optional `?page`, `?limit` (capped at 100), `?sort` (field name,
   optional leading `-`, must match `^-?[a-zA-Z0-9_.]+$`, else ignored).
   Without `limit`: all entries, `meta = { page: 1, limit: total, total,
   totalPages: 1 }`.
3. `POST /create` → body validated by the section's Joi schema
   (`<section>.validate.ts`), invalid → 400 with `details`; success →
   201 with the created document.
4. `PUT /update` → body must contain `_id`; same schema. Unknown or
   soft-deleted `_id` → 404; entry of another candidate → 403; success →
   200 with the updated document.
5. `DELETE /delete/:id` → soft delete (`deletedAt = now`). Unknown or
   already soft-deleted id → 404 (`deletedAt` untouched); other
   candidate's → 403; success → 200, `data: null`.
6. `POST /restore/:id` → `deletedAt = null`. Unknown id → 404; other
   candidate's → 403; entry not deleted → 404 (`restoreFailed`);
   success → 200, `data: null`.
7. Boolean default: when the section's flag is absent/false it is stored
   as `false` — `isCurrent` (education, experience), `isNoExpiration`
   (award, certificate), `isWorking` (project). Reference has none.

Per-section differences:
8. Bulk create — `education` and `experience` only: `POST /bulk` with
   `{ items: [...] }`. Empty/missing → 400; more than 100 → 400. Each
   item validated and created independently. All fail → 400 with
   `details[].field = items.<i>.<field>` (or `items.<i>`). At least one
   created → 201, `data: { results: [{ index, success, ... }], summary:
   { total, succeeded, failed } }`.
9. Image upload — `award`, `certificate`, `project` only:
   `POST /:id/images`, multipart field `images`, max 5 files, 5MB each,
   extension jpg/jpeg/png/webp/gif and `image/*` mime. Ownership is
   checked before any file is written. Unknown or soft-deleted id → 404
   (nothing written); other
   candidate's → 403; no files → 400; too large/too many/wrong type →
   400. Success → 200, `data: { images }` (new URLs
   `/uploads/images/<id>-<ts>-<rand><ext>` appended to existing ones).
   Images are served publicly by `express.static`.
10. Project link — `project` only: when `type` is `company`,
    `experienceId` must be a non-deleted experience of the caller, else
    400 `project.experienceNotFound`; any other `type` stores
    `experienceId: null`.
11. Localized fields are stored as `{ vi, en }`: `description` on
    education, experience, award, certificate, project; plus education
    `school`/`major`. Reference has no localized field.

## Acceptance criteria
- `npx jest src/__tests__/candidate_profile/BaseController.test.ts src/__tests__/candidate_profile/BaseService.test.ts` passes.
- `npx jest src/__tests__/services/baseCreateDocument.test.ts src/__tests__/services/baseFindDocument.test.ts src/__tests__/services/baseSoftDelete.test.ts src/__tests__/services/baseUpdatePatchSoftDelete.test.ts` passes.
- `npx jest src/__tests__/candidate_profile/education.validate.test.ts src/__tests__/candidate_profile/experience.validate.test.ts src/__tests__/candidate_profile/project.validate.test.ts src/__tests__/candidate_profile/project.service.test.ts` passes.
- `PUT /award/update` with another candidate's `_id` → HTTP 403.
- `POST /education/bulk` with 101 items → HTTP 400.

## Edge cases
- `GET /?limit=0` or non-numeric → all entries (no pagination).
- `GET /?sort=$where` → sort ignored.
- Bulk with 3 items, 1 invalid → 201, `summary.failed = 1`.

## Out of scope
- Hard delete of a single entry (only via account delete).
- Removing or reordering individual images.

## Open questions
- Deleting an already-deleted entry succeeds again and moves `deletedAt` forward (lookup doesn't exclude deleted). Should it be 404? → **Answer (operator 2026-11-07):** Bug: 404 — #403
- Image upload accepts a soft-deleted entry (`findById` doesn't filter `deletedAt`). Intended? → **Answer (operator 2026-11-07):** Bug: 404 — #403
- Bulk partial success returns 201 with the message `common.createFailed`. Should the message reflect partial success? → **Answer (operator 2026-11-07):** Bug: partial-success message — #404
- Bulk create runs items sequentially, one DB round-trip each, up to 100. OK? → **Answer (operator 2026-11-07):** Intended
- Image upload has no automated test. Add one? → **Answer (operator 2026-11-07):** Change: add tests — #402
- Uploaded images stay on disk when an entry is soft-deleted, and there is no per-entry image cap (5 per request, unlimited requests). Intended? → **Answer (operator 2026-11-07):** Intended (restore needs them)
- `DELETE /delete/:id` and `POST /restore/:id` fail open on an id containing `$`: `idQuerySafe` drops it, `baseCheckDocumentById` runs `findOne({})` and acts on the collection's first document: 403 if it's someone else's, deleted/restored if it's the caller's (`services/index.ts`). Should a dropped id be 404? → **Answer (operator 2026-11-07):** Bug — #381

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/cv-section-crud-spec.md` | - |
| 2026-11-08 | Behavior 5 + 9: soft-deleted entry → 404 on delete and image upload (restore unchanged) | operator answer #403 | soft-deleted-writes-404 |
