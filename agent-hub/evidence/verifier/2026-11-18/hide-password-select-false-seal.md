# 2026-11-18 - hide-password-select-false - SEAL
Worker: verifier · Version: 0.1.0 · Node: `hide-password-select-false` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #459, branch `refactor/459-hide-password-select`) · New PM status: SEALED
Note audited: `evidence/implementer/2026-11-18/hide-password-select-false.md`

## Isolation proof
Fresh Agent-tool spawn, `spawn=fresh`. Task string this context received: "You are the agent-hub VERIFIER worker ... run `verify_seal` on Evidence note: agent-hub/evidence/implementer/2026-11-18/hide-password-select-false.md, Node: `hide-password-select-false` ... changes are uncommitted in the working tree". This context has no implementer reasoning; it did not write any part of the diff (self-check step 1: not mine).

## Reasoning
Node criteria (diagram row 84):
| Criterion | Evidence (cited from note) | Verdict |
|---|---|---|
| (1) login reads hash via `+password`, `auth.service.test.ts` green | `handlerLogin` 4/4 ✓ incl. new `expect(select).toHaveBeenCalledWith('+password')`; "Test Suites: 2 passed, 2 total / Tests: 15 passed, 15 total" | met |
| (2) new test: plain `findById()` sends projection excluding `password` | `candidatePassword.test.ts` ✓ in the same run; negative check with `select: false` removed: "Tests: 1 failed, 1 total"; restore confirmed by grep at line 26 | met |
| (3) `npm test` + `npm run build` green, lint ≤ baseline, none in changed files | "Tests: 784 passed, 784 total", "Test Suites: 73 passed, 73 total"; build tail shows `npm run copy` ran (only after `tsc` succeeds) + "build exit 0"; lint "✖ 274 problems" = baseline 274; touched-file errors are the same 10 pre-existing `unbound-method` in `auth.service.test.ts` as on staging (line-shifted), 0 in the other 3 files | met |
| comments per code-comments.md | 2 `//` one-sentence WHY comments (model field, test helper), no `(#N)` refs | met |

Doctrine checks:
- Step 4: commands match `doctrine/MEMORY.md` (Test, Test one file, Build, Lint with baseline cited); Typecheck row = `inside Build`, build output cited. OK.
- Step 5: outputs are summary tails with totals intact; the targeted block opens mid-output (PASS header of the models suite not shown) but suite/test totals are verbatim and consistent (2 suites, 14 + 1 = 15). Not hiding a failure. OK.
- Step 6 open rows: only this row cites #459; `## Supersedes: none` present. OK.
- Step 6b feature doc: `doctrine/features/auth-register-login.md` cited (fix → Behavior #5/#6). Login unknown-email / wrong-password → same 401 and success → tokens: covered by the 4 green `handlerLogin` tests. Doc status left `verified` (fix SEAL, step 11e). No `## Feature doc changed`. OK.
- Step 6b2 review: `## Review` present with `/code-review medium` + `/security-review` (label `security`), no findings; the write-path argument (no `replaceOne`/`.save()`, so a doc loaded without the hash can't wipe it) and the `candidateQuerySafe` allow-list argument are stated. OK.
- Step 6c doctrine proposal: none.
- Step 7 forbidden states: `ADHOC_WORK` no (node on diagram, issue-linked branch) · `NO_EVIDENCE` no · `EDIT_UNVERIFIED` no (test + typecheck cited, red-then-green shown) · `CODE_IN_HAVEN` no (only the diagram `.md` changed in `haven/`) · `DIAGRAM_DRIFT` resolved by this SEAL.
- Step 8 seal gate: nothing outward-facing (uncommitted working tree). Note has no `## Seal gate` section (format gap, not a gate breach; nothing to approve).
- Step 9 proportionality: `git status --short` / `git diff --stat` show exactly the 4 files the note lists (3 modified + 1 untracked test) plus the diagram row; +16/-6 in `src/`. Proportionate.

Cross-check (dispatcher asked for an audit against the real diff): read `git diff -- src/` + the new test file; matches the note line for line (`auth.service.ts:95` `.select('+password')`, model line 26 `select: false`). Grep of `src/` non-test for hash readers: only `bcryptCompareHash` in `handlerLogin` (line 100), so no other query path needs `+password`. Redundant `.select('-password')` (`candidate.service.ts:60,68`) mixes fine with schema `select: false`.

## Re-run
none — audit-only. Note outputs are verbatim with totals, commands match doctrine, criteria all covered; not outward-facing, not a `/release` gate, and `doctrine/domains/PROJECT.md` lists no re-run class for this change. (Read the diff and grepped `src/` as a cross-check; no build/lint/test re-run.)

## PM status
Row archived verbatim (state SEALED) to `haven/diagrams/dev-loop-archive.md`; active row replaced by a pointer. Pointer rows hit 21 → oldest (`linkedin-unparseable-end-date`, 2026-11-08, already in archive) deleted.

## Noticed, not done
- Active diagram still holds `fix-candidate-password-leak` (#152) as PENDING while the archive has it SEALED (2026-09-28). Not this node's row; left for a separate pass.
