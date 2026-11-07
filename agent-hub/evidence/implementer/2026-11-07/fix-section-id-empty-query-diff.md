# 2026-11-07 - fix-section-id-empty-query (diff)
- Worker: implementer · Version: 0.1.0
- Node: `fix-section-id-empty-query` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #381`
- Branch: `381-section-delete-restore-acts` (off `staging` @ 0141d71)
- Status: sealed_pending_verifier

## Hub bytes before
93030

## Feature doc: `doctrine/features/cv-section-crud.md` (Behavior #5/#6 "unknown id → 404" restored; doc unchanged)

## Diff
| file | why |
|---|---|
| `src/services/index.ts` | `baseCheckDocumentById`: build `safeIdQuery` once; `if (!('_id' in safeIdQuery)) return { isExist: false as const, message, document: null };` before `findOne`, + 1-line `//` WHY comment. Fixed in the shared helper (root cause) so delete, restore, and the 2 other callers (update/patch, already `excludeDeleted`) all get it — those 2 would otherwise match `{deletedAt:null}` = first live doc; their result is the same 404 path, Behavior #4 "unknown `_id` → 404" |
| `src/__tests__/services/baseSoftDelete.test.ts` | new `describe(... (issue #381))`, `it.each` delete/restore × `'a$b'`/`'   '`: fake model owned by the caller (worst case), expect 404 `NOT_FOUND`, `findOne` and `updateOne` never called |

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. Dropped `_id` → 404, no query, no `updateOne` (Behavior #5/#6) | Output 1: 4 `✓ ... answers 404 for "a$b"/"   " instead of acting on the first document` lines (delete + restore) |
| 2. Regression tests pass | Output 1: `Tests:       17 passed, 17 total` (`baseSoftDelete` + `baseUpdatePatchSoftDelete`, the other suite covering this helper) |
| 3a. `npm test` no new failures vs staging | Output 2 after: `Tests:       5 failed, 576 passed, 581 total`; baseline: `Tests:       5 failed, 572 passed, 577 total` — same 5 `✕` names, +4 = new tests |
| 3b. `npm run build` clean (Typecheck inside Build) | Output 3: `BUILD_EXIT=0` |
| 3c. `npm run lint` ≤ 274, none new in touched files | Output 4: `✖ 274 problems (274 errors, 0 warnings)`; touched files 2 errors before / 2 after, identical (`services/index.ts` 238:95 `'unknown' overrides...`, 265:5 `Promises must be awaited...` — both outside the diff) |
| 4. comments per code-comments.md | 2 comments added: `services/index.ts` `// safeQuery drops a \`$\`/blank id — without this guard findOne would match the collection's first document.` (WHY/trap, 1-sentence `//` in function body, no issue ref); test `// The caller owns the "first document" findOne({}) would return — the worst case.` (WHY of the fixture). No other comments touched. Issue ref kept only in the `describe` title, matching the file's `(issue #121)` idiom |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`:
1. `npx jest src/__tests__/services/baseSoftDelete.test.ts src/__tests__/services/baseUpdatePatchSoftDelete.test.ts`
2. `npm test`; baseline: `git stash` → `npm test` → `git stash pop`
3. `npm run build`
4. `npm run lint`; plus `npx eslint src/services/index.ts src/__tests__/services/baseSoftDelete.test.ts` after and on the stash

## Output
1. ```
  delete/restore with an id QuerySafe drops (issue #381)
    ✓ baseDeleteDocument answers 404 for "a$b" instead of acting on the first document (1 ms)
    ✓ baseDeleteDocument answers 404 for "   " instead of acting on the first document
    ✓ baseRestoreDocument answers 404 for "a$b" instead of acting on the first document
    ✓ baseRestoreDocument answers 404 for "   " instead of acting on the first document
Tests:       17 passed, 17 total
```
2. After diff (`grep -E "✕|^Test Suites:|^Tests:"`):
```
    ✕ falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default) (10 ms)
    ✕ renders a real PDF whose extracted text passes the full ATS check suite (12 ms)
    ✕ reports keyword coverage against a sample job description (7 ms)
    ✕ round-trips the en ATS PDF through the PDF CV import parser (2 ms)
    ✕ round-trips the vi ATS PDF through the PDF CV import parser (2 ms)
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 576 passed, 581 total
```
   Baseline (staging, diff stashed; `grep -E "✕|^Tests:|^Test Suites:|^FAIL"`):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
    ✕ falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default) (12 ms)
FAIL src/__tests__/services/atsPdfIntegration.test.ts
    ✕ renders a real PDF whose extracted text passes the full ATS check suite (12 ms)
    ✕ reports keyword coverage against a sample job description
    ✕ round-trips the en ATS PDF through the PDF CV import parser
    ✕ round-trips the vi ATS PDF through the PDF CV import parser (1 ms)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 572 passed, 577 total
```
   Pre-existing env-only failures (local `TOKEN_EXP_IN` set → `Expected: 3600 / Received: 10800`; `Could not find Chrome (ver. 127.0.6533.88)`), same as the #380 node's round-2 note.
3. `npm run build` → `BUILD_EXIT=0`
4. ```
✖ 274 problems (274 errors, 0 warnings)
```

## Seal gate
none — no outward-facing action (no commit/push/API call); `src/` diff shown to operator in chat.

## Supersedes: none
## Still open: none for #381

## Noticed, not done
- Same fail-open shape, different scope (caller's own docs only, `candidateId` stays in the query): `src/candidate_profile/project/project.service.ts:29` (`experienceId` with `$` → matches caller's first experience, so the company-link check passes) and `src/candidate_profile/application/application.service.ts:32` (`profileId` same). Not cross-tenant; separate issue if wanted.
