# 2026-11-08 - ats-classic-not-applicable (diff)
- Worker: implementer · Version: 0.1.0
- Node: `ats-classic-not-applicable` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #406` — "ATS check with `template=classic`: `metadata` always fails, `standard-headings` checks nothing"
- Plan: `evidence/implementer/2026-11-08/ats-classic-not-applicable-plan.md`

## Hub bytes before
96346

## Feature doc
`doctrine/features/ats-check.md`

## Feature doc changed: Behavior #4 "`score` = round(passed weight / total weight × 100)" → same + ", over applicable checks only"; new Behavior #4b (classic → `standard-headings` + `metadata` `applicable: false`, `passed: true`, localized not-applicable message, excluded from score; no `applicable` field otherwise); + Changelog row — operator: "Bug: report both as not applicable for classic, excluded from score — #406" (2026-11-07, recorded in the doc's Open questions)

## Diff
| file | why |
|---|---|
| `src/services/atsChecks.ts` | `AtsCheckResult.applicable?: false` and `AtsCheckInput.template?` (JSDoc why on each); `notApplicable(id, input)` helper; `checkStandardHeadings`/`checkMetadata` return it for `classic`; `scoreChecks` skips `applicable === false` (empty/all-N/A total → 100, same as the old empty-array guard it replaces) |
| `src/candidate_me/ats-check.ts` | passes `template` into `checkInput`; classic-branch doc block rewritten (it said both checks "correctly surface as failures" — no longer true) |
| `src/locales/en.ts`, `src/locales/vi.ts` | new `atsCheck.notApplicableClassic` |
| `src/routers/api/v1/cv.route.ts` | swagger: `score` over applicable checks; `applicable` property documented |
| `.claude/rules/api.md` | ats-check row mentions the classic N/A checks |
| `src/__tests__/services/atsChecks.test.ts` | `template=classic`: both checks `applicable: false` + en/vi message; `ats` still judged (no `applicable`); `runAtsChecks` keeps 10 checks, 8 applicable, score = score of applicable = 100 |

## Command
- `npx jest src/__tests__/services/atsChecks.test.ts --verbose` (new code; then with `git show HEAD:` of the 4 `src/` files swapped in, then restored)
- `npx jest src/__tests__/candidate_me/index.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npx jest src/__tests__/services/atsChecks.test.ts --verbose
    ✓ passes when enough text was extracted (1 ms)
    ✓ fails when almost no text was extracted (likely an image-only PDF)
    ✓ passes when the name is first and headings appear in order
    ✓ fails when the name is not on the first line
    ✓ fails when headings appear out of order
    ✓ passes for normal text (1 ms)
    ✓ fails when letters are separated by single spaces (letter-spacing artifact)
    ✓ passes when email and phone are both in the first ~10 lines
    ✓ fails when contact info is missing from the top of the body
    ✓ passes when every heading is a standard localized heading
    ✓ fails when a non-standard (e.g. legacy classic-template) heading is used
    ✓ passes when all dates are zero-padded MM/YYYY
    ✓ fails on an unpadded single-digit month (the formatDate regression)
    ✓ passes when experience start dates are descending
    ✓ fails when an earlier job is listed before a later one
    ✓ passes when no forbidden personal field appears
    ✓ fails when date of birth is present
    ✓ fails when a Vietnamese forbidden field is present
    ✓ passes (warning-only) at 2 pages
    ✓ fails (warning) above 2 pages
    ✓ passes when Title and Author are set (1 ms)
    ✓ fails when metadata is missing
    ✓ scores 100 when every check passes
    ✓ weighs error failures more heavily than warning failures
    ✓ scores 0 when everything fails
    ✓ reports standard-headings and metadata as not applicable, with a localized message
    ✓ still judges both checks for the ats template (1 ms)
    ✓ leaves not-applicable checks out of the score
Tests:       28 passed, 28 total

old code + new tests (suite does not compile — the new fields don't exist):
    src/__tests__/services/atsChecks.test.ts:178:50 - error TS2353: Object literal may only specify known properties, and 'template' does not exist in type 'AtsCheckInput'.
    src/__tests__/services/atsChecks.test.ts:188:40 - error TS2353: Object literal may only specify known properties, and 'template' does not exist in type 'AtsCheckInput'.
    src/__tests__/services/atsChecks.test.ts:189:40 - error TS2353: Object literal may only specify known properties, and 'template' does not exist in type 'AtsCheckInput'.
    src/__tests__/services/atsChecks.test.ts:189:59 - error TS2339: Property 'applicable' does not exist on type 'AtsCheckResult'.
    src/__tests__/services/atsChecks.test.ts:195:47 - error TS2339: Property 'applicable' does not exist on type 'AtsCheckResult'.
(first 5 error lines, `| head -5`)

npx jest src/__tests__/candidate_me/index.test.ts
Tests:       51 passed, 51 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 62 passed, 64 total
Tests:       5 failed, 629 passed, 634 total

npm run build | grep -c "error TS"
0
npm run lint
✖ 274 problems (274 errors, 0 warnings)
per touched file (now | base):
src/services/atsChecks.ts | 0 | 0
src/candidate_me/ats-check.ts | ✖ 5 problems | ✖ 5 problems
src/locales/en.ts | 0 | 0
src/locales/vi.ts | 0 | 0
src/routers/api/v1/cv.route.ts | 0 | 0
src/__tests__/services/atsChecks.test.ts | 0 | 0
```
The 5 `npm test` failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome — the real-Puppeteer suite, which renders the `ats` template only; tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/bulk-partial-message-diff.md`; 629 = 626 + 3 new tests.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) classic → both checks `applicable: false`, localized message (en + vi) | "reports standard-headings and metadata as not applicable, with a localized message" ✓ |
| (1) excluded from score; still 10 checks | "leaves not-applicable checks out of the score" ✓ (10 checks, 8 applicable, score 100) |
| (1) `ats` unchanged | "still judges both checks for the ats template" ✓ + the 25 pre-existing check tests ✓ |
| (2) both files pass, red on old code | `28 passed, 28 total`, `51 passed, 51 total`; old: TS2353/TS2339 compile errors |
| (3) `npm test` no new failures | `5 failed, 629 passed, 634 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| comments per code-comments.md | 2 new 1-sentence JSDoc on the new fields (WHY); classic-branch `/** */` rewritten to stay true; one `//` in the test; no issue refs in non-test `src/` |
| PDF export standard | not triggered — no `createPDF*.ts`/`createDocx.ts` change |

## Supersedes: none
`grep '#406' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- Frontend datvt243/resume-vuejs-website#461 needs to read `applicable: false` — not commented on that issue from here (outward action not requested).
- `ats-check.ts` carries 5 pre-existing lint errors, same on staging.
- The other check messages are still hard-coded English — that is #407, next node.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
