# 2026-11-07 — fix-candidate-email-empty-query (verifier verdict, round 2)

- Worker: verifier · Version: 0.1.0 (subagent, dispatched via Agent tool)
- Node: `fix-candidate-email-empty-query` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #380, branch `380-get-candidate-email`
- Graded note: `evidence/implementer/2026-11-07/fix-candidate-email-empty-query-diff-r2.md` (answers `evidence/verifier/2026-11-07/fix-candidate-email-empty-query-reopen.md`)
- Verdict: **SEAL** — new PM status SEALED (row archived to `haven/diagrams/dev-loop-archive.md`, pointer row on the active diagram)

## Isolation proof
Spawned as a fresh `Agent` with description "verify_seal r2 fix-candidate-email-empty-query #380" and spawn
token `VS-380-2026-11-07-b` — neither appears in the implementer notes (task string `/todo #380`) nor matches the
round-1 verifier token (`VS-380-2026-11-07-a`). No implementer turns in context; only the r2 note, the r1 REOPEN,
the node, the feature doc and doctrine were read — the diff itself was not opened. Did not write this diff.

## Re-run
none — audit-only (default). Output is verbatim, commands match `doctrine/MEMORY.md`, every criterion is cited;
the node is not outward-facing or a `/release` gate, and no PROJECT.md rule calls for a re-run here.

## Reasoning
| Criterion | Evidence |
|---|---|
| (1) dropped email → `null` without querying (→ 404), Behavior #2 of `features/candidate-account.md` ("unknown email → 404") | Output 1: `✓ returns null without querying when safeQuery drops the email "a$b@x.com" (#380)` and `... "   " (#380)`; test asserts `findOne` called 0 times; controller `null` → `NotFoundError` 404 noted as unchanged |
| (2) regression test passes via `npx jest src/__tests__/candidate/candidate.service.test.ts` | Output 1: `Tests:       11 passed, 11 total` |
| (3a) `npm test` no new failures vs `staging` | after `Tests:       5 failed, 574 passed, 579 total`; baseline `Tests:       5 failed, 572 passed, 577 total`; the 5 `✕` names are pasted verbatim for both runs and match (tokenExpiry ×1, atsPdfIntegration ×4); reasons env-only (`Could not find Chrome`, `Expected: 3600 / Received: 10800`); +2 = the new `it.each` cases |
| (3b) Typecheck inside Build (`npm run build`) | Output 3: `BUILD_EXIT=0` |
| (3c) `npm run lint` ≤ 274, none new in touched files | Output 4: `✖ 274 problems (274 errors, 0 warnings)` = baseline; touched files 5 before / 5 after (pre-existing `unbound-method` in the test file), `candidate.service.ts` 0 |
| comments per code-comments.md | 1 `//` comment added at `candidate.service.ts:65`, a one-sentence WHY (trap) inside the function body, `(#380)` ref removed per the "Issue/PR refs" Delete rule. `(#380)` in the test title is out of scope for the standard (it covers comments) and matches the file's existing `(issue #152)` title idiom — accepted |
| Command matches `doctrine/MEMORY.md` | yes: Test one file, Test, Build (Typecheck inside Build), Lint with the baseline count cited |
| Output verbatim (step 5) | yes: r1's `● ...` / `(4 tests)` abbreviations replaced with the real `✕` lines; greps are declared with their patterns, with no `...`/"truncated" markers |
| `## Feature doc` (6b) | `doctrine/features/candidate-account.md`, doc unchanged; cited Behavior #2 is evidenced in row (1). Fix SEAL: the doc's Status is left as it is (already `verified`) |
| Supersedes / Still open | `## Supersedes: none`; `## Still open` names `fix-candidate-password-leak` (#152, a different issue). No other #380 row on the active diagram |
| Seal gate (step 8) | `## Seal gate`: none — no outward-facing action; push/PR come later via `/ship` |
| Proportionality (SmallestDiff) | 1 guard line + 1 comment in the service, 1 parametrised test; reuses the existing `src/candidate_me/index.ts:104` guard pattern. Nothing beyond the node |
| r1 REOPEN items | (1) `## Acceptance` table + comments row added; (2) verbatim `npm test` output for after and baseline; (3) `## Seal gate` added — all 3 addressed |

Forbidden states: `ADHOC_WORK` no (node on the diagram, was IN_PROGRESS); `NO_EVIDENCE` no (plan, diff, diff-r2 notes);
`EDIT_UNVERIFIED` no (every claim is backed by cited output, and the typecheck is cited); `CODE_IN_HAVEN` no (only diagram `.md` files
modified under `haven/`); `DIAGRAM_DRIFT` no (PM status moved to SEALED by this verdict).
