# 2026-10-21 - unified-error-envelope (SEAL)

- Worker: verifier (independent subagent via Agent tool)
- Node: `unified-error-envelope` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row, updated in place)
- New PM status: SEALED (re-verify after `evidence/verifier/2026-10-21/unified-error-envelope-reopen.md`)

## Isolation proof
Spawned fresh via the Agent tool, task "Re-verify unified-error-envelope". The verifier bundle (manifest, SOUL, verify_seal recipe) came in the dispatch prompt. I have no implementation-session history and did not write the previous REOPEN. I graded only the implementer plan, the round-1 and round-2 diff notes, the previous REOPEN note, the node row, and the earlier seal note for format. I did not open the src diff or any test file.

## Reasoning
| Criterion (node row / issue #278) | Evidence in note | Verdict |
|---|---|---|
| (1) every error -> `{ success:false, error:{ code, message, details? } }` (errorsMiddleware, handler failures, PDF/DOCX, 429) | round 1: one `sendError` writer; `contract/errorEnvelope.test.ts` (12 tests, exact keys); `errors.test.ts` real HTTP incl. prod-500 exact body; `asyncErrors.test.ts` ROUTE_NOT_FOUND; 429 RATE_LIMITED; PDF/DOCX rethrow tests -> handleError | OK |
| (1) `details` = `{ field: fullDottedPath, message }[]`, nested Joi -> `items.3.company` | round 1: contract nested-Joi test; `valid.test.ts` nested path; Mongoose `[{ field:'birthday' }]`; bulk all-fail per-item details | OK |
| (2) lists `data: []` + `meta`, with and without `limit` | round 1: `BaseController.test.ts` both cases exact body; `baseFindDocument.test.ts` meta values; `search.test.ts` exact body | OK |
| (3) remaining hardcoded vi/en messages via i18n | round 1: new keys listed and used in verifyToken/csrf/notFound/429/`candidate_me/*`; `verifyToken.test.ts` `lang:'en'` via `t()`; round 2: verifyToken last catch uses `t('auth.invalidToken')` | OK |
| (4) swagger + `API-STANDARD.md` deviations table | round 1: `ErrorResponse`/`ApiResponse`/`Pagination`, 72 paths (= staging), deviations -> "None" | OK |
| PDF/DOCX export standard (REOPEN item 1) | round 2 section 1: failure path only, `git diff -w` on the 3 export files is deletions only, `finally` browser close kept, rules 1-10 named and each about rendered/stored content so none apply; rendering tests pass unchanged; cites the `fix-error-middleware-mapping` precedent | OK |
| Proportion: verifyToken 401 -> 500 (REOPEN item 2) | round 2 section 2: status change reverted to staging's 401 `INVALID_TOKEN`; only the message changed (criterion 3, R5); test renamed in place; release-note line withdrawn | OK |
| Existing tests updated, not deleted | round 1: 438 -> 454 (+16 itemized), 3 PDF/DOCX tests rewritten in place; round 2 keeps 454 (one test changed in place) | OK |
| `npm test` / `npm run build` (MEMORY.md) after the last src change | round 2 verbatim: 49/49 suites, 454/454; build `tsc && npm run copy`, 0 `error TS`. Jest exit warning disclosed as pre-existing | OK |
| Lint <= baseline | round 2: 276 -> 275, no file above baseline | OK |
| comments per `code-comments.md` | round 1 lists each added/changed/removed comment with WHY; round 2 replaces one `//` with a single-sentence WHY; no `(#N)`, no stacked `//` | OK |
| Release note / release gate | round 1 `## Release note` names resume-vuejs-website#252 and datvt243.github.io#244; round 2 withdraws the verifyToken status line; release gate is not this node | OK |

Forbidden states: ADHOC_WORK no (node row exists, issue #278 via `/todo`; the disclosed NodeBeforeCode slip is a recipe-order issue, already recorded in the REOPEN, not the forbidden state). NO_EVIDENCE no (plan + 2 diff notes). EDIT_UNVERIFIED no (verbatim test/build output in round 2, after the last src change, and the export-standard line is now present). CODE_IN_HAVEN no (`find haven` for .ts/.js/.py/.sh: none). DIAGRAM_DRIFT no (row set to SEALED in place, not moved).
Seal gate: nothing outward-facing (no commit/push). The API-STANDARD.md copies in the other repos and the wiki are left to the operator.
Proportion: round 2 removed the one out-of-scope item. The rest maps to the four criteria, and the other items are listed under "Noticed, not done".

## Re-run
none. The notes are complete and cite every criterion. The commands match MEMORY.md and the output is not truncated. The node's release gate (client issues) is out of scope.
