# ATS check

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/ats-check-spec.md`
- Source: backfill from code
- Issues: #406, #407
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
   `score` = round(passed weight / total weight × 100), over applicable
   checks only.
4b. With `template: "classic"` (no PDF metadata, no section-heading
   list), `standard-headings` and `metadata` come back with
   `applicable: false`, `passed: true` and a localized "not applicable"
   message, and are left out of the score. Every other check, and both
   of these for `ats`, carry no `applicable` field.
5. With `jobDescription`, `keywordMatch` = `{ matched, missing, coverage }`
   over a fixed keyword dictionary (alias-aware, whole-word,
   case-insensitive); `coverage` = matched / (matched + missing), 0 when
   the JD has no known keyword.
6. Response 200: `data: { score, pages, checks, extractedText,
   keywordMatch? }`. The response `message` and every check's `message`
   are localized (vi + en) in the request language (`req.lang`), which
   may differ from the CV's `lang`; section-heading names are still
   judged in the CV's `lang`.

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
- With `template=classic`, metadata and section headings are never supplied, so `metadata` always fails and `standard-headings` always passes without checking anything (empty heading list). Is that intended? → **Answer (operator 2026-11-07):** Bug: report both as not applicable for classic, excluded from score — #406
- The success message `ATS self-check completed` is hard-coded English, not i18n. Intended? → **Answer (operator 2026-11-07):** Bug: i18n — #407
- The classic render here ignores `lang` (`renderPdfBuffer` takes no options); the data itself is localized. OK? → **Answer (operator 2026-11-07):** Intended
- `modern` can't be checked. Intended? → **Answer (operator 2026-11-07):** Intended
- `jobDescription` has no length cap beyond the 1mb body limit. Enough? → **Answer (operator 2026-11-07):** Intended

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/ats-check-spec.md` | - |
| 2026-11-08 | Behavior 4/4b: classic → standard-headings + metadata `applicable: false`, excluded from score | operator answer #406 | ats-classic-not-applicable |
| 2026-11-08 | Behavior 6: success + every check message localized via `req.lang` | operator answer #407 (+ issue comment: all check messages) | ats-check-messages-i18n |
