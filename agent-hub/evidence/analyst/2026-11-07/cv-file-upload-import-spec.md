# analyst — cv-file-upload-import — 2026-11-07

## Task (verbatim)
document cv-file-upload-import

## Doc
`agent-hub/doctrine/features/cv-file-upload-import.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/index.ts` (`/candidate` behind `verifyToken`), `src/routers/api/v1/candidate.route.ts`
- `src/middlewares/uploadCV.middleware.ts`, `src/middlewares/uploadCvPdfParse.middleware.ts`, `src/middlewares/uploadLinkedInExport.middleware.ts`
- `src/candidate/candidate.controller.ts` (`fnUploadCV`, `fnDownloadCV`, `fnParseLinkedInExport`, `fnParseCvPdf`)
- `src/candidate/candidate.service.ts` (`handlerUploadCV`, `handlerGetCVFile`)
- `src/candidate/parseCvPdf.service.ts`, `src/candidate/parseLinkedInExport.service.ts`
- `src/candidate_profile/education/education.validate.ts`, `src/candidate_profile/experience/experience.validate.ts` (localized shape)

## Re-check vs code
Behavior 1–6 match code. Disk storage `<candidateId>-cv.pdf` in `CV_UPLOAD_DIR`, 5MB, 1 file, pdf mime + ext, all upload errors → 400 (`uploadCV.middleware.ts`); `cvFile = { originalName, uploadedAt }`, 200 with both (`candidate.service.ts:100-104`); download self-only, `originalName || 'CV.pdf'`, none → 404 (`candidate.controller.ts:86-110`); parse-cv-pdf memory storage same rules, `INVALID_PDF` → 400, drop without school/company (`parseCvPdf.service.ts:278-290`); LinkedIn zip/octet-stream + `.zip`, 20MB, `INVALID_ZIP` → 400, `isCurrent: !endDate` on the parsed date (`parseLinkedInExport.service.ts:85-118`); plain-string fields vs `localizedName`/`description` in create schemas. No discrepancy.

## Questions + answers
Operator (2026-11-07): "behavior đúng" (Behavior section confirmed correct).
- The stored CV lives under `public/uploads/cv/<candidateId>-cv.pdf`, which `express.static` serves without auth to anyone who knows the candidate id (known trap in `PROJECT.md`). Move it out of `public/`? → **Answer (operator 2026-11-07):** Bug — #383
- LinkedIn: an end date that exists but can't be parsed also yields `isCurrent: true`. Intended? → **Answer (operator 2026-11-07):** Bug: blank endDate + isCurrent false — #401
- Upload and download of the stored CV have no automated test. Add one? → **Answer (operator 2026-11-07):** Change: add tests — #402
- A `cvFile` record whose file is missing on disk: `res.download` errors, and the resulting status isn't defined. What should it return? → **Answer (operator 2026-11-07):** Bug: return 404 — tracked in #384 (comment)
- A failed re-upload deletes the previous CV: multer's disk storage writes straight to the final `<candidateId>-cv.pdf` (`createWriteStream` truncates it), and on `LIMIT_FILE_SIZE` multer unlinks that path. The candidate's `cvFile` metadata stays, so `GET /cv-file` then points at a missing file. Write to a temp name and rename on success? → **Answer (operator 2026-11-07):** Bug — #384
- Parsed entries come back with plain-string `school`/`major`/`description` while bulk create needs `{ vi, en }` (rule 6). Should the parser return the localized shape? → **Answer (operator 2026-11-07):** Bug — #388

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/cv-file-upload-import-spec.md` set in doc + INDEX row; Issues #383, #384, #388, #401, #402. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
