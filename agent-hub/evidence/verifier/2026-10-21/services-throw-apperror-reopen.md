# 2026-10-21 - services-throw-apperror (REOPEN)

- Worker: verifier (independent subagent via Agent tool)
- Node: `services-throw-apperror` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row)
- PM status: unchanged (PENDING). A REOPEN does not edit the row.

## Isolation proof
Spawned fresh via the Agent tool, task "Verify seal services-throw-apperror". The verifier bundle (manifest, SOUL, verify_seal recipe) came in the dispatch prompt. I have no implementation-session history. I graded only the implementer plan + diff notes, the node row, issue #277 and `doctrine/MEMORY.md`. I did not open the src diff or any test file.

## Reasoning
| Criterion (node row / issue #277) | Evidence in note | Verdict |
|---|---|---|
| (1) single `ErrorCode -> status` map, no caller passes a status, `SERVICE_UNAVAILABLE` 503 | `ERROR_STATUS: Record<ErrorCode, number>`; the 3 hand-passed call sites are named and removed; grep result described; `timeout.test.ts` iterates every ErrorCode | OK |
| (2) missing id -> 404 (update/delete/restore) | `baseSoftDelete.test.ts` delete+restore, `baseUpdatePatchSoftDelete.test.ts` update/patch/nonexistent | OK |
| (2) another candidate's id -> 403 `FORBIDDEN`, decision documented | tests named in both files; `## Decision` section cites API-STANDARD.md §2/§3 | OK |
| (2) `modifiedCount === 0` never says success | two new `baseSoftDelete.test.ts` tests | OK |
| (2) `withDBTimeout` -> 503, CRUD factory propagates | `timeout.test.ts` 503 test + factory propagation test | OK |
| (3) public profile unknown/private -> 404, identical body | `index.test.ts` through real errorsMiddleware; `public-pdf.test.ts` 404 + `NOT_FOUND` | OK |
| (3) candidate lookup -> 404 | `candidate.controller.test.ts` "GET /:id / GET /:email answers 404, not 400" | OK |
| (3) **ATS check** + **export** (`fnExportPDF`) not found -> 404 | Only a diff-summary claim ("`fnExportPDF` + `ats-check.ts` 'Candidate not found' -> 404"). No test named for either, and the acceptance table row (3) does not mention them | **MISSING** |
| (4) `ok()`/`created()` used by the touched controllers; envelope keys unchanged | `response.ts` keys `success, message, errors, data`; controllers listed; `errors: {}` -> `null` and error rows via errorsMiddleware disclosed in release note (same judgment as the `fix-status-codes` seal) | OK |
| Existing tests updated, not deleted | 426 -> 436, 0 removed, 8 files modified | OK |
| `npm test` / `npm run build` (MEMORY.md) | verbatim: 48/48 suites, 436/436; build `tsc && npm run copy`, 0 `error TS`. Jest exit warning disclosed as pre-existing on staging | OK |
| Lint <= baseline | per-file json vs staging, 276 = 276 | OK |
| comments per `code-comments.md` | each added/changed comment listed with form and WHY; no `(#N)`, no stacked `//` | OK |

Forbidden states: ADHOC_WORK no (node on diagram, issue #277); NO_EVIDENCE no (plan + diff notes); EDIT_UNVERIFIED no for the commands (verbatim output), but the ATS/export 404 claim has no proof; CODE_IN_HAVEN no (nothing written under haven/ by this node); DIAGRAM_DRIFT no (the row exists and stays PENDING until sealed).
Seal gate: nothing outward-facing (no commit/push).
Proportion: OK. The `generalInformation` 400 -> 409 `CONFLICT` follows from "services throw" and is in the release note. `CLAUDE.md` gets one row and one paragraph. Out-of-scope items are listed under "Noticed, not done".

## REOPEN reasons
1. Node criterion (3) names "ATS check / export ... not found -> 404" and the row requires "new tests per row". The note gives no test or output for `POST /api/v1/cv/ats-check` or `GET /api/v1/download-pdf` answering 404 for a missing candidate. To fix: add (or name an existing) test for each that asserts 404 `NOT_FOUND`, list it in the acceptance table row (3), and paste the `npm test` output again.

## Re-run
none. I audited the note only. The note is not broken, and the node is not a release gate.
