# 2026-10-21 - unified-error-envelope (REOPEN)

- Worker: verifier (independent subagent via Agent tool)
- Node: `unified-error-envelope` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row)
- PM status: unchanged (PENDING). A REOPEN does not edit the row.

## Isolation proof
Spawned fresh via the Agent tool, task "Verify seal unified-error-envelope". The verifier bundle (manifest, SOUL, verify_seal recipe) came in the dispatch prompt. I have no implementation-session history. I graded only the implementer plan + diff notes, the node row, `agent-hub/CLAUDE.md`, `doctrine/MEMORY.md`, `doctrine/standards/pdf-export-standard.md`, and earlier verifier notes for format and precedent. I did not open the src diff or any test file.

## Reasoning
| Criterion (node row / issue #278) | Evidence in note | Verdict |
|---|---|---|
| (1) every error -> `{ success:false, error:{ code, message, details? } }` (errorsMiddleware, handler failures, PDF/DOCX, 429) | `contract/errorEnvelope.test.ts` (12 tests, exact keys); `errors.test.ts` real HTTP incl. prod-500 exact body; `asyncErrors.test.ts` notFound; 429 RATE_LIMITED; PDF/DOCX rethrow tests + fnExportPDF -> handleError path | OK |
| (1) `details` = `{ field: fullDottedPath, message }[]`, nested Joi -> `items.3.company` | contract nested-Joi test (`items.1/2/3.company`); `valid.test.ts` nested path; Mongoose `[{ field:'birthday' }]`; bulk all-fail per-item details | OK |
| (2) lists `data: []` + `meta`, with and without `limit` | `BaseController.test.ts` both cases (exact body); `baseFindDocument.test.ts` meta values; `search.test.ts` exact body; visits in release note | OK |
| (3) remaining hardcoded vi/en messages via i18n | keys listed; `verifyToken.test.ts` `lang:'en'` asserts via `t()`; notFound/429/publicProfile messages | OK |
| (4) swagger + `API-STANDARD.md` deviations table | `ErrorResponse`/`ApiResponse`/`Pagination`, 72 paths (= staging), deviations -> "None" | OK |
| Existing tests updated, not deleted | 438 -> 454 (+16 itemized), 3 PDF/DOCX tests rewritten in place, none removed | OK |
| `npm test` / `npm run build` (MEMORY.md; Typecheck = inside build) | verbatim: 49/49 suites, 454/454; build `tsc && npm run copy`, 0 `error TS`. Jest exit warning disclosed as pre-existing | OK |
| Lint <= baseline | per-file json vs staging @ 7cc0840: 276 -> 275, no file above baseline | OK |
| comments per `code-comments.md` | each added/changed/removed comment listed with form and WHY; no `(#N)`, no stacked `//` | OK |
| **PDF/DOCX export standard** (`agent-hub/CLAUDE.md` "Touching PDF/DOCX export"; `pdf-export-standard.md` Enforcement) | Diff touches `createPDF.ts`, `createPDF.ats.ts`, `createDocx.ts` (catch blocks removed, errors rethrown). The note never mentions the standard: no per-rule confirmation and no "none of the 10 apply because ..." line. Enforcement: "A verifier seeing an export-code diff with no mention of this file should treat that as a gap, not assume compliance." Precedent: `fix-error-middleware-mapping-diff.md` line 31 states it for a catch-only `createDocx.ts` change | **MISSING** |
| Release note / release gate | `## Release note` present, names resume-vuejs-website#252 and datvt243.github.io#244; release gate recorded as not this node | OK |

Forbidden states: ADHOC_WORK no (implementer identity via `/todo #278`; node row exists on this branch. The disclosed NodeBeforeCode slip, row appended after src edits began, breaks recipe order but not the forbidden state's definition, which needs both no worker identity and no node; recorded here, not a REOPEN reason on its own). NO_EVIDENCE no (plan + diff notes). EDIT_UNVERIFIED: the mandatory PDF/DOCX-standard confirmation for an export-code diff is absent (per `agent-hub/CLAUDE.md`, missing required evidence for the diff). CODE_IN_HAVEN no (`find haven` for .ts/.js/.py/.sh: none). DIAGRAM_DRIFT no (row exists, stays PENDING until sealed).
Seal gate: nothing outward-facing (no commit/push). The API-STANDARD.md copies in other repos/wiki are correctly left to the operator.
Proportion: mostly tied to the four criteria. One item is not required by the node: `verifyToken` non-JWT failure 401 -> 500. It is in the release note, but the plan does not say why a status change belongs in this node. Justify it in round 2 (e.g. criterion (3), raw `err.message` was the response text) or split it out.

## What round 2 needs
1. A diff note (`unified-error-envelope-diff-2.md`) with a PDF/DOCX export standard line for `createPDF.ts`, `createPDF.ats.ts`, `createDocx.ts`: either confirm each of the 10 rules, or state that the change only touches the failure path (no rendering/content change) so none apply, and say why.
2. One sentence justifying the `verifyToken` 401 -> 500 change as in scope, or revert it to a separate node.
3. If src changes, re-run `npm test` + `npm run build` and paste the output verbatim. If only the note changes, say so.

## Re-run
none. Audited the notes. The commands match MEMORY.md and the output is not truncated. The gap is missing evidence, not a broken run, and the node's release gate is out of scope.
