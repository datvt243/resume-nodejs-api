# 2026-10-31 - fix-lastname-min-length (verdict: REOPEN)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-lastname-min-length` (#333)
- Graded: `evidence/implementer/2026-10-31/fix-lastname-min-length-diff.md`
- New PM status: PENDING (unchanged; REOPEN does not touch the row)

## Isolation proof
Spawned fresh via the Agent tool, description "Verify seal fix-lastname-min-length", subagent_type general-purpose. No implementation history in this context; the diff was not written here.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | `lastName` `min(1)`, `max(35)` kept | Diff table: `src/config/joi.config.ts:52` `.min(3)` → `.min(1)`, `max(35)` kept | Covered |
| 2 | Test: `An`/`Vy`/`Hà`/`Tú`/`Nguyễn` pass, `''` rejected | `PASS src/__tests__/config/joi.config.test.ts`; `Tests: 5 failed, 478 passed, 483 total` vs base `5 failed, 472 passed, 477 total` (+6 = 5 `it.each` + 1) | Covered |
| 3 | `npm test` + `npm run build` green | `build exit=0`; the same 5 failures on base and with the diff (`tokenExpiry` reads local `.env` `TOKEN_EXP_IN`; ATS integration has no Chrome). Same pre-existing local-env causes accepted in earlier seals (e.g. `enforce-https`) | Covered |
| 4 | Lint adds zero new problems | `✖ 274 problems` base → `✖ 274 problems` with diff; 0 errors in the new test file | Covered |
| — | Comments per code-comments.md | Note's row: "Only comment added is the test file's header docblock (cites #333 + the why)". The comment is confirmed at `src/__tests__/config/joi.config.test.ts:2`: `Tests for joi.config.ts (issue #333)`. code-comments.md **Delete** list: "Issue/PR refs like `(#121)`, `(issue #N)` ... lives in git log/PR, not the source." Test files are in scope: the only test exclusion is the off-by-default File-header opt-in. Earlier seals hold tests to the same rule (`add-security-headers`, `fix-create-returns-created-doc` removed `(#157)` refs from a test). Copying `cors.config.test.ts` is not an exemption, because that file predates the standard. Enforcement: "that row ... citing a rule violation → REOPEN." | **Violation** |

- Commands match `doctrine/MEMORY.md` (`npm test`, `npm run build`, `npm run lint`, run from the repo root). The output is excerpted summary lines with no `...` or "truncated" markers, and is enough for every criterion.
- 6b: `## Supersedes: none` / `## Still open: none` present. No other open row cites #333.
- Forbidden states (5): none hit. Node exists (diagram line 95), there is evidence, there is no code in `haven/`, the PM status was not touched by the implementer, and the diff was not self-graded.
- Seal gate: no outward action. Recorded "none".
- Proportion: 1-line source change + 1 test file. Matches the node (`SmallestDiff`).

## Missing
- Comments row: drop the `(issue #333)` issue ref from the header docblock in `src/__tests__/config/joi.config.test.ts`. Keep only the WHY (given names can be 1–2 chars, e.g. `An`, `Vy`). Re-run `npx jest src/__tests__/config/joi.config.test.ts` + `npm run lint` and cite the result. Nothing else needs to change.

## Re-run
none — audit-only (default). No exception case applies. The only non-note read was a read-only `grep` that confirmed the `#333` header comment line the note itself describes.
