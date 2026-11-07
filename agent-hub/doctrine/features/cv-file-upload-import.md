# CV file upload and import (PDF parse, LinkedIn ZIP)

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-file-upload-import-spec.md`
- Source: backfill from code
- Issues: #383, #384, #388, #401, #402
- Anchors: `src/routers/api/v1/candidate.route.ts`, `src/candidate/candidate.controller.ts`, `src/candidate/candidate.service.ts`, `src/middlewares/uploadCV.middleware.ts`, `src/middlewares/uploadCvPdfParse.middleware.ts`, `src/middlewares/uploadLinkedInExport.middleware.ts`, `src/candidate/parseCvPdf.service.ts`, `src/candidate/parseLinkedInExport.service.ts`

## Goal
A signed-in candidate stores their existing CV file, gets it back later,
and can pre-fill education/experience from an existing PDF CV or a
LinkedIn data export, reviewing before saving.

## Behavior
Store / fetch:
1. All routes require a valid access token.
2. `POST /api/v1/candidate/upload-cv`, multipart field `cv`, one file,
   ≤ 5MB, `application/pdf` mime and `.pdf` extension. Too large /
   wrong type / other upload error / no file → 400. Saved as
   `storage/cv/<candidateId>-cv.pdf` (outside `public/`), replacing any
   previous one only once the new upload succeeded — a rejected upload
   leaves the stored CV untouched; `cvFile = { originalName, uploadedAt }`
   stored on the candidate. 200 with `{ originalName, uploadedAt }`.
3. `GET /api/v1/candidate/cv-file` → the caller's file as a download
   named with its original name (fallback `CV.pdf`); no upload yet, or a
   `cvFile` record whose file is missing on disk → 404.

Import (stateless, nothing is saved):
4. `POST /api/v1/candidate/parse-cv-pdf`, multipart field `file`, same
   PDF rules as rule 2 (5MB). Unreadable PDF → 400
   `cvPdfImport.invalidPdf`. 200 with `{ educations, experiences,
   extractedText }`: entries found by vi/en section headings and date
   ranges; education without `school` and experience without `company`
   are dropped.
5. `POST /api/v1/candidate/parse-linkedin-export`, multipart field
   `file`, `.zip` with zip/octet-stream mime, ≤ 20MB. Not a zip → 400
   `linkedinImport.invalidZip`. 200 with `{ educations, experiences }`
   from `Education.csv` / `Positions.csv` (headers case-insensitive);
   `isCurrent = true` when there is no end date.
6. Parsed entries use the create forms' field names (`school`,
   `major`, `company`, `position`, `startDate`, `endDate`, `isCurrent`,
   `description`), but `school`, `major` and `description` are plain
   strings, while the education/experience create schemas need them as
   localized `{ vi, en }` objects (`localizedName`, `description` in
   `config/joi.config.ts`). The client must wrap them before sending to
   `/education/bulk` / `/experience/bulk`, or those items get 400.

## Acceptance criteria
- `npx jest src/__tests__/candidate/parseCvPdf.service.test.ts src/__tests__/candidate/parseLinkedInExport.service.test.ts src/__tests__/middlewares/uploadCvPdfParse.test.ts src/__tests__/candidate/candidate.controller.test.ts` passes.
- Upload a 6MB PDF to `/upload-cv` → HTTP 400.
- `GET /candidate/cv-file` before any upload → HTTP 404.

## Edge cases
- Scanned (image-only) PDF → 200 with empty lists and empty `extractedText` (no OCR).
- Multi-column CV → poor or empty parse; `extractedText` lets the user copy by hand.

## Out of scope
- OCR; saving parsed entries server-side.

## Open questions
- The stored CV lives under `public/uploads/cv/<candidateId>-cv.pdf`, which `express.static` serves without auth to anyone who knows the candidate id (known trap in `PROJECT.md`). Move it out of `public/`? → **Answer (operator 2026-11-07):** Bug — #383
- LinkedIn: an end date that exists but can't be parsed also yields `isCurrent: true`. Intended? → **Answer (operator 2026-11-07):** Bug: blank endDate + isCurrent false — #401
- Upload and download of the stored CV have no automated test. Add one? → **Answer (operator 2026-11-07):** Change: add tests — #402
- A `cvFile` record whose file is missing on disk: `res.download` errors, and the resulting status isn't defined. What should it return? → **Answer (operator 2026-11-07):** Bug: return 404 — tracked in #384 (comment)
- A failed re-upload deletes the previous CV: multer's disk storage writes straight to the final `<candidateId>-cv.pdf` (`createWriteStream` truncates it), and on `LIMIT_FILE_SIZE` multer unlinks that path. The candidate's `cvFile` metadata stays, so `GET /cv-file` then points at a missing file. Write to a temp name and rename on success? → **Answer (operator 2026-11-07):** Bug — #384
- Parsed entries come back with plain-string `school`/`major`/`description` while bulk create needs `{ vi, en }` (rule 6). Should the parser return the localized shape? → **Answer (operator 2026-11-07):** Bug — #388

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/cv-file-upload-import-spec.md` | - |
| 2026-11-08 | Behavior #2: storage path, rejected re-upload keeps the old CV; #3: missing file → 404 | operator answers 2026-11-07 (#384 + its comment) | `cv-upload-temp-rename` |
