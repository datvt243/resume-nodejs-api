# 2026-10-31 - fix-lastname-min-length (verdict: SEAL, round 2)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-lastname-min-length` (#333)
- Graded: `evidence/implementer/2026-10-31/fix-lastname-min-length-diff-r2.md` (builds on `evidence/implementer/2026-10-31/fix-lastname-min-length-diff.md`)
- Answers: `evidence/verifier/2026-10-31/fix-lastname-min-length-reopen.md`
- New PM status: SEALED (collapsed: full row appended to `haven/diagrams/dev-loop-archive.md`, active row replaced in place by a pointer row; oldest pointer row `fix-public-profile-deleted-entries` dropped to keep 20, its full row was already in the archive)

## Isolation proof
Spawned fresh via the Agent tool, description "Verify seal fix-lastname-min-length r2", subagent_type general-purpose. This context has no implementation history and did not write the diff. It is also not the round-1 verifier spawn ("Verify seal fix-lastname-min-length").

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | `lastName` `min(1)`, `max(35)` kept | r1 diff: `src/config/joi.config.ts:52` `.min(3)` → `.min(1)`, `max(35)` kept. r2: "file untouched since" | Covered |
| 2 | Test: `An`/`Vy`/`Hà`/`Tú`/`Nguyễn` pass, `''` rejected | r1: `PASS src/__tests__/config/joi.config.test.ts`, 477 → 483 tests (+6). r2: `Tests: 6 passed, 6 total` | Covered |
| 3 | `npm test` + `npm run build` green | r1: `build exit=0`, `Tests: 5 failed, 478 passed, 483 total`, and the same 5 failures on base (local `.env` `TOKEN_EXP_IN`, no Chrome). r2 changes only a test comment, so the type/runtime result is unchanged | Covered |
| 4 | Lint adds zero new problems | r1: 274 → 274. r2: `✖ 274 problems (274 errors, 0 warnings)`, `eslint test-file exit=0` | Covered |
| — | Comments per code-comments.md (the REOPEN reason) | r2 diff: the `(issue #333)` docblock was replaced by the 1-line why `` // `lastName` is the given name (Tên), which can be 1–2 characters (An, Vy). ``. `issue-ref grep exit=1`: no `#<n>` left. The comment is a single `//` sentence that gives the WHY, which matches the Style table | Covered, REOPEN resolved |

- Commands match `doctrine/MEMORY.md`: `npm test`, `npm run build` and `npm run lint` in r1, plus "Test one file" `npx jest <path>` and `npm run lint` in r2, all run from the repo root. The output is summary lines with no `...` or "truncated" markers.
- 6b: both notes carry `## Supersedes: none` and `## Still open: none`. Before the collapse, line 95 was the only active row that cited #333.
- Forbidden states (5): none hit. The node exists, the evidence is present, there is no code in `haven/`, the implementer did not set the PM status, and the diff was not self-graded.
- Seal gate: no outward action, recorded as "none" in both notes.
- Proportion: a 1-line source change plus 1 new test file. r2 changes only the comment, which is what the REOPEN asked for (`SmallestDiff`).

## Re-run
none. This was an audit only, which is the default, and no exception case applies. The only read outside the notes was a read-only `grep -n '#[0-9]'` on the test file (exit=1), which matches the note's own claim.
