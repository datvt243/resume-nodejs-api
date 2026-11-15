# upload-route-tests — plan (implementer, pick_next)

- Date: 2026-11-15
- Task: #402 Add tests for stored-CV upload/download and section image upload
- Branch: `402-add-tests-for` (off `staging`)
- Node: `upload-route-tests` (new row, PENDING, `haven/diagrams/dev-loop.prime-mermaid.md`); slug not in `dev-loop-archive.md` (grep count 0); no other non-SEALED row cites #402.
- Pass 0 (analyst) skipped: label `testing` (neither feature nor bug).

## Hub bytes before: 97380

## Feature doc: agent-hub/doctrine/features/cv-file-upload-import.md (Behavior #2-3), agent-hub/doctrine/features/cv-section-crud.md (Behavior #9)
Both `verified`; the #402 open question in each is answered ("add tests"). Tests only — no behavior change, docs untouched.

## Acceptance criteria
1. `npx jest src/__tests__/candidate/cvFileRoutes.test.ts src/__tests__/candidate_profile/imageUploadRoutes.test.ts` passes, through the real routers (`candidate.route.ts`, `award/certificate/project.route.ts`) over HTTP, covering:
   - upload-cv: valid PDF → 200 `{ originalName, uploadedAt }` + file stored; > 5MB → 400; wrong mime / wrong extension → 400 `FILE_INVALID_TYPE`; no file → 400.
   - cv-file: no upload → 404; after upload → 200 download named with the original name, same bytes.
   - images, each of award/certificate/project: success → 200 `data.images` = existing + new `/uploads/images/<id>-…` URLs; unknown id → 404, nothing written; another candidate's → 403, nothing written; no files → 400; > 5MB → 400; 6 files → 400; wrong type → 400 `FILE_INVALID_TYPE`.
2. `npm test` passes.
3. `npm run build` passes (typecheck).
4. `npm run lint`: 0 problems in the two new files; total ≤ baseline 274.
Self-check (step 5): each criterion maps to a command; not rewritten.

## Code anchors (grep-confirmed)
- `src/routers/api/v1/candidate.route.ts:59,219`, `src/middlewares/uploadCV.middleware.ts`, `src/candidate/candidate.controller.ts` (`fnUploadCV`, `fnDownloadCV`)
- `src/routers/api/v1/{award,certificate}.route.ts:225`, `project.route.ts:266`, `src/candidate_profile/BaseController.ts` (`baseUploadImages`), `src/middlewares/uploadImages.middleware.ts`
- Existing partial coverage kept as-is: `src/__tests__/middlewares/uploadCV.middleware.test.ts`, `src/__tests__/candidate/candidate.controller.test.ts` (cv-file missing on disk), `src/__tests__/candidate_profile/BaseController.test.ts` (soft-deleted → 404)

## blocked_by: none
