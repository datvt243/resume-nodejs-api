# 2026-11-15 — compound-candidate-deleted-index (diff)
- Worker: implementer · Version 0.1.0
- Node: `compound-candidate-deleted-index` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: `#465 Add compound index { candidateId, deletedAt } on CV-section models`
- Branch: `465-add-compound-index` (from `staging` @ 5d4d209)
- Status: sealed_pending_verifier

## Hub bytes before: 97414
## Feature doc: doctrine/features/cv-section-crud.md (no Behavior change — index only)

## Diff
| File | Why |
|---|---|
| `src/models/{application,award,certificate,education,experience,profile,project}.model.ts`, `src/models/reference.modal.ts` | drop `index: true` on `candidateId`; add `schema.index({ candidateId: 1, deletedAt: 1 })` + 1-line why comment before `mongoose.model(...)` (same placement as `visit.model.ts:39-40`) |
| `src/__tests__/models/candidateIndex.test.ts` (new) | asserts each of the 8 schemas declares the compound index and no single-field `{ candidateId: 1 }` |

## Command
- `npx jest src/__tests__/models/candidateIndex.test.ts` (with change, then with `git stash` = without change)
- `npm test`
- `npm run build` (Typecheck: inside Build)
- `npm run lint`; `npx eslint src/models src/__tests__/models/candidateIndex.test.ts`

## Output
New test, with change:
```
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```
New test, change stashed (proves the test bites):
```
Tests:       8 failed, 8 total
```
`npm test`:
```
Test Suites: 72 passed, 72 total
Tests:       781 passed, 781 total
Snapshots:   0 total
Time:        21.18 s
Ran all test suites.
```
`npm run build` (tail):
```
> resume-nodejs-api@2.8.0 copy
> cp -R ./src/public ./dist/

build exit 0
```
`npm run lint` (tail):
```
✖ 274 problems (274 errors, 0 warnings)
  20 errors and 0 warnings potentially fixable with the `--fix` option.
```
`npx eslint src/models src/__tests__/models/candidateIndex.test.ts`: no output (0 problems).

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. 8 schemas declare `{candidateId:1, deletedAt:1}`, no `index: true` on `candidateId` | new test `Tests: 8 passed, 8 total`; `8 failed` with change stashed |
| 2. `npm test` green | `Tests: 781 passed, 781 total` |
| 3. `npm run build` 0 errors | `build exit 0` |
| 4. lint ≤ 274, none in touched files | `274 problems` (= baseline); eslint on touched files: no output |
| comments per code-comments.md | one 1-line why comment per model, matches `visit.model.ts:39` style |

## Supersedes: none
## Still open: none

## Review
`/code-review medium` (forked skill), 6 findings:
1. Old `candidateId_1` index persists in existing DBs (Mongoose autoIndex never drops) → real, but not a code change: dropping indexes on prod/staging Atlas is an outward-facing destructive op → `## Noticed, not done` (operator action). Adding `syncIndexes()` at boot rejected: it would also drop any index created by hand in Atlas.
2. Test checks schema, not live DB → false positive vs criterion 1, which is scoped to the schema declaration; live-DB state is covered by finding 1's operator action.
3. `visit.model.ts` redundant `candidateId` single index next to `{candidateId, ip, createdAt}` → out of scope (#465 lists 8 models) → Noticed.
4. Shared soft-delete plugin → refactor, out of scope (SmallestDiff) → Noticed.
5. List sorts not covered by index → out of scope → Noticed.
6. `deletedAt` missing vs null on non-sparse index → false positive: `{deletedAt: null}` matches both and the index serves it; schema defaults `deletedAt` to `null`.

## Noticed, not done
- **Operator action after deploy**: on each existing DB (staging, prod) the 8 collections keep `candidateId_1` alongside the new `candidateId_1_deletedAt_1`. Drop after confirming the new index exists, e.g. `db.<collection>.dropIndex('candidateId_1')` for education, experience, project, award, certificate, reference, profile, application. Issue also suggests `explain()` on Atlas — not run.
- `visit.model.ts:28` `index: true` on `candidateId` is redundant with the `{candidateId, ip, createdAt}` compound prefix.
- Soft-delete field + index repeated in 8 models; a `models/part/` plugin could centralize them.
- Sorted list queries (`src/services/index.ts` `baseFindDocuments`) still sort in memory.

## Seal gate: none (no outward-facing action; nothing committed/pushed)
