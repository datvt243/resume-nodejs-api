# 2026-10-21 - services-throw-apperror (SEAL)

- Worker: verifier (independent subagent via Agent tool)
- Node: `services-throw-apperror` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row, updated in place)
- New PM status: SEALED (re-verify after `evidence/verifier/2026-10-21/services-throw-apperror-reopen.md`)

## Isolation proof
Spawned fresh via the Agent tool, task "Re-verify services-throw-apperror". The verifier bundle (manifest, SOUL, verify_seal recipe) came in the dispatch prompt. I have no implementation-session history and did not write the previous REOPEN. I graded only the implementer plan, round-1 and round-2 diff notes, the previous REOPEN note, the node row and `doctrine/MEMORY.md`. I did not open the src diff or any test file.

## Reasoning
| Criterion (node row / issue #277) | Evidence in note | Verdict |
|---|---|---|
| (1) single `ErrorCode -> status` map, no caller passes a status, `SERVICE_UNAVAILABLE` 503 | round 1: `ERROR_STATUS: Record<ErrorCode, number>`, 3 hand-passed sites removed, grep result, `timeout.test.ts` iterates every ErrorCode | OK |
| (2) missing id -> 404 (update/delete/restore) | round 1: `baseSoftDelete.test.ts`, `baseUpdatePatchSoftDelete.test.ts` | OK |
| (2) another candidate's id -> 403 `FORBIDDEN`, decision documented | round 1: tests in both files; `## Decision` cites API-STANDARD.md §2/§3 | OK |
| (2) `modifiedCount === 0` never says success | round 1: two new `baseSoftDelete.test.ts` tests | OK |
| (2) `withDBTimeout` -> 503, CRUD factory propagates | round 1: `timeout.test.ts` 503 + factory propagation tests | OK |
| (3) public profile / public PDF / visit not found -> 404, private == unknown | round 1 + round-2 table: `index.test.ts` through real errorsMiddleware; `public-pdf.test.ts` 404 + `NOT_FOUND`; handlerRecordVisit rejects 404 | OK |
| (3) ATS check + export not found -> 404 (the REOPEN item) | round 2: new `it.each` in `candidate_me/index.test.ts` over `fnExportPDF` and `fnAtsCheck`, `Candidate.findOne` null, through real `errorsMiddleware`, asserts 404 `{ success:false, errorCode:'NOT_FOUND' }`; note states it fails on the pre-change code (400 written directly) | OK |
| (3) candidate lookup -> 404 | `candidate.controller.test.ts` "GET /:id / GET /:email answers 404, not 400" | OK |
| (4) `ok()`/`created()` in touched controllers, envelope keys unchanged | round 1: `response.ts` keys `success, message, errors, data`; controllers listed; `errors: {}` -> `null` and errorsMiddleware bodies disclosed in release note (same judgment as `fix-status-codes` seal) | OK |
| Existing tests updated, not deleted | 426 -> 436 (round 1) -> 438 (round 2), 0 removed | OK |
| `npm test` / `npm run build` (MEMORY.md) | round 2 verbatim: 48/48 suites, 438/438; build `tsc && npm run copy`, 0 `error TS`. Jest exit warning disclosed as pre-existing on staging | OK |
| Lint <= baseline | round 2: 276 = baseline 276, no file above its count | OK |
| comments per `code-comments.md` | round 1 lists each added/changed comment with form and WHY, no `(#N)`, no stacked `//`; round 2 adds none | OK |
| Release note | round 1 `## Release note`, names both client issues | OK |

Forbidden states: ADHOC_WORK no (node on diagram, issue #277); NO_EVIDENCE no (plan + 2 diff notes); EDIT_UNVERIFIED no (verbatim test/build output in round 2, after the last change); CODE_IN_HAVEN no (`find haven` for .ts/.js/.py/.sh: none); DIAGRAM_DRIFT no (row set to SEALED in place, not moved).
Seal gate: nothing outward-facing (no commit/push).
Proportion: round 2 adds tests only, src unchanged. Round-1 scope already judged proportionate in the REOPEN; out-of-scope items listed under "Noticed, not done".

## Re-run
none. The notes are complete and cite every criterion, commands match MEMORY.md, output is not truncated, and the node is not a release gate.
