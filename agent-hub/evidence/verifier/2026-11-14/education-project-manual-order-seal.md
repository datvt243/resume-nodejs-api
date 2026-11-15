# 2026-11-14 - education-project-manual-order (verdict: SEAL)

- Worker: verifier · Version: 0.1.0 · Action: verify_seal
- Node: `education-project-manual-order` (was PENDING) in `haven/diagrams/dev-loop.prime-mermaid.md`
- Notes audited: `evidence/implementer/2026-11-14/education-project-manual-order-plan.md`, `evidence/implementer/2026-11-14/education-project-manual-order-diff.md`
- Issue #413 · branch `413-education-project-store` (uncommitted working tree)
- Feature doc: `doctrine/features/cv-section-crud.md`, "Manual display order" rules 13–16 + 15a, #413 acceptance criteria

## Verdict: SEAL

## Isolation proof
Fresh Agent-tool spawn (`spawn=fresh`). Dispatched with the task string "You are the agent-hub **verifier** worker ... run `verify_seal` (fresh spawn ...) on: Node `education-project-manual-order`" — not the implementer's task string ("#413 Education / Project: store a manual display order used by the CV"). This context holds no implementer reasoning; it did not write the diff.

## Re-run: full
Reason: the operator's dispatch for this spawn explicitly required re-running the doctrine commands rather than an audit-only pass. Re-ran from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, commands copied from `doctrine/MEMORY.md`: `npx jest <file>` (new + regression files), `npm test`, `npm run build`, `npm run lint`, and a per-file eslint base-vs-diff comparison (`git show HEAD:<f> | npx eslint --stdin`). The diff itself was not opened (`EvidenceOnly`); code reads were limited to existing call sites (`grep handlerGetAboutMe`, `grep updateOne src/services/index.ts`).

## Re-run output (verbatim tails)
1. `npx jest src/__tests__/services/manualOrder.test.ts src/__tests__/candidate_me/manualOrder.test.ts` → `Test Suites: 2 passed, 2 total` / `Tests: 18 passed, 18 total` (same 18 test names as the note).
2. `npx jest src/__tests__/services/createPDF.ats.test.ts src/__tests__/candidate_me/index.test.ts` → `Test Suites: 2 passed, 2 total` / `Tests: 77 passed, 77 total`. Neither file is in `git status` (unchanged).
3. `npm test` → `Test Suites: 2 failed, 66 passed, 68 total` / `Tests: 5 failed, 687 passed, 692 total`. Failures: `auth/tokenExpiry.test.ts` ×1 (`Expected: 3600` / `Received: 10800`, local `TOKEN_EXP_IN`) and `services/atsPdfIntegration.test.ts` ×4 (`Could not find Chrome (ver. 127.0.6533.88)`). Identical to the note and to the pre-existing env-only set accepted by `job-applications-validate-seal.md`; neither file touched.
4. `npm run build` → exit 0, last line `cp -R ./src/public ./dist/` (Typecheck = inside Build).
5. `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)` = baseline 274.
6. Per-file eslint errorCount, HEAD vs working tree, every changed `src/` file: index.ts 29/29, BaseController.ts 31/31, education.validate.ts 1/1, project.validate.ts 1/1, education.route.ts 1/1, project.route.ts 1/1, services/index.ts 2/2, models/locales/swagger 0/0; both new test files 0 → no new lint error in any changed file.

## Acceptance criteria
| # | Criterion (feature doc #413) | Evidence | Result |
|---|---|---|---|
| 1 | `npm test` passes incl. new tests for rules 14+15 | Re-run 1 (18/18: reorder writes `order=i`, foreign/deleted → `ids.<i>` no write, sort incl. no-`order` entries) + Re-run 3 (0 new failures, 5 pre-existing env-only) | Covered |
| 2 | reorder `[B, A]` → 200; `GET /api/me/<slug>` educations B, A (projects too) | `✓ stores position i as order = i…` + `✓ sorts educations and projects by order, then startDate desc…` on `handlerGetAboutMe` | Covered (handler-level, same proof level as prior seals; no supertest) |
| 3 | foreign project id → 400, `ids.0`, nothing written | `✓ rejects an id that is not one of the caller's entries at ids.<i>, writing nothing` | Covered |
| 4 | `download-pdf?format=json` same order as public profile | `grep`: `src/candidate_me/index.ts:368` (`fnExportPDF`) and public routes both call `handlerGetAboutMe`, where the sort lives | Covered |
| 5 | no `PUT /experience/reorder` (404) | `✓ exist for education and project only`, `✓ answers 404 for experience…` | Covered |
| 6 | A, B, C + `{ids:[B,A]}` → 400, nothing written | `✓ rejects a list missing one of the caller's entries on ids, writing nothing` | Covered |
| 7 | owner `GET /education` (no `?sort`) → B, A | `✓ without limit…`, `✓ with limit…`, `✓ an explicit sort still wins` | Covered |
| 8 | update with `order: 5` → 200, stored `order` unchanged | `✓ education/project schema strips order without an error`; update path `src/services/index.ts:285` `updateOne({_id}, _valueUpdate)` sets only given keys | Covered |
| 9 | createPDF.ats + candidate_me/index tests pass unchanged | Re-run 2 | Covered |
| 10 | build, lint ≤ 274 none in changed files | Re-run 4, 5, 6 | Covered |
| — | comments per code-comments.md | Note's Acceptance row 10 cites the touched comments (one-line `//` WHY, JSDoc on exports, one `shortcut:`, no issue refs); no violation cited | Covered |

Feature doc (step 6b): `## Feature doc` line present; doc not edited by the implementer (analyst-written, Q1–Q4 answered by operator 2026-11-14) → no `## Feature doc changed` needed. `## Supersedes: none` / `## Still open: none` present; no other active row cites #413.

## Doctrine proposal: none

## Forbidden states scan
`EDIT_UNVERIFIED`: no — commands match MEMORY, typecheck via build, lint count cited. `NO_EVIDENCE`: no — every criterion cited. `DIAGRAM_DRIFT`: no — PENDING → SEALED. `CODE_IN_HAVEN`: no. `ADHOC_WORK`: no — node on the active diagram.

## Seal gate: n/a (no commit/push/external call; `/ship` handles it)

## Proportionality
Files in the note's Changes table all map to rules 13–16/15a (models, validate strip, service + controller, routes, aggregation sort, locales, swagger, `.claude/rules` docs, tests). Experience untouched. No scope creep.

## Ratchet / collapse (step 11)
- Full row appended (SEALED) to `haven/diagrams/dev-loop-archive.md`; active row → pointer.
- Pointer rows exceeded 20 → oldest (`public-profile-field-whitelist`, full row already archived) deleted.
- 11e: `cv-section-crud.md` Status was already `verified` (operator 2026-11-07); only its #413 section was draft → section heading, `Issues:` line and INDEX row now read "verified by" this note. Status line left as is.

## Noted risk (not a REOPEN reason)
Reorder writes are N parallel `updateOne`s, not a transaction (note's "Noticed, not done"); a mid-way DB error can leave mixed `order` values until the next reorder.
