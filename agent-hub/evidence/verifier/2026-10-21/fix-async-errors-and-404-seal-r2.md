# 2026-10-21 - fix-async-errors-and-404 (SEAL, round 2)
- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `fix-async-errors-and-404` in `haven/diagrams/dev-loop.prime-mermaid.md`
- New PM status: SEALED (row updated in place)
- Answers: round-1 `fix-async-errors-and-404-reopen.md` (5 missing items)

## Isolation proof
This round continues the spawn described "Verify seal fix-async-errors-and-404". It was resumed via SendMessage for `/todo #274` round 2 and still has no implementation history. Only these notes were read: implementer `-plan.md`, `-diff.md` and `-diff-r2.md`. The diff was not opened.

## Reasoning
| # | Criterion | Evidence (r2 note unless stated) |
|---|---|---|
| 1 | asyncHandler wraps every async handler + router-level verifyToken, one approach | Verbatim greps. The only single-line unwrapped hit is `router.use(authLimiter)` (rate-limit middleware, not a route handler). The only bare multi-line arg hit is an import-list line. All 13 `verifyToken`/`verifyTokenByQuery` mounts are `asyncHandler(...)`. There is no `express-async-errors` dependency. |
| 2 | unhandledRejection logged via Winston | Verbatim `src/server.ts:28-30` shows `process.on('unhandledRejection', …)` calling `logger.error` from `@/logger`. |
| 3 | notFoundHandler mounted once after the router and before errorsMiddleware, for all methods; catch-alls gone; error keys unchanged | `server.ts:90-92` shows the order router → notFoundHandler → errorsMiddleware. The test matrix covers GET/POST/PUT/DELETE on 3 paths and asserts 404, `NOT_FOUND` and the exact key set. The keys clause is resolved by a recorded decision that quotes issue #274: errorsMiddleware's contract is unchanged and the envelope change belongs to phase 5. The dropped `data:null` is disclosed. |
| 4 | Landing-page decision recorded | Recorded in the round-1 Decision section and a code comment. Tests cover both "GET / landing" and "unknown non-API GET → 404". |
| 5 | Rejecting service gives JSON 500 with no unhandled rejection; test/build green; lint ≤ 276 | The asyncErrors case passes, and the round-1 mutation fails as it should. `npm test` gives 405/405, exit 0. The verbatim `npm run build` tail shows tsc silent, exit 0. `npm run lint` shows 276 problems before (stashed) and 276 after. |
| - | Comments per code-comments.md | The row lists every added comment: one JSDoc on an exported API, plus why-only `//` notes. No issue refs and no stacked `//`. The round-1 count discrepancy is reconciled. |
| - | Forbidden states | None hit. The node is on the diagram, the notes exist, no code is in haven, and the diagram is updated by this seal. |
| - | Seal gate | Nothing outward-facing was done. The local stash/pop only took the lint baseline and restored 23 paths. |
| - | Proportion | Round 2 added only a test assertion. The unwrapped async rate limiters are correctly left out of scope and noted for phase 4. |

## Re-run
none. Round 2 supplies verbatim output for every criterion, using the commands in doctrine/MEMORY.md. The node is not outward-facing and is not a /release gate.
