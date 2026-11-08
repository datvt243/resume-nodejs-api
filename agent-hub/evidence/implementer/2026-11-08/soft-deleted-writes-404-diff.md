# 2026-11-08 - soft-deleted-writes-404 (diff)
- Worker: implementer · Version: 0.1.0
- Node: `soft-deleted-writes-404` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #403` — "Soft-deleted section entries are still treated as existing (delete again, image upload)"
- Plan: `evidence/implementer/2026-11-08/soft-deleted-writes-404-plan.md`

## Hub bytes before
96362

## Feature doc
`doctrine/features/cv-section-crud.md`

## Feature doc changed: Behavior #5 "Unknown id → 404" → "Unknown or already soft-deleted id → 404 (`deletedAt` untouched)"; Behavior #9 "Unknown id → 404" → "Unknown or soft-deleted id → 404 (nothing written)"; + Changelog row — operator: "Bug: 404 — #403" ×2 (2026-11-07, recorded in the doc's Open questions)

## Diff
| file | why |
|---|---|
| `src/services/index.ts` | `baseDeleteDocument` calls `baseCheckDocumentById` with `opts: { excludeDeleted: true }` (+1-line why); `baseCheckDocumentById` doc block no longer lists delete as a caller that must see deleted docs (only restore) |
| `src/candidate_profile/BaseController.ts` | `baseUploadImages`: `if (!document \|\| document.deletedAt)` → same 404 `common.notFoundId`, before `uploadImagesMiddleware` parses anything (+1-line why) |
| `src/__tests__/services/baseSoftDelete.test.ts` | fake `findOne` honors a `deletedAt: null` filter like Mongo; new: delete of a soft-deleted doc → 404, `updateOne` not called. Restore tests (deleted doc still found) unchanged and passing |
| `src/__tests__/candidate_profile/BaseController.test.ts` | new: `baseUploadImages` on a soft-deleted award → 404, `uploadImagesMiddleware` not called |

## Command
- `npx jest src/__tests__/services/baseSoftDelete.test.ts src/__tests__/candidate_profile/BaseController.test.ts` (new code; then with `git show HEAD:` of both `src/` files swapped in, then restored); `--verbose`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
old code + new tests:
    ✕ answers 404 for an already soft-deleted document, leaving deletedAt untouched (1 ms)
    ✕ answers 404 before parsing or storing any file (1 ms)
Tests:       2 failed, 26 passed, 28 total

new code, --verbose (final, after the lint fix below):
    ✓ sets deletedAt instead of removing the document, when the owner matches (4 ms)
    ✓ fails without touching the document when the caller is not the owner
    ✓ fails when the document does not exist (1 ms)
    ✓ answers 404 for an already soft-deleted document, leaving deletedAt untouched
    ✓ clears deletedAt when the owner matches, even for an already soft-deleted document
    ✓ fails without touching the document when the caller is not the owner (1 ms)
    ✓ fails when the document does not exist
    ✓ answers 404, never a "restored successfully" message, when the document was not soft-deleted
    ✓ baseDeleteDocument answers 404 for "a$b" instead of acting on the first document
    ✓ baseDeleteDocument answers 404 for "   " instead of acting on the first document (1 ms)
    ✓ baseRestoreDocument answers 404 for "a$b" instead of acting on the first document
    ✓ baseRestoreDocument answers 404 for "   " instead of acting on the first document (8 ms)
    ✓ passes page/limit/sort through as numbers/string when present (3 ms)
    ✓ omits page/limit/sort when the query string has none (backward compatible) (1 ms)
    ✓ without limit, answers data as an array plus meta
    ✓ with limit, answers data as an array plus meta
    ✓ silently drops a sort value that could smuggle a Mongo operator (1 ms)
    ✓ accepts a leading "-" in sort for descending order
    ✓ rejects with 400 when items is missing or not an array (12 ms)
    ✓ rejects with 400 when items exceeds the 100-item cap
    ✓ forces candidateId from the authenticated user onto every item, ignoring a client-supplied value (IDOR-safe) (1 ms)
    ✓ is best-effort: one invalid item does not block the others, and results/summary are still returned on partial failure (1 ms)
    ✓ reports summary.failed: 0 when every item succeeds
    ✓ fnCreate never answers 2xx for a failed create: the thrown AppError goes to errorsMiddleware (1 ms)
    ✓ fnCreate still answers a successful create with 201
    ✓ fnBulkCreate answers every-item-failed with one 400 envelope whose details point at each item (1 ms)
    ✓ fnBulkCreate keeps going after an item throws, and hides an unexpected error's text
    ✓ answers 404 before parsing or storing any file (1 ms)
Tests:       28 passed, 28 total

npm test   (before the lint fix — the fix only removed an `as any` in the new test)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts (5.357 s)
Test Suites: 2 failed, 62 passed, 64 total
Tests:       5 failed, 625 passed, 630 total

npm run build | grep -c "error TS"
0

npm run lint   (first run)
✖ 275 problems (275 errors, 0 warnings)
src/__tests__/candidate_profile/BaseController.test.ts | now: ✖ 1 problem | base: 0
  240:60  error  This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
→ fixed: dropped `as any` on the new test's `mockResolvedValue`

after the fix:
npx eslint src/__tests__/candidate_profile/BaseController.test.ts → 0
npx jest src/__tests__/candidate_profile/BaseController.test.ts src/__tests__/services/baseSoftDelete.test.ts
Tests:       28 passed, 28 total
npm run lint
✖ 274 problems (274 errors, 0 warnings)

per touched file (now | base):
src/services/index.ts | ✖ 2 problems | ✖ 2 problems
src/candidate_profile/BaseController.ts | ✖ 31 problems | ✖ 31 problems
src/__tests__/services/baseSoftDelete.test.ts | 0 | 0
src/__tests__/candidate_profile/BaseController.test.ts | 0 (after fix) | 0
```
The 5 `npm test` failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/visit-skip-private-diff.md`; 625 = 623 + 2 new tests.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) Behavior #5 — delete of a soft-deleted id → 404, `deletedAt` untouched | "answers 404 for an already soft-deleted document, leaving deletedAt untouched" ✓ |
| (1) Behavior #9 — image upload on a soft-deleted id → 404, nothing parsed | "answers 404 before parsing or storing any file" ✓ |
| (1) Behavior #6 — restore still finds a deleted entry | "clears deletedAt when the owner matches, even for an already soft-deleted document" ✓ (through the filter-honoring fake) |
| (2) both files pass, red on old code | `28 passed, 28 total`; old: `2 failed, 26 passed, 28 total` |
| (3) `npm test` no new failures | `5 failed, 625 passed, 630 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274` after fix; per-file now = base |
| comments per code-comments.md | two 1-line `//` WHY comments added; `baseCheckDocumentById` doc block edited to stay true (restore only); test-fake `//` why; no issue refs in non-test `src/` |

## Supersedes: none
`grep '#403' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- `baseRestoreDocument`'s own comment (`services/index.ts:168`) still says the check "doesn't filter on `deletedAt`" — true for that call, left as is.
- Pre-existing lint errors in `services/index.ts` (2) and `BaseController.ts` (31), same on staging, part of the 274 baseline.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
