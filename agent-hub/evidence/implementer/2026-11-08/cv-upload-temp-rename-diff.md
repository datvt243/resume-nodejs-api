# 2026-11-08 - cv-upload-temp-rename (diff)
- Worker: implementer · Version: 0.1.0
- Node: `cv-upload-temp-rename` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #384` — "A failed (oversized) CV re-upload deletes the previously stored CV"
- Plan: `evidence/implementer/2026-11-08/cv-upload-temp-rename-plan.md`

## Hub bytes before
96395

## Feature doc
`doctrine/features/cv-file-upload-import.md`

## Feature doc changed: Behavior #2 "Saved as `public/uploads/cv/<id>-cv.pdf`, overwriting any previous one" → "Saved as `storage/cv/<id>-cv.pdf` (outside `public/`), replacing any previous one only once the new upload succeeded — a rejected upload leaves the stored CV untouched"; Behavior #3 "no upload yet → 404" → "no upload yet, or a `cvFile` record whose file is missing on disk → 404"; + Changelog row — operator: "Bug — #384" and "Bug: return 404 — tracked in #384 (comment)" (2026-11-07, recorded in the doc's Open questions)

## Diff
| file | why |
|---|---|
| `src/middlewares/uploadCV.middleware.ts` | multer filename `<id>-<randomUUID>.tmp` instead of the final name; on success `renameSync` over `<id>-cv.pdf` then `next()`; rename failure → temp removed, generic `cvUploadFailed` 400. On `LIMIT_FILE_SIZE` multer unlinks only the temp. Header comment updated |
| `src/candidate/candidate.controller.ts` | `fnDownloadCV`: 404 `cvFileNotFound` when the record exists but `fs.existsSync(filePath)` is false (was an undefined `res.download` error) |
| `src/__tests__/middlewares/uploadCV.middleware.test.ts` | real multer through an express app on an ephemeral port + `fetch`/`FormData`: valid upload → final file, no `.tmp` left; oversized re-upload → 400, previous file intact, no `.tmp` left |
| `src/__tests__/candidate/candidate.controller.test.ts` | missing-file → 404, `res.download` not called |

## Command
- `npx jest src/__tests__/middlewares/uploadCV.middleware.test.ts` (new code, then with `git show HEAD:src/middlewares/uploadCV.middleware.ts` swapped in, then restored)
- `npx jest src/__tests__/candidate/candidate.controller.test.ts src/__tests__/middlewares/uploadCV.middleware.test.ts`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
old middleware + new test:
    ✓ a valid upload lands at <candidateId>-cv.pdf with no temp file left (19 ms)
    ✕ an oversized re-upload is rejected and the previous CV stays intact (20 ms)
Tests:       1 failed, 5 passed, 6 total

new code:
PASS src/__tests__/middlewares/uploadCV.middleware.test.ts
PASS src/__tests__/candidate/candidate.controller.test.ts
Tests:       21 passed, 21 total

npm test   (run 1)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
FAIL src/__tests__/contract/errorEnvelope.test.ts
Test Suites: 3 failed, 60 passed, 63 total
Tests:       5 failed, 607 passed, 612 total
npx jest src/__tests__/contract/errorEnvelope.test.ts
PASS src/__tests__/contract/errorEnvelope.test.ts
Tests:       12 passed, 12 total
npm test   (run 2, no code change)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 61 passed, 63 total
Tests:       5 failed, 619 passed, 624 total
  ● access vs refresh token expiry — ... › falls back to a 1h access token when TOKEN_EXP_IN is unset
  ● ATS PDF integration (real Puppeteer + pdf-parse) › (4 tests)

npm run build | grep -c "error TS"
0
npm run lint
✖ 274 problems (274 errors, 0 warnings)
per touched file (now | base):
src/middlewares/uploadCV.middleware.ts | 0 | 0
src/candidate/candidate.controller.ts | ✖ 7 problems | ✖ 7 problems
src/__tests__/middlewares/uploadCV.middleware.test.ts | 0 | 0
src/__tests__/candidate/candidate.controller.test.ts | 0 | 0
```
Run 1's errorEnvelope suite failure did not reproduce (alone: 12 passed; run 2: not failing) and that run counted 612 total — treated as a flake of the full parallel run. Run 2: the same 5 pre-existing local-env failures as `evidence/implementer/2026-11-08/auth-credential-limit-diff.md` (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`); 619 = 616 + 3 new tests.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) Behavior #2 — rejected re-upload keeps the stored CV | "an oversized re-upload is rejected and the previous CV stays intact" ✓ (new) / ✕ (old middleware) |
| (1) Behavior #3 — missing file → 404 | "answers 404 like \"no upload yet\" instead of calling res.download" in `Tests: 21 passed, 21 total` |
| (2) test files pass, red on old code | `Tests: 21 passed, 21 total`; old: `1 failed, 5 passed, 6 total` |
| (3) `npm test` no new failures | run 2 `5 failed, 619 passed, 624 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| comments per code-comments.md | header block rewritten (WHY: rejected re-upload never destroys the stored CV); 1-line `//` why on the rename fallthrough and on the missing-file 404; no issue refs in non-test `src/` |

## Supersedes: none
`grep '#384' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- `candidate.controller.ts` carries 7 pre-existing lint errors (same on staging, part of the 274 baseline).
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
