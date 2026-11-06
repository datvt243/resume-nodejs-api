# ATS check

- Status: draft
- Source: backfill from code
- Issues: -
- Anchors: `src/routers/api/v1/cv.route.ts`, `src/candidate_me/ats-check.ts`, `src/services/atsChecks.ts`, `src/services/atsExtract.ts`, `src/services/keywordMatcher.ts`, `src/services/createPDF.ats.ts`, `src/services/createPDF.ts`

## Goal
A signed-in candidate sees how well their exported CV survives an
Applicant Tracking System and, optionally, how well it matches a job
description.

## Behavior
1. `POST /api/v1/cv/ats-check` requires a valid access token; it always
   checks the caller's own CV. Nothing is saved.
2. Body (all optional): `lang` (`en`, else `vi`), `template` (`classic`,
   else `ats`), `jobDescription` (string).
3. The CV is rendered to a PDF in memory with the chosen template, its
   text is extracted back out, and 10 checks run: `text-extractable`,
   `reading-order`, `no-spaced-letters`, `contact-in-body`,
   `standard-headings`, `date-format`, `reverse-chronological`,
   `no-forbidden-fields` (date of birth / gender / marital status, vi+en),
   `page-count` (≤ 2 pages), `metadata` (PDF Title + Author set).
4. Every check has severity `error` (weight 2) except `page-count`,
   which is a `warning` (weight 1).
   `score` = round(passed weight / total weight × 100).
5. With `jobDescription`, `keywordMatch` = `{ matched, missing, coverage }`
   over a fixed keyword dictionary (alias-aware, whole-word,
   case-insensitive); `coverage` = matched / (matched + missing), 0 when
   the JD has no known keyword.
6. Response 200: `data: { score, pages, checks, extractedText,
   keywordMatch? }`.

## Acceptance criteria
- `npx jest src/__tests__/services/atsChecks.test.ts src/__tests__/services/keywordMatcher.test.ts` passes.
- `npx jest src/__tests__/candidate_me/index.test.ts` passes (covers `fnAtsCheck`).
- Response `data.checks` has exactly 10 items with the ids listed in rule 3.

## Edge cases
- No `jobDescription` → `keywordMatch` absent from the response.
- `template: "modern"` → checked as `ats` (only `classic` is recognized).

## Out of scope
- Checking an uploaded third-party PDF (only the candidate's own render).

## Open questions
- With `template=classic`, metadata and section headings are never supplied, so `metadata` always fails and `standard-headings` always passes without checking anything (empty heading list). Is that intended?
- The success message `ATS self-check completed` is hard-coded English, not i18n. Intended?
- The classic render here ignores `lang` (`renderPdfBuffer` takes no options); the data itself is localized. OK?
- `modern` can't be checked. Intended?
- `jobDescription` has no length cap beyond the 1mb body limit. Enough?

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
