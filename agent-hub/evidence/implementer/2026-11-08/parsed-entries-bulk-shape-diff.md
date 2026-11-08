# 2026-11-08 - parsed-entries-bulk-shape (diff)
- Worker: implementer · Version: 0.1.0
- Node: `parsed-entries-bulk-shape` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #388` — "CV PDF / LinkedIn import output can't be posted to `/education/bulk` / `/experience/bulk` unchanged"
- Plan: `evidence/implementer/2026-11-08/parsed-entries-bulk-shape-plan.md`

## Hub bytes before
96335

## Feature doc
`doctrine/features/cv-file-upload-import.md`

## Feature doc changed: Behavior #6 "Parsed entries use the create forms' field names … but `school`, `major` and `description` are plain strings … The client must wrap them … or those items get 400" → "Parsed entries are in the `/education/bulk` / `/experience/bulk` item shape and post there unchanged: `_id: null`; `school`, `major`, `description` as `{ vi, en }` with the same text in both; `company`/`position` plain strings; `startDate` number or `null`; `endDate` omitted when unknown or ongoing; `isCurrent` boolean"; Behavior #5 "unparseable → `endDate: null`" → "no `endDate`"; + acceptance line (`parsedEntriesBulkSchema.test.ts`) + Changelog row — operator: "Bug — #388" (2026-11-07) + AskUserQuestion 2026-11-08: "Parser emits full shape (Recommended)", "Both vi and en (Recommended)"

## Diff
| file | why |
|---|---|
| `src/candidate/parseLinkedInExport.service.ts` | `LocalizedText`; `ParsedDates` (`_id: null`, `startDate`, optional `endDate`, `isCurrent`) with a JSDoc why; `ParsedEducation`/`ParsedExperience` extend it with localized text; exported `localized(s)` (`//` why: source language unknown, vi must be non-empty) and `parsedDates()` (omits `endDate` when `null`); both mappers use them; filter on `school.vi` |
| `src/candidate/parseCvPdf.service.ts` | `toExperience`/`toEducation` build through `parsedDates` + `localized`; `parseCvText` filters on `school.vi` |
| `src/routers/api/v1/candidate.route.ts` | swagger of both parse endpoints: `_id`, `{ vi, en }`, `endDate` absent when unknown |
| `.claude/rules/api.md` | `parse-linkedin-export` row states the bulk item shape |
| `src/__tests__/candidate/parsedEntriesBulkSchema.test.ts` (new) | LinkedIn + PDF parsed entries (finished and ongoing) validate against `schemaEducation`/`schemaExperience` unchanged (only `candidateId` added, as `fnBulkCreate` does) |
| `src/__tests__/candidate/parseLinkedInExport.service.test.ts` | expectations in the new shape, written out literally; ongoing/unparseable → `not.toHaveProperty('endDate')` |
| `src/__tests__/candidate/parseCvPdf.service.test.ts` | expectations wrapped in a local `postable()` (plain → bulk shape; `//` why), same values |
| `src/__tests__/services/atsPdfIntegration.test.ts` | round-trip expectations in the new shape (`endDate: undefined`, `description.vi`, localized education) |

`startDate` stays `number | null` (an unparseable start is still 400 — the user must fill it in; not part of the operator's answer).

## Command
- `npx jest src/__tests__/candidate/parsedEntriesBulkSchema.test.ts` (new code; then with `git show HEAD:` of both parser files swapped in, then restored)
- `npx jest src/__tests__/candidate/parsedEntriesBulkSchema.test.ts src/__tests__/candidate/parseLinkedInExport.service.test.ts src/__tests__/candidate/parseCvPdf.service.test.ts --verbose`
- `npx jest src/__tests__/candidate` (all candidate suites)
- `PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx jest src/__tests__/services/atsPdfIntegration.test.ts --verbose` (local bundled Chrome missing; the system Chrome lets the real round-trip run)
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
old parsers + new bulk-schema test:
    ✕ LinkedIn: every education and experience, finished and ongoing (2 ms)
    ✕ PDF CV: every education and experience, finished and ongoing (1 ms)
    Received: "\"_id\" is required. \"school\" must be of type object. \"major\" must be of type object. \"Mô tả\" must be of type object"
    Received: "\"_id\" is required. \"school\" must be of type object. \"major\" must be of type object. \"Mô tả\" must be of type object"
Tests:       2 failed, 2 total

new code, --verbose:
    ✓ parses Education.csv and Positions.csv into the expected shapes (20 ms)
    ✓ finds the CSVs even when nested inside a folder in the zip (real LinkedIn export shape) (2 ms)
    ✓ an end date that is present but unparseable is a finished entry: no endDate, isCurrent false (1 ms)
    ✓ matches headers case-insensitively (1 ms)
    ✓ returns empty arrays, does not throw, when neither CSV is present in an otherwise valid zip (1 ms)
    ✓ throws INVALID_ZIP for a buffer that is not a real zip (14 ms)
    ✓ parses an English CV laid out as title line, date line, description (ATS template layout) (7 ms)
    ✓ parses Vietnamese headings and "Hiện tại"/"đến nay" as an ongoing entry (1 ms)
    ✓ matches decomposed (NFD) Vietnamese headings the same as composed ones
    ✓ handles title and dates on the same line, month-name dates, and a company-first title (1 ms)
    ✓ handles a dates-first layout (bare date line, title on the next line)
    ✓ does not treat a sentence containing a heading word as a heading
    ✓ does not read a year out of a longer number such as a phone number
    ✓ returns empty arrays (not an error) when no sections are recognized
    ✓ rejects an unreadable/corrupt PDF with INVALID_PDF (357 ms)
    ✓ LinkedIn: every education and experience, finished and ongoing (4 ms)
    ✓ PDF CV: every education and experience, finished and ongoing
Tests:       17 passed, 17 total

npx jest src/__tests__/candidate
Tests:       251 passed, 251 total   (before parsedEntriesBulkSchema.test.ts was added)

PUPPETEER_EXECUTABLE_PATH=<system Chrome> npx jest src/__tests__/services/atsPdfIntegration.test.ts --verbose
    ✓ renders a real PDF whose extracted text passes the full ATS check suite (2453 ms)
    ✓ reports keyword coverage against a sample job description (849 ms)
    ✓ round-trips the en ATS PDF through the PDF CV import parser (890 ms)
    ✓ round-trips the vi ATS PDF through the PDF CV import parser (1025 ms)
Tests:       4 passed, 4 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 63 passed, 65 total
Tests:       5 failed, 636 passed, 641 total

npm run build | grep -c "error TS"
0
npm run lint
✖ 274 problems (274 errors, 0 warnings)
per touched file (now | base):
src/candidate/parseLinkedInExport.service.ts | ✖ 1 problem | ✖ 1 problem
src/candidate/parseCvPdf.service.ts | 0 | 0
src/routers/api/v1/candidate.route.ts | 0 | 0
src/__tests__/candidate/parseCvPdf.service.test.ts | 0 | 0
src/__tests__/candidate/parseLinkedInExport.service.test.ts | 0 | 0
src/__tests__/services/atsPdfIntegration.test.ts | 0 | 0
src/__tests__/candidate/parsedEntriesBulkSchema.test.ts | 0 | 0 (new file)
```
`npm test` (no `PUPPETEER_EXECUTABLE_PATH`): the 5 failures are the pre-existing local-env ones (atsPdfIntegration ×4 "Could not find Chrome (ver. 127.0.6533.88)", tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/linkedin-unparseable-end-date-diff.md`; 636 = 634 + 2 new tests. The same 4 atsPdfIntegration tests pass with a real Chrome (block above).

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) Behavior #6 — parsed entries post to bulk unchanged (LinkedIn + PDF, finished + ongoing) | "LinkedIn: every education and experience, finished and ongoing" ✓, "PDF CV: …" ✓ — validated against the real `schemaEducation`/`schemaExperience` |
| (1) Behavior #6 — exact shape (`_id: null`, `{ vi, en }` both filled, no null `endDate`) | "parses Education.csv and Positions.csv into the expected shapes" ✓ (literal `toEqual` + `not.toHaveProperty('endDate')`) |
| (1) Behavior #5 — unparseable end → no `endDate`, `isCurrent: false` | "an end date that is present but unparseable is a finished entry: no endDate, isCurrent false" ✓ |
| (2) files pass; bulk test red on old parsers | `17 passed, 17 total`; old: `2 failed, 2 total` (`_id` / `school` / `major` / `Mô tả` errors) |
| (2) real render → parse round-trip in the new shape | atsPdfIntegration with system Chrome: `4 passed, 4 total` |
| (3) `npm test` no new failures | `5 failed, 636 passed, 641 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| comments per code-comments.md | JSDoc why on `ParsedDates`, `//` why on `localized`, test-helper `//` + suite JSDoc; no issue refs in non-test `src/` |

## Supersedes: none
`grep '#388' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- Frontend import mapping must read `{ vi, en }` and a missing `endDate` (API shape change on both parse endpoints) — not raised on the frontend repo from here.
- An unparseable `startDate` still yields `null` → that item 400s in bulk; out of the operator's answer.
- `parseLinkedInExport.service.ts` carries 1 pre-existing lint error, same on staging.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
