# 2026-10-21 - fix-async-errors-and-404 (REOPEN)
- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `fix-async-errors-and-404` in `haven/diagrams/dev-loop.prime-mermaid.md`
- New PM status: PENDING (unchanged; REOPEN does not touch the row)

## Isolation proof
Agent-tool description "Verify seal fix-async-errors-and-404", dispatched by `/todo #274` round 2 from the main session. This subagent has no implementation history. Only the evidence notes were read; the diff was not opened.

## Reasoning
| # | Criterion | Finding |
|---|---|---|
| 1 | asyncHandler wraps every async handler + router-level `verifyToken` | Not proven. The grep is described ("leaves only multi-line openers") but its output is not pasted. Nothing shows `verifyToken`/`verifyTokenByQuery` wrapped. |
| 2 | `unhandledRejection` logged via Winston | Not proven. The only citation is "`src/server.ts` diff": no excerpt, no test. |
| 3 | notFoundHandler once, all methods; 3 catch-alls gone; **error body keys unchanged** | The all-methods part is proven by the asyncErrors.test 404 matrix. The body-keys clause is contradicted by the note's own "Noticed, not done": the 404 body went from `{success,message,errors:null,data:null}` to `{success,errorCode,message,errors?}`. Nothing proves the clause, and no decision explains why it does not apply. |
| 4 | Landing-page decision recorded | Proven (the Decision line in both notes, plus the cited code comment). |
| 5 | Rejecting service gives JSON 500 with no unhandled rejection; unknown /api/... gives 404 under each method; test/build green; lint ≤ 276 | Tests are proven: 405/405 in run 2, asyncErrors 7/7, and the mutation fails as expected. The build is only paraphrased ("exit 0, 0 error TS"), with no output lines. Lint was counted with `npx eslint . -f json`, not the doctrine command `npm run lint`. |
| - | Comments per code-comments.md | The row is present and cites no violation. It says "4 added" but lists 5, which is minor. |
| - | Forbidden states | None hit. The node is on the diagram, the notes exist, and no code is in haven. DIAGRAM_DRIFT is not applicable while the node is PENDING. |
| - | Seal gate | Nothing outward-facing was done (no commit or push). |
| - | Proportion | The changes match the node scope. |

## Missing
1. Criterion 3, "error body keys unchanged": paste evidence that the 404/500 body keys match the pre-change contract. If they don't match, either restore `data: null` / the key set, or record an explicit decision that the clause means "errorsMiddleware's own shape unchanged". That decision must come with a test asserting the exact 404 body keys.
2. Criterion 1: paste the verbatim output of a grep showing every async route handler wrapped. Also show that the router-level `verifyToken`/`verifyTokenByQuery` mounts are wrapped (grep lines).
3. Criterion 2: paste a verbatim `src/server.ts` excerpt of the `process.on('unhandledRejection')` → Winston logger call, or a test that proves it.
4. Build: paste the verbatim tail of the `npm run build` output, not a paraphrase.
5. Lint: report the count from `npm run lint` (the doctrine/MEMORY.md command), before and after.

## Re-run
none. Per recipe, missing or paraphrased citations lead to REOPEN rather than an independent re-run.
