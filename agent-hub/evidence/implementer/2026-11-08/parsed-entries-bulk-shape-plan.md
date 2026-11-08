# 2026-11-08 - parsed-entries-bulk-shape (plan)
- Worker: implementer · Version: 0.1.0
- Node: `parsed-entries-bulk-shape` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#388` grep active + archive: 0 hits
- Task: `/todo #388` — "CV PDF / LinkedIn import output can't be posted to `/education/bulk` / `/experience/bulk` unchanged"
- Branch: `388-cv-pdf-linkedin` (via `gh issue develop`, from `staging` @ b277225)

## Hub bytes before
96335

## Feature doc: `doctrine/features/cv-file-upload-import.md`
Open question answered 2026-11-07: "Bug — #388" (to "Should the parser return the localized shape?"). Probe (schemas run on a parsed entry) found two more blockers beyond the shape: `_id` is required (`_id` in `config/joi.config.ts:33` allows `null`) and `endDate: null` fails `Joi.number()` — so the issue text alone would still 400 every ongoing entry. Asked the operator (AskUserQuestion 2026-11-08):
- "how should parsed entries become postable unchanged?" → **"Parser emits full shape (Recommended)"**: `{ vi: s, en: s }`, `_id: null`, omit `endDate` when null; bulk/create validation untouched.
- "Which language slot?" → **"Both vi and en (Recommended)"**.
Behavior #6 documented the mismatch → rewritten to that answer; Behavior #5 (`endDate: null` from #401) aligned.

## Acceptance
1. Behavior #5/#6 (updated).
2. `npx jest src/__tests__/candidate/parsedEntriesBulkSchema.test.ts src/__tests__/candidate/parseLinkedInExport.service.test.ts src/__tests__/candidate/parseCvPdf.service.test.ts` passes; bulk-schema test fails on the old parsers; `atsPdfIntegration.test.ts` round-trips pass with a real Chrome.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/candidate/parseLinkedInExport.service.ts` (types + both mappers), `src/candidate/parseCvPdf.service.ts:240-280` (`toExperience`, `toEducation`, `parseCvText` filter)
- `src/candidate_profile/education/education.validate.ts`, `experience.validate.ts`, `src/config/joi.config.ts:33,94-108` (read only)
- `src/candidate_profile/BaseController.ts` `fnBulkCreate` (adds `candidateId` only — read only)
- swagger `src/routers/api/v1/candidate.route.ts` (both parse endpoints), `.claude/rules/api.md`
