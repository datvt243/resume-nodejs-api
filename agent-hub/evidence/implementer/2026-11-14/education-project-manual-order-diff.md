# 2026-11-14 - education-project-manual-order (diff)

- Worker: implementer · Version: 0.1.0
- Node: `education-project-manual-order` (PENDING) in `haven/diagrams/dev-loop.prime-mermaid.md`
- Plan: `evidence/implementer/2026-11-14/education-project-manual-order-plan.md`
- Task (verbatim): "#413 Education / Project: store a manual display order used by the CV"
- Issue: https://github.com/datvt243/resume-nodejs-api/issues/413 · branch `413-education-project-store`
- Status: sealed_pending_verifier

## Hub bytes before: 96180
## Feature doc: doctrine/features/cv-section-crud.md (rules 13–16 + 15a, "Manual display order"; written by the analyst this session, not edited by the implementer)

## Changes
| File | Change |
|---|---|
| `src/models/education.model.ts`, `src/models/project.model.ts` | `order: { type: Number }` — no default, so entries have no `order` until a reorder (rule 13) |
| `src/candidate_profile/education/education.validate.ts`, `src/candidate_profile/project/project.validate.ts` | `order: Joi.any().strip()` — accepted and dropped on create/update/bulk (rule 15a; bulk uses the same schema via `fnBulkCreate`) |
| `src/services/index.ts` | `CrudDocument.order?`; `MANUALLY_ORDERED_COLLECTIONS` (`educations`, `projects`); `byManualOrder` comparator (order asc, missing order last, then `startDate` desc; ties → `startDate` desc); `baseFindDocument` `manualOrder` option (no `sort` → in-memory sort, paging in memory when `limit` given, `shortcut:` comment); `baseReorderDocuments` (QuerySafe candidate filter + `deletedAt: null`; unknown/foreign/deleted id → `ValidationError` at `ids.<i>`; incomplete list → `ValidationError` at `ids`; nothing written on error; `order = i`) |
| `src/candidate_profile/BaseController.ts` | `baseGetAll` passes `manualOrder` for educations/projects (explicit `?sort` still wins, rule 2); new `baseReorder` (404 for any collection outside the set; Joi `ids` array, min 1, unique, 24-hex; userID from `req.user._id`) |
| `src/routers/api/v1/education.route.ts`, `src/routers/api/v1/project.route.ts` | `PUT /reorder` + `@swagger` block; experience router untouched (rule 16) |
| `src/candidate_me/index.ts` | `handlerGetAboutMe` sorts `educations`/`projects` with `byManualOrder` after `?profile=` filtering — one aggregation feeds public profile, public PDF, owner export (pdf/json/docx) and ATS check (rule 15) |
| `src/locales/en.ts`, `src/locales/vi.ts` | `common.reorderSuccess` / `reorderEntryNotFound` / `reorderIncomplete` |
| `src/config/swagger.config.ts` | Education/Project schema `order` (readOnly integer) |
| `.claude/rules/api.md`, `.claude/rules/models.md` | reorder route + `order` field documented |
| `src/__tests__/services/manualOrder.test.ts` (new, 17 tests) | comparator, `baseFindDocument` manualOrder (no limit / paged / explicit sort wins), `baseReorderDocuments` (writes `order=i`, foreign id → `ids.0` no write, incomplete → `ids` no write), `baseReorder` (experience 404; empty/non-array/duplicate/non-ObjectId → 400), routers (`PUT /reorder` on education + project, not experience), schemas strip `order` |
| `src/__tests__/candidate_me/manualOrder.test.ts` (new, 1 test) | `handlerGetAboutMe` orders educations/projects, leaves experiences in stored order |

## Commands + output (copied from `doctrine/MEMORY.md`, run from repo root)
1. `npx jest src/__tests__/services/manualOrder.test.ts src/__tests__/candidate_me/manualOrder.test.ts`
```
    ✓ sorts educations and projects by order, then startDate desc, and leaves experiences alone (5 ms)
    ✓ puts ordered entries first ascending, then the rest by startDate newest first (3 ms)
    ✓ breaks a tie on order by startDate newest first
    ✓ treats a null order (never reordered) like a missing one
    ✓ without limit, returns every entry in display order (1 ms)
    ✓ with limit, pages over the display order and counts every entry
    ✓ an explicit sort still wins (1 ms)
    ✓ stores position i as order = i, scoped to the caller's non-deleted entries
    ✓ rejects an id that is not one of the caller's entries at ids.<i>, writing nothing (1 ms)
    ✓ rejects a list missing one of the caller's entries on ids, writing nothing
    ✓ answers 404 for experience, which has no manual order (10 ms)
    ✓ answers 400 for an empty ids list (2 ms)
    ✓ answers 400 for an not an array ids list
    ✓ answers 400 for an duplicate ids list (1 ms)
    ✓ answers 400 for an not an ObjectId ids list
    ✓ exist for education and project only (1 ms)
    ✓ education schema strips order without an error
    ✓ project schema strips order without an error (1 ms)
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```
2. `npm test` with diff:
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 66 passed, 68 total
Tests:       5 failed, 687 passed, 692 total
```
   Failing: `tokenExpiry.test.ts` (1 — `Expected: 3600` / `Received: 10800`) and `atsPdfIntegration.test.ts` (4 — `Could not find Chrome (ver. 127.0.6533.88)`).
   `npm test` on base (`git stash push -u -- src`, no diff):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 64 passed, 66 total
Tests:       5 failed, 669 passed, 674 total
```
   → same 5 env-only failures pre-exist (identical to `job-applications-validate-diff.md`); diff adds +18 tests, all passing; 0 new failures.
3. `npm run build` → exit=0 (`tsc && npm run copy`, last line `cp -R ./src/public ./dist/`). Typecheck row = inside Build.
4. `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)` (= baseline 274). Per-file error counts (`npx eslint -f json .`, `errorCount` per file) diffed against base (`git stash push -u -- src`): **identical** — no new error in any file, new test files have 0.
5. Regression: `npx jest src/__tests__/services/createPDF.ats.test.ts src/__tests__/candidate_me/index.test.ts` → `Test Suites: 2 passed, 2 total` / `Tests: 77 passed, 77 total` (both files unchanged).

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. `npm test` passes incl. new tests for rules 14+15 | Output 1 (18/18) + Output 2 (only the 5 base env failures) |
| 2. reorder [B, A] → 200; public profile educations B, A (projects too) | `✓ stores position i as order = i` (B→0, A→1) + `✓ sorts educations and projects by order…` (`handlerGetAboutMe` = `GET /api/me/:id`); `baseReorder` answers `ok(res, null, …)` = 200 |
| 3. foreign project id → 400, `ids.0`, nothing written | `✓ rejects an id that is not one of the caller's entries at ids.<i>, writing nothing` (`statusCode: 400`, `errors: [{ field: 'ids.0' }]`, `updateOne` not called); candidate filter from `req.user._id`, never the body |
| 4. `download-pdf?format=json` same order as public profile | same `handlerGetAboutMe` call (`fnExportPDF` → `handlerGetAboutMe`, `src/candidate_me/index.ts`); sort happens inside it — covered by the aboutMe test |
| 5. no `PUT /experience/reorder` | `✓ exist for education and project only` (experience router has no `/reorder` layer → Express 404) + `✓ answers 404 for experience` |
| 6. A,B,C + `{ids:[B,A]}` → 400, nothing written | `✓ rejects a list missing one of the caller's entries on ids, writing nothing` |
| 7. owner `GET` (no `?sort`) returns B, A | `baseGetAll` passes `manualOrder` → `✓ without limit, returns every entry in display order` / `✓ with limit, pages over…`; `✓ an explicit sort still wins` |
| 8. update with `order: 5` → 200, `order` unchanged | `✓ education/project schema strips order without an error`; `baseUpdateDocument` → `updateOne({_id}, value)` = `$set` of given keys only, so stored `order` is untouched |
| 9. createPDF.ats + candidate_me/index tests pass unchanged | Output 5 |
| 10. build, lint, comments | Output 3, Output 4; comments: one-line `//` WHY notes + JSDoc on exported `byManualOrder`/`MANUALLY_ORDERED_COLLECTIONS`/`baseReorderDocuments`, no issue refs, one `shortcut:` limit comment |

Proof level: handler/service-level with fake models (no `supertest` in the repo, same level as `job-applications-validate`); no live server/Mongo run.

## Supersedes: none
## Still open: none (no other diagram row cites #413)

## Noticed, not done
- Reorder writes are N `updateOne` calls in parallel, not a transaction: a DB failure mid-way can leave a mix of old and new `order` values (ownership + completeness are checked before any write, so only a DB error can cause this). The next successful reorder repairs it.
- Frontend (datvt243/resume-vuejs-website) must call `PUT /<section>/reorder` with the full list; not checked here.

## Seal gate: none (no commit/push/external call — `/ship` handles it)
