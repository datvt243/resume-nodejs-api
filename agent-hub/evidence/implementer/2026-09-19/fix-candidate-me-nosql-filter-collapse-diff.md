# 2026-09-19 — fix-candidate-me-nosql-filter-collapse (diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-candidate-me-nosql-filter-collapse`
- Task: see `fix-candidate-me-nosql-filter-collapse-plan.md`

## Diff
| File | Why |
|---|---|
| `src/candidate_me/index.ts` | `handlerGetAboutMe` (slug + email lookup) and `handlerRecordVisit` (email lookup) now check the sanitized query actually retained the field key before querying `Candidate.findOne` — a rejected identifier fails closed instead of falling through to an unfiltered `findOne({})`. |
| `src/__tests__/candidate_me/index.test.ts` (new) | Regression coverage: a `$`-containing identifier must never reach `Candidate.findOne`/`Visit.create`; a valid identifier still queries normally (no behavior change for the legitimate path). |

## Command
```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, per `doctrine/MEMORY.md`)

## Output
```
Test Suites: 18 passed, 18 total
Tests:       95 passed, 95 total
Snapshots:   0 total
Time:        9.774 s
Ran all test suites.
```
Also ran `npm run build` — `tsc && npm run copy` completed with no errors
or warnings.

## Acceptance
| Criterion | Evidence |
|---|---|
| A `$`-containing identifier never reaches an unfiltered `Candidate.findOne` | `src/__tests__/candidate_me/index.test.ts` — "fails closed and never queries the DB when the identifier is rejected by QuerySafe" — PASS |
| Same fail-closed behavior for `handlerRecordVisit` | `src/__tests__/candidate_me/index.test.ts` — "fails closed and never queries the DB when the email is rejected by QuerySafe" — PASS, also asserts `Visit.create` not called |
| Legitimate identifiers are unaffected | `src/__tests__/candidate_me/index.test.ts` — "still looks up a valid identifier normally (regression check)" — PASS, `Candidate.findOne` called twice (slug attempt, email fallback) exactly as before the fix |
| No regression elsewhere | `npm test` — `Tests: 95 passed, 95 total` (was 92 before this node's 3 new tests) |
| Typecheck/build clean | `npm run build` — `tsc && npm run copy`, no errors |

## Noticed, not done
- `src/candidate/candidate.service.ts:48` (`handlerGetInformationByEmail`,
  backing the authenticated `GET /api/v1/candidate/:email`) has the exact
  same bug class — `candidateQuerySafe.safeQuery({}, { email })` with no
  key-survived check. Out of scope for this node (different file/route);
  flagged for its own node if picked up.
- `idQuerySafe.safeQuery({}, { _id })` at `candidate_me/index.ts:196`
  (`fnExportPDF`) and `{ candidateId: _id?.toString() }` at line 93 were
  deliberately left untouched — both are sourced from a verified JWT
  `req.user._id` / the already-fetched candidate's own ObjectId, not raw
  user input, so not exploitable the same way.
- `QuerySafe.safeQuery`'s silent-drop-on-reject behavior itself (root
  cause) was not changed — several other call sites across the codebase
  rely on the current "drop the field, don't throw" contract; hardening
  the class itself would be a bigger blast radius than this node's scope
  and needs its own audit of every caller.

## Seal gate
None — no outward-facing action in this pass (no commit/push/publish;
working tree changes only, on branch `135-fix-nosql-filter-collapse`).
