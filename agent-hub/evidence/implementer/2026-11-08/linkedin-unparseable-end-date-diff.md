# 2026-11-08 - linkedin-unparseable-end-date (diff)
- Worker: implementer · Version: 0.1.0
- Node: `linkedin-unparseable-end-date` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #401` — "LinkedIn import: an unparseable end date is treated as \"current\""
- Plan: `evidence/implementer/2026-11-08/linkedin-unparseable-end-date-plan.md`

## Hub bytes before
96329

## Feature doc
`doctrine/features/cv-file-upload-import.md`

## Feature doc changed: Behavior #5 "`isCurrent = true` when there is no end date" → "`isCurrent = true` only when the CSV end date is blank or \"Present\"; an end date that is present but unparseable → `endDate: null`, `isCurrent: false`"; + Changelog row — operator: "Bug: blank endDate + isCurrent false — #401" (2026-11-07, recorded in the doc's Open questions)

## Diff
| file | why |
|---|---|
| `src/candidate/parseLinkedInExport.service.ts` | `isOngoing(raw)` = `!raw.trim() \|\| /present/i.test(raw)` (same "Present" rule `parseLinkedInDate` already uses), 1-line why comment; both mappers keep the raw cell (`rawEndDate`) and set `isCurrent: isOngoing(rawEndDate)`; `endDate` still `parseLinkedInDate(raw)` |
| `src/__tests__/candidate/parseLinkedInExport.service.test.ts` | Education `End Date: "sometime"` + Positions `Finished On: "not a date"` → `endDate: null, isCurrent: false` |

Blank (`"Night School"`) and `"Present"` (`"Current Co"`) stay `isCurrent: true` — asserted by the existing "parses Education.csv and Positions.csv into the expected shapes" test.

## Command
- `npx jest src/__tests__/candidate/parseLinkedInExport.service.test.ts --verbose` (new code; then with `git show HEAD:src/candidate/parseLinkedInExport.service.ts` swapped in, then restored)
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npx jest src/__tests__/candidate/parseLinkedInExport.service.test.ts --verbose
    ✓ parses Education.csv and Positions.csv into the expected shapes (14 ms)
    ✓ finds the CSVs even when nested inside a folder in the zip (real LinkedIn export shape) (2 ms)
    ✓ an end date that is present but unparseable is a finished entry: endDate null, isCurrent false (1 ms)
    ✓ matches headers case-insensitively
    ✓ returns empty arrays, does not throw, when neither CSV is present in an otherwise valid zip
    ✓ throws INVALID_ZIP for a buffer that is not a real zip (3 ms)
Tests:       6 passed, 6 total

old parser + new test:
    ✕ an end date that is present but unparseable is a finished entry: endDate null, isCurrent false (3 ms)
Tests:       1 failed, 5 passed, 6 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts (5.024 s)
Test Suites: 2 failed, 62 passed, 64 total
Tests:       5 failed, 634 passed, 639 total

npm run build | grep -c "error TS"
0
npm run lint
✖ 274 problems (274 errors, 0 warnings)
per touched file (now | base):
src/candidate/parseLinkedInExport.service.ts | ✖ 1 problem | ✖ 1 problem
src/__tests__/candidate/parseLinkedInExport.service.test.ts | 0 | 0
```
The 5 `npm test` failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/ats-check-messages-i18n-diff.md`; 634 = 633 + 1 new test.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) unparseable end date → `endDate: null`, `isCurrent: false` (education + experience) | "an end date that is present but unparseable is a finished entry…" ✓ |
| (1) blank / "Present" still current | "parses Education.csv and Positions.csv into the expected shapes" ✓ (asserts Night School + Current Co `isCurrent: true`) |
| (2) file passes, red on old parser | `6 passed, 6 total`; old: `1 failed, 5 passed, 6 total` |
| (3) `npm test` no new failures | `5 failed, 634 passed, 639 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| comments per code-comments.md | one 1-line `//` WHY above `isOngoing`; no issue refs |

## Supersedes: none
`grep '#401' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- `parseLinkedInExport.service.ts` carries 1 pre-existing lint error, same on staging.
- Parsed entries still return plain-string `school`/`major`/`description` — that is #388, next node.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
