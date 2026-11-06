# analyst — cv-export — 2026-11-07

## Task (verbatim)
document cv-export

## Doc
`agent-hub/doctrine/features/cv-export.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/index.ts` (`/download-pdf` behind `verifyTokenByQuery`)
- `src/middlewares/verifyToken.middleware.ts` (`verifyTokenByQuery` = `verifyToken`)
- `src/candidate_me/index.ts` (`fnExportPDF`, `handlerGetAboutMe`)
- `src/services/createPDF.ts` (`createCV`, `PDF_OUTPUT_DIR`)
- `src/services/createPDF.ats.ts` (`createCVAts`, `cvFilename`, `renderAtsPdfBuffer`)
- `src/services/createDocx.ts` (`createCVDocx`)
- `src/services/pdfMetadata.ts`

## Re-check vs code
Behavior 1–9 match code. Own id from token, never client (`candidate_me/index.ts:322-327`); `handlerGetAboutMe` called without `profileId` and no `isPublic` check on this path (`:334`); `lang=en` else vi (`:333`); json/docx/ats/theme branching, unknown → classic PDF (`:338-364`); filename via `cvFilename`, `_VI`/`_EN` suffix unless already present (`createPDF.ats.ts:397-401`); classic/modern written to `public/pdf/<email>.pdf` (`createPDF.ts:75`); ATS persisted as `<slugified email>-ats.pdf` only when `PERSIST_EXPORTED_PDF` (`createPDF.ats.ts:477-483`); browser closed in `finally` (`createPDF.ts`, `createPDF.ats.ts:445-446`). No discrepancy.

## Questions + answers
Operator (2026-11-07): "behavior đúng" (Behavior section confirmed correct).
- Classic/modern PDF is always saved to `public/pdf/<email>.pdf`, which `express.static` serves without auth, so anyone who can guess an email can fetch that CV (known trap in `PROJECT.md`). Should the disk write be removed? → **Answer (operator 2026-11-07):** Bug — #383
- Unknown `format`/`template` values silently fall back instead of returning 400 (the public PDF route does return 400 for a bad template). Make them consistent? → **Answer (operator 2026-11-07):** Intended
- `?profile=` isn't supported on owner export. Should it be? → **Answer (operator 2026-11-07):** Change: support it — #400
- The route is named `download-pdf` but also serves DOCX and JSON. OK? → **Answer (operator 2026-11-07):** Intended

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/cv-export-spec.md` set in doc + INDEX row; Issues #383, #400. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
