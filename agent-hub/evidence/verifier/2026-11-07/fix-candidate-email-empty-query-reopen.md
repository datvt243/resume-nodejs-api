# 2026-11-07 — fix-candidate-email-empty-query (verifier verdict)

- Worker: verifier · Version: 0.1.0 (subagent, dispatched via Agent tool)
- Node: `fix-candidate-email-empty-query` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #380, branch `380-get-candidate-email`
- Graded note: `evidence/implementer/2026-11-07/fix-candidate-email-empty-query-diff.md` (plan: `...-plan.md`)
- Verdict: **REOPEN** — PM row left `IN_PROGRESS` (RatchetOnly; no change)

## Isolation proof
Spawned as a fresh `Agent` with description "verify_seal fix-candidate-email-empty-query #380" and spawn
token `VS-380-2026-11-07-a` — neither appears in the implementer's notes (its task string is `/todo #380`).
No implementer turns in context; only the plan + diff notes were read, the diff itself was not opened.
Did not write this diff.

## Re-run
none — audit-only (default). The gaps below are note-format gaps; per "Re-run scope" a broken note is
REOPENed, not re-run "to be sure".

## Reasoning
| Criterion | Verdict |
|---|---|
| (1) dropped email → `null` without querying (→ 404), Behavior #2 of `features/candidate-account.md` | evidence present: Output 1 `✓ returns null without querying when safeQuery drops the email "a$b@x.com"` / `"   "`; controller null→404 claimed unchanged |
| (2) regression test passes via `npx jest src/__tests__/candidate/candidate.service.test.ts` | evidence present: `Tests: 11 passed, 11 total` |
| (3a) `npm test` no new failures vs staging | `Tests: 5 failed, 574 passed, 579 total` vs baseline `5 failed, 572 passed, 577 total`, same 2 suites — but output is **abbreviated** (see Missing 2) |
| (3b) Typecheck inside Build | `BUILD_EXIT=0` |
| (3c) Lint ≤ 274, none new in touched files | `✖ 274 problems (274 errors, 0 warnings)`; touched files 5 before / 5 after, 0 in `candidate.service.ts` |
| comments per code-comments.md | **MISSING** — no row, no `## Acceptance` section at all |
| Command matches `doctrine/MEMORY.md` | yes (Test, Test one file, Build, Lint rows) |
| Feature doc line | present: `doctrine/features/candidate-account.md`, doc unchanged; Behavior #2 is the cited item |
| Supersedes / Still open | `## Supersedes: none`; `## Still open` names `fix-candidate-password-leak` (#152, different issue) — only one #380 row on the active diagram |
| Seal gate | **MISSING** — no `## Seal gate` line (README format requires it, "none" if no outward action) |
| Proportionality | 1 guard line + 1 parametrised test — SmallestDiff OK |

Forbidden states: `ADHOC_WORK` no (node on diagram, IN_PROGRESS); `NO_EVIDENCE` no (notes exist);
`CODE_IN_HAVEN` no (only `haven/diagrams/dev-loop.prime-mermaid.md` modified under haven); `DIAGRAM_DRIFT` no
(row IN_PROGRESS while the diff is pending); `EDIT_UNVERIFIED` — **hit**: the comments row is missing
(code-comments.md §Enforcement → REOPEN) and Output 2 is not verbatim.

## Missing
1. `## Acceptance` table (`evidence/README.md` implementer format) with one row per node criterion
   (1), (2), (3) citing the output line, **plus the "comments per code-comments.md" row** citing the
   comments the diff adds/changes or "no comments touched". `doctrine/standards/code-comments.md`
   §Enforcement: row missing → REOPEN. If the test title or a source comment carries `(#380)`, check it
   against the standard's "issue/PR refs" Delete rule (a comment rule; a test title is your call — say which).
2. Output 2 (`npm test`) is not verbatim: `● ... › falls back to ...` contains a literal `...` and
   `› (4 tests)` is a summary, not output. Recipe step 5 → REOPEN. Paste the real failing-test lines
   (or the full summary block) for both the after-diff run and the stashed baseline.
3. `## Seal gate` line (`none` if no outward-facing action — push/PR happen only after SEAL via `/ship`).

No code change is requested — the evidence for criteria (1), (2), (3b), (3c) already looks sufficient;
this is a note fix plus a verbatim re-paste of the `npm test` output.
