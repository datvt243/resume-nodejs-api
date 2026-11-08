# CV export (PDF / DOCX / JSON, themes)

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-export-spec.md`
- Source: backfill from code
- Issues: #383, #400
- Anchors: `src/routers/api/v1/index.ts`, `src/candidate_me/index.ts`, `src/services/createPDF.ts`, `src/services/createPDF.ats.ts`, `src/services/createDocx.ts`, `src/services/pdfMetadata.ts`, `src/middlewares/verifyToken.middleware.ts`

## Goal
A signed-in candidate downloads their own CV as a file (PDF or Word) or
as the raw aggregated data, in either language and in a chosen template.

## Behavior
1. `GET /api/v1/download-pdf` requires a valid access token from any
   source `verifyToken` accepts (header, body, `?token=` for direct
   links/new tabs, cookie; see `auth-session-tokens` rule 1). The CV
   exported is always the caller's own.
2. Data = same aggregation as the public profile (`public-profile`
   rule 3) for the caller, ignoring `isPublic` and without `?profile=`
   filtering.
3. `?lang=en` → English; any other value → Vietnamese. Localized fields
   fall back to whichever language has content.
4. `?format=json` → 200 JSON envelope with the aggregated data.
5. `?format=docx` → `.docx` attachment; `?template=modern` → modern
   theme, anything else → classic (`ats` has no DOCX version and falls
   back to classic).
6. Otherwise PDF: `?template=ats` → ATS single-column template with PDF
   Title/Author metadata; `modern` → modern theme; anything else →
   classic. Unknown `format` values are treated as PDF.
7. Attachment filename = slugified `cvFileName` if set, else
   `<fullName>_<headline or CV>_CV`, plus `_VI`/`_EN` unless already
   suffixed; never contains the email.
8. Classic/modern PDF is rendered with Puppeteer
   (`PUPPETEER_EXECUTABLE_PATH` optional) and only streamed, never
   written to disk. The ATS PDF is written to
   `public/pdf/<slugified email>-ats.pdf` (e.g. `a_b_com-ats.pdf`) only
   when `PERSIST_EXPORTED_PDF` is set.
9. The Chromium process is closed even if rendering fails.

## Acceptance criteria
- `npx jest src/__tests__/candidate_me/index.test.ts` passes.
- `npx jest src/__tests__/services/createPDF.test.ts src/__tests__/services/createPDF.ats.test.ts src/__tests__/services/createDocx.test.ts` passes.
- `npx jest src/__tests__/services/atsPdfIntegration.test.ts` passes (needs a local Chrome for puppeteer; without one it fails with "Could not find Chrome" — run with `CI_NO_CHROME=1` to skip, 4 skipped).
- `GET /download-pdf?format=docx` → `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `Content-Disposition: attachment; filename="..._VI.docx"`.
- No token → HTTP 401.

## Edge cases
- `?format=docx&template=ats` → classic DOCX.
- `?template=foo` → classic PDF, no error.

## Out of scope
- Public (unauthenticated) export: see `public-profile`.

## Open questions
- Classic/modern PDF is always saved to `public/pdf/<email>.pdf`, which `express.static` serves without auth, so anyone who can guess an email can fetch that CV (known trap in `PROJECT.md`). Should the disk write be removed? → **Answer (operator 2026-11-07):** Bug — #383
- Unknown `format`/`template` values silently fall back instead of returning 400 (the public PDF route does return 400 for a bad template). Make them consistent? → **Answer (operator 2026-11-07):** Intended
- `?profile=` isn't supported on owner export. Should it be? → **Answer (operator 2026-11-07):** Change: support it — #400
- The route is named `download-pdf` but also serves DOCX and JSON. OK? → **Answer (operator 2026-11-07):** Intended

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/cv-export-spec.md` | - |
| 2026-11-08 | Behavior 8: classic/modern PDF no longer written to `public/pdf/`; uploaded CVs moved to `storage/cv/` (outside `public/`), legacy files moved at boot | operator answer #383 ("Move them at startup") | private-cv-storage |
