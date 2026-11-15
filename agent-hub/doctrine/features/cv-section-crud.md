# CV section CRUD (education, experience, award, certificate, project, reference)

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-section-crud-spec.md`
- Source: backfill from code
- Issues: #381, #402, #403, #404, #413 (verified by `evidence/verifier/2026-11-14/education-project-manual-order-seal.md`, see "Manual display order")
- Anchors: `src/candidate_profile/BaseController.ts`, `src/candidate_profile/BaseService.ts`, `src/services/index.ts`, `src/routers/api/v1/education.route.ts`, `src/routers/api/v1/experience.route.ts`, `src/routers/api/v1/award.route.ts`, `src/routers/api/v1/certificate.route.ts`, `src/routers/api/v1/project.route.ts`, `src/routers/api/v1/reference.route.ts`, `src/candidate_profile/education/`, `src/candidate_profile/experience/`, `src/candidate_profile/awards/`, `src/candidate_profile/certificates/`, `src/candidate_profile/project/`, `src/candidate_profile/reference_information/`, `src/middlewares/uploadImages.middleware.ts`, `src/models/education.model.ts`, `src/models/project.model.ts`, `src/candidate_me/index.ts`

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
   { total, succeeded, failed } }`; message `common.createSuccess` when
   all succeeded, else `common.bulkPartialSuccess` ("Created X of Y
   items" / "Đã thêm X/Y mục").
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
12. Short values (operator, #414) — education `major.vi` needs only 1
    char ("IT" is valid; empty → 400 on `major.vi`). Award `link` is
    optional (missing or `''` allowed, ≤ 100 chars) and must be a URL
    when present, else 400 on `link`. Implementation choice, not part of
    the operator's answer: only `http`/`https` schemes count as a URL, so
    `javascript:` links are refused.

### Manual display order: education and project (#413, verified by `evidence/verifier/2026-11-14/education-project-manual-order-seal.md`)
Operator decision 2026-11-07 (issue #413). The frontend drag-and-drop
order lives only in the browser today; this makes it stored data.
13. `education` and `project` entries get an optional integer `order`.
    Entries created before this change, or created later (create, bulk,
    CV import), have no `order` until a reorder call sets one.
14. `PUT /api/v1/education/reorder` and `PUT /api/v1/project/reorder`,
    body `{ ids: [...] }`, valid access token required. Each id must be
    a non-deleted entry of the caller in that section; an unknown,
    another candidate's, or soft-deleted id → 400 with
    `details[].field = ids.<index>` and nothing written (same rule as
    `cv-profiles` #405). `ids` must be the full list of the caller's
    non-deleted entries in that section: any such entry missing from
    `ids` → 400 on `ids`, nothing written (operator, Q1). On success the
    entry at position `i` of `ids` gets `order = i`.
15. Ordering rule, wherever these two sections are listed for a CV:
    entries with an `order` first, ascending; then entries without one,
    by `startDate` descending. Applies to the public profile
    (`public-profile` rule 3), the public PDF (rule 7), owner export in
    every format (`cv-export` rule 2), and the ATS check, all of which
    read the same aggregation (`src/candidate_me/index.ts`). With
    `?profile=`, the filtered subset keeps this same relative order
    (one order per section, not per profile). The owner list
    `GET /api/v1/education` and `GET /api/v1/project` without `?sort`
    also uses this order (operator, Q2); an explicit `?sort` still wins
    (rule 2).
15a. Create, update and bulk create accept an `order` key in the body
    and ignore it: not stored, no 400 (operator, Q3). Only the reorder
    route sets `order`.
16. Experience gets no `order`, no reorder route, and its sorting stays
    exactly as today everywhere (operator, Q4): start date descending
    only in the ATS PDF, insertion order elsewhere.

Analyst choices, reviewed and kept by the operator 2026-11-14: a
duplicate id in `ids` → 400; an empty or non-array `ids` → 400; two
entries with the same `order` (e.g. after a restore) fall back to
`startDate` descending between them; reorder success → 200 with
`data: null`, like delete/restore.

## Acceptance criteria
- `npx jest src/__tests__/candidate_profile/BaseController.test.ts src/__tests__/candidate_profile/BaseService.test.ts` passes.
- `npx jest src/__tests__/services/baseCreateDocument.test.ts src/__tests__/services/baseFindDocument.test.ts src/__tests__/services/baseSoftDelete.test.ts src/__tests__/services/baseUpdatePatchSoftDelete.test.ts` passes.
- `npx jest src/__tests__/candidate_profile/education.validate.test.ts src/__tests__/candidate_profile/experience.validate.test.ts src/__tests__/candidate_profile/project.validate.test.ts src/__tests__/candidate_profile/project.service.test.ts` passes.
- `PUT /award/update` with another candidate's `_id` → HTTP 403.
- `POST /education/bulk` with 101 items → HTTP 400.
- `npx jest src/__tests__/candidate_profile/award.validate.test.ts` passes.
- #413: `npm test` passes, including new tests under `src/__tests__/` that cover rules 14 and 15 (reorder writes `order`, foreign/deleted id → 400 with no write, sort rule incl. entries without `order`).
- #413: create education A then B, `PUT /api/v1/education/reorder` `{ ids: [B, A] }` → HTTP 200; then `GET /api/me/<slug>` returns `educations` in the order B, A (same for `projects`).
- #413: `PUT /api/v1/project/reorder` with another candidate's project id → HTTP 400, `details[0].field = "ids.0"`, and that candidate's `order` unchanged.
- #413: `GET /api/v1/download-pdf?format=json` returns `educations`/`projects` in the same order as the public profile.
- #413: no route `PUT /api/v1/experience/reorder` (HTTP 404).
- #413: with education A, B, C, `PUT /api/v1/education/reorder` `{ ids: [B, A] }` → HTTP 400, no `order` written.
- #413: after reorder `{ ids: [B, A] }`, `GET /api/v1/education` (no `?sort`) returns B, A.
- #413: `PUT /api/v1/education/update` with `order: 5` in the body → HTTP 200, stored `order` unchanged.
- #413: `npx jest src/__tests__/services/createPDF.ats.test.ts src/__tests__/candidate_me/index.test.ts` passes unchanged (experience ordering untouched).

## Edge cases
- `GET /?limit=0` or non-numeric → all entries (no pagination).
- `GET /?sort=$where` → sort ignored.
- Bulk with 3 items, 1 invalid → 201, `summary.failed = 1`.
- #413: two projects reordered, a third created afterwards → the two ordered ones first (by `order`), the new one last; the next reorder must list all three.
- #413: an ordered entry is soft-deleted → it disappears from every CV view; restored → it comes back with its old `order`.
- #413: `?profile=` lists only education A and C of A, B, C ordered C, B, A → output C, A.

## Out of scope
- Hard delete of a single entry (only via account delete).
- Removing or reordering individual images.
- #413: ordering award, certificate, reference or experience entries; a different order per CV profile; reordering the sections themselves (`cv-profiles` out of scope).

## Open questions
- Deleting an already-deleted entry succeeds again and moves `deletedAt` forward (lookup doesn't exclude deleted). Should it be 404? → **Answer (operator 2026-11-07):** Bug: 404 — #403
- Image upload accepts a soft-deleted entry (`findById` doesn't filter `deletedAt`). Intended? → **Answer (operator 2026-11-07):** Bug: 404 — #403
- Bulk partial success returns 201 with the message `common.createFailed`. Should the message reflect partial success? → **Answer (operator 2026-11-07):** Bug: partial-success message — #404
- Bulk create runs items sequentially, one DB round-trip each, up to 100. OK? → **Answer (operator 2026-11-07):** Intended
- Image upload has no automated test. Add one? → **Answer (operator 2026-11-07):** Change: add tests — #402
- Uploaded images stay on disk when an entry is soft-deleted, and there is no per-entry image cap (5 per request, unlimited requests). Intended? → **Answer (operator 2026-11-07):** Intended (restore needs them)
- `DELETE /delete/:id` and `POST /restore/:id` fail open on an id containing `$`: `idQuerySafe` drops it, `baseCheckDocumentById` runs `findOne({})` and acts on the collection's first document: 403 if it's someone else's, deleted/restored if it's the caller's (`services/index.ts`). Should a dropped id be 404? → **Answer (operator 2026-11-07):** Bug — #381
- #413 Q1: Must `ids` list every non-deleted entry of the caller in that section (anything missing → 400), or may it be a subset? → **Answer (operator 2026-11-14):** full list required; anything missing → 400
- #413 Q2: Should the owner list `GET /api/v1/education` and `GET /api/v1/project` (no `?sort`) also return entries in the rule-15 order? Today it returns database insertion order, and it is the list the frontend drag-and-drop screen reads. → **Answer (operator 2026-11-14):** yes, same order (rule 15)
- #413 Q3: Today a create/update body with any unknown key, so also `order`, gets 400 (Joi default). Once `GET` returns `order`, a frontend that sends the whole entry back on update would get 400. Should create/update reject `order` (as today), accept and ignore it, or accept and store it? → **Answer (operator 2026-11-14):** accept and ignore (not stored, no 400)
- #413 Q4: "Experience always sorts by date" is true only in the ATS PDF today (`src/services/createPDF.ats.ts`, start date descending). The public profile JSON, classic/modern PDF and DOCX list experience in database insertion order. Should #413 also sort experience by `startDate` descending everywhere, or leave experience exactly as it is? → **Answer (operator 2026-11-14):** leave experience exactly as it is

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/cv-section-crud-spec.md` | - |
| 2026-11-08 | Behavior 5 + 9: soft-deleted entry → 404 on delete and image upload (restore unchanged) | operator answer #403 | soft-deleted-writes-404 |
| 2026-11-08 | Behavior 8: partial-success message "Created X of Y items" (vi + en) instead of `common.createFailed` | operator answer #404 | bulk-partial-message |
| 2026-11-08 | Behavior 12: education `major.vi` min 1; award `link` optional, a URL (http/https) when present | operator answer #414 | short-values-validation |
| 2026-11-14 | Added draft rules 13–16 (manual display order for education + project) + 4 open questions | issue #413, operator decision 2026-11-07; the `cv-timeline-sections.md` doc named in the issue never existed on disk, so it lands here | - |
| 2026-11-14 | #413 Q1–Q4 answered: full `ids` list, owner list uses the order, `order` ignored on create/update, experience unchanged | operator answers 2026-11-14 | - |
