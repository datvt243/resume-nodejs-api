# 2026-11-08 - bulk-partial-message (diff)
- Worker: implementer · Version: 0.1.0
- Node: `bulk-partial-message` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #404` — "Bulk create: partial success returns 201 with the message `common.createFailed`"
- Plan: `evidence/implementer/2026-11-08/bulk-partial-message-plan.md`

## Hub bytes before
96370

## Feature doc
`doctrine/features/cv-section-crud.md`

## Feature doc changed: Behavior #8 "At least one created → 201, `data: { results, summary }`" → same + "message `common.createSuccess` when all succeeded, else `common.bulkPartialSuccess` (\"Created X of Y items\" / \"Đã thêm X/Y mục\")"; + Changelog row — operator: "Bug: partial-success message — #404" (2026-11-07, recorded in the doc's Open questions)

## Diff
| file | why |
|---|---|
| `src/locales/en.ts` | `common.bulkPartialSuccess: 'Created {{succeeded}} of {{total}} items'` |
| `src/locales/vi.ts` | `common.bulkPartialSuccess: 'Đã thêm {{succeeded}}/{{total}} mục'` |
| `src/candidate_profile/BaseController.ts` | `fnBulkCreate` 201 branch: `failed === 0` → `createSuccess` (unchanged), else `bulkPartialSuccess` with `{{succeeded}}`/`{{total}}` replaced — same `.replace('{{x}}', …)` idiom as `errors.middleware.ts:17` / `helper.ts:53` |
| `src/__tests__/candidate_profile/BaseController.test.ts` | existing partial-failure test (en, 1 of 2) now asserts `'Created 1 of 2 items'`; new vi test (2 of 3) asserts `'Đã thêm 2/3 mục'` |

## Command
- `npx jest src/__tests__/candidate_profile/BaseController.test.ts` (new code; then with `git show HEAD:` of the 3 `src/` files swapped in, then restored); `--verbose -t "fnBulkCreate|partial"`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npx jest src/__tests__/candidate_profile/BaseController.test.ts
Tests:       17 passed, 17 total
old code + new assertions:
    ✕ is best-effort: one invalid item does not block the others, and results/summary are still returned on partial failure (3 ms)
    ✕ words a partial success as "X of Y" in Vietnamese too, never as a create failure (1 ms)
Tests:       2 failed, 15 passed, 17 total

npx jest src/__tests__/candidate_profile/BaseController.test.ts --verbose -t "fnBulkCreate|partial"
    ✓ rejects with 400 when items is missing or not an array (7 ms)
    ✓ rejects with 400 when items exceeds the 100-item cap
    ✓ forces candidateId from the authenticated user onto every item, ignoring a client-supplied value (IDOR-safe) (2 ms)
    ✓ is best-effort: one invalid item does not block the others, and results/summary are still returned on partial failure (1 ms)
    ✓ words a partial success as "X of Y" in Vietnamese too, never as a create failure
    ✓ reports summary.failed: 0 when every item succeeds
    ✓ fnBulkCreate answers every-item-failed with one 400 envelope whose details point at each item (1 ms)
    ✓ fnBulkCreate keeps going after an item throws, and hides an unexpected error's text (1 ms)
Tests:       9 skipped, 8 passed, 17 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 62 passed, 64 total
Tests:       5 failed, 626 passed, 631 total

npm run build | grep -c "error TS"
0
npm run lint
✖ 274 problems (274 errors, 0 warnings)
per touched file (now | base):
src/candidate_profile/BaseController.ts | ✖ 31 problems | ✖ 31 problems
src/locales/en.ts | 0 | 0
src/locales/vi.ts | 0 | 0
src/__tests__/candidate_profile/BaseController.test.ts | 0 | 0
```
The 5 `npm test` failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/soft-deleted-writes-404-diff.md`; 626 = 625 + 1 new test.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) Behavior #8 — partial success → 201 + "Created X of Y items" (en) | "is best-effort: one invalid item…" ✓ (asserts 201 + `'Created 1 of 2 items'`) |
| (1) same in vi | "words a partial success as \"X of Y\" in Vietnamese too…" ✓ (`'Đã thêm 2/3 mục'`) |
| (1) all succeeded / all failed unchanged | "reports summary.failed: 0 when every item succeeds" ✓, "fnBulkCreate answers every-item-failed with one 400 envelope…" ✓ |
| (2) file passes, red on old code | `17 passed, 17 total`; old: `2 failed, 15 passed, 17 total` |
| (3) `npm test` no new failures | `5 failed, 626 passed, 631 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| comments per code-comments.md | no comments touched |

## Supersedes: none
`grep '#404' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- `BaseController.ts` carries 31 pre-existing lint errors, same on staging, part of the 274 baseline.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
