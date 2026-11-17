# 2026-11-15 - job-applications-status-transitions (diff)

- Worker: implementer · Version: 0.1.0
- Node: `job-applications-status-transitions` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING — state not touched by implementer)
- Branch: `410-job-applications-add` (from `staging` @ 879202c)
- Task (verbatim): "#410 Job applications: add `accepted` status and enforce status transitions" + issue body (see plan)
- Plan: `evidence/implementer/2026-11-15/job-applications-status-transitions-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 97385

## Feature doc: doctrine/features/job-applications.md
## Feature doc changed: Behavior #2 status list adds `accepted`; new Behavior #5 (transition rules); acceptance criterion added for 400/OK transitions; `## Changelog` row 2026-11-15 — operator answer to Open question 2 (2026-11-07, revised after research), #410

## Diff
| File | Why |
|---|---|
| `src/models/application.model.ts:10` | `APPLICATION_STATUSES` adds `accepted` (model enum + Joi `valid(...)` share it) |
| `src/candidate_profile/application/application.service.ts` | `OPEN_STATUS_RANK`, exported pure `isStatusTransitionAllowed(from,to)`, `checkStatusTransition` (reads stored status via `idQuerySafe` `_id`+`candidateId`, `deletedAt: null`, wrapped in `withDBTimeout`; missing/foreign/deleted → skip so base update keeps its 404/403); `handlerUpdate` runs it before `checkProfileLink`. Create unchanged (any status) |
| `src/locales/{en,vi}.ts:106` | `application.statusTransitionInvalid` (en + vi) |
| `src/config/swagger.config.ts:287` | Application `status` enum + transition description |
| `.claude/rules/models.md:26` | Application status list + rule (path-scoped doc kept in sync) |
| `src/__tests__/candidate_profile/application.service.test.ts` | mocks `@/models/application.model` (`findOne`, real `APPLICATION_STATUSES`) + `@/utils/timeout` passthrough; new blocks `isStatusTransitionAllowed` (10 allow / 9 reject), `schemaApplication status` (5 statuses on create), `application.service status transitions` (create skips lookup; scoped lookup query; 400 en/vi writes nothing; no status skips; missing doc → base update) |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, verbatim from `doctrine/MEMORY.md`:
1. `npx jest src/__tests__/candidate_profile/application.service.test.ts` (Test one file)
2. `npm test` (Test)
3. `npm run build` (Typecheck = inside Build)
4. `npm run lint` (Lint, baseline 274) + `npx eslint <changed src files>`
5. Lint baseline: `git stash push -- src` → `npm run lint` → `git stash pop`

## Output (final run, after review fixes)
1. Test one file:
```
Tests:       55 passed, 55 total
```
   (first run before the profile-link `beforeEach` stub: `Tests: 1 failed, 54 passed, 55 total` — `TypeError: Cannot read properties of undefined (reading 'select')` in "rejects a foreign, deleted or missing profile with 400 on update" — the existing update test now reaches `findOne`; fixed by `mockCurrentStatus('applied')` in that block's `beforeEach`. Second run after adding `withDBTimeout`: `55 passed` but `Jest did not exit one second after the test run has completed.` — fixed by the `@/utils/timeout` passthrough mock; base file on `staging` showed `Tests: 25 passed, 25 total` with no warning.)
2. `npm test`:
```
Test Suites: 71 passed, 71 total
Tests:       773 passed, 773 total
```
3. `npm run build`: `build exit=0`
4. `npm run lint`: `✖ 274 problems (274 errors, 0 warnings)`; `npx eslint` on `application.service.ts` + test file → exit 0 (earlier run on all 6 changed src files: no output)
5. Base (`git stash push -- src`): `✖ 274 problems (274 errors, 0 warnings)` → 0 new

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. `accepted` valid | `✓ accepts "accepted" on create` (Joi uses `APPLICATION_STATUSES`, also the Mongoose enum) |
| 2. create any status | `✓ accepts "<each of 5>" on create`, `✓ creates at any status without reading the stored one` |
| 3. update transitions | `✓ allows applied → applied/interview/offer, interview → offer, offer → accepted, applied/interview/offer → rejected, accepted → accepted, rejected → rejected`; `✓ rejects interview → applied, offer → applied, offer → interview, applied → accepted, interview → accepted, accepted → rejected, accepted → offer, rejected → applied, rejected → accepted`; `✓ answers 400 for offer → applied (en)` / `rejected → applied (vi)` with exact messages, `mockCrudUpdate` not called |
| 4. no status / missing doc → base behavior | `✓ skips the check when the update has no status`, `✓ leaves a missing, deleted or foreign id to the base update (404/403)`, `✓ reads the current status scoped to the caller and non-deleted rows` (query `{ _id, candidateId, deletedAt: null }`) |
| 5. tests + typecheck | one file 55/55; `npm test` 773/773; build exit 0 |
| 6. lint | 274 = base 274; changed files clean |
| 7. Swagger + models.md in sync | diff rows above |
| 8. comments per code-comments.md | JSDoc on exported `isStatusTransitionAllowed`; `/** */` WHY on `checkStatusTransition` (skip → base 404/403); one `// shortcut:` line (known limit + upgrade path); test `//` WHY on timeout mock. No issue refs, no restating |

## Review
`/code-review medium` (forked skill) — 7 findings:
1. `findOne` outside `withDBTimeout` → **fixed** (wrapped, `.exec()`), checks re-run (Output above).
2. Read-then-write race can bypass final states → **kept as recorded shortcut**: requires two concurrent requests by the same owner on their own row; not a trust boundary (ownership still enforced by base update). `// shortcut:` names the upgrade (conditional `updateOne`).
3. Document fetched twice per update (pre-read + `baseCheckDocumentById`) → efficiency; Noticed, not done.
4. "no status" branch unreachable via controller (`status` is Joi `required`) → kept: the `typeof` guard also narrows `unknown` for TS, and the service is callable directly; not a correctness issue.
5. Stored status outside the rank map locked forever → false positive in practice: the Mongoose enum rejects unknown values on every write, and pre-#410 rows only hold the 4 old statuses (all handled). Noticed.
6. Final states can't be undone → false positive: explicit operator decision in #410 ("Accepted for now; delete + re-create is the workaround").
7. Enforce in a `baseUpdateDocument` hook instead → shared-layer refactor, out of scope (SmallestDiff). Noticed.
Not `security`-labeled → no `/security-review`.

## Supersedes: none
## Still open: none

## Noticed, not done
- `src/utils/timeout.ts` `withTimeout` never clears its timer when the promise wins the race (clearTimeout only on `signal` abort) — every wrapped DB call leaves a live 5s timer; surfaced here as Jest "did not exit". Pre-existing, shared util; candidate small node.
- Update now costs 2 reads + 1 write (review #3); a pre-update hook in `baseUpdateDocument` receiving `_existing` would remove the extra read and make the check atomic with a conditional filter (review #2/#7).
- Issue says "`accepted` (vi + en labels)": the backend stores no status labels (only the error message, done in vi + en); labels belong to the frontend follow-up datvt243/resume-vuejs-website#423.

## Seal gate: none (no commit/push/external call — `/ship` handles it)
