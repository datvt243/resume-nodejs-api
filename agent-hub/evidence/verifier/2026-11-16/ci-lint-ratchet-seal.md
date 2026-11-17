# 2026-11-16 — ci-lint-ratchet (verdict: SEAL)
- Worker: verifier · Version 0.1.0
- Node: `ci-lint-ratchet` (`haven/diagrams/dev-loop.prime-mermaid.md`, was PENDING → SEALED, row archived)
- Evidence audited: `evidence/implementer/2026-11-16/ci-lint-ratchet-diff.md` (plan: `evidence/implementer/2026-11-16/ci-lint-ratchet-plan.md`)
- Task: GitHub #462 "CI: run lint on push / PR" (label `devops`, OPEN) · Branch `chore/462-ci-run-lint`

## Isolation proof
Fresh Agent-tool subagent spawned by `/todo` with task string "agent-hub VERIFIER worker ... run `verify_seal` on ... ci-lint-ratchet-diff.md ... Operator decision ... Ratchet on count"; no access to the implementer's conversation (only its notes on disk).

## Re-run
none — audit-only. Only extra check: `git diff --stat -- .github/workflows/node.js.yml` → `1 file changed, 7 insertions(+)`, matches the note's "+7" (proportionality, no content re-read, no build/lint/test re-run). `eslint-report.json` absent in repo root (implementer cleaned up).

## Criteria
| # | Criterion | Evidence (note) | Result |
|---|---|---|---|
| 1 | Lint step right after `npm ci`, triggers unchanged | `## Diff` (insert after `- run: npm ci`) + parsed step list `checkout / setup-node / npm ci / Lint (ratchet) / build / test`; diff is insert-only (stat: 7 insertions, 0 deletions) | ✅ |
| 2 | exit 0 at 274, exit 1 above baseline | `ESLint errors: 274 (baseline 274) exit=0`; `ESLint errors: 274 (baseline 273) exit=1` | ✅ |
| 3 | ESLint crash without report fails | `missing report (eslint crashed) exit=1`; note explains `|| true` only masks eslint's exit, `require` throws on missing file | ✅ |
| 4 | YAML parses, order correct | ruby YAML parse step list above | ✅ |
| 5 | `npm test` + `npm run build` green | `build exit=0`; `Test Suites: 72 passed, 72 total` / `Tests: 781 passed, 781 total` | ✅ |
| — | Comments per code-comments.md | 1 `#` why-comment (baseline rule: lower, never raise) — WHY not WHAT, no issue ref | ✅ |

- Doctrine commands (step 4): Build / Test match `doctrine/MEMORY.md`; Typecheck `inside Build` → build exit 0 cited; Lint baseline row → count 274 cited (≤ 274), no `src/` file touched.
- Output not cut/hidden (step 5): no `...`/truncation markers.
- Feature doc (6b): `none` — CI config, no product feature. OK.
- Review (6b2): present, inline pass, no findings; not `security`-labeled. OK.
- Supersedes / Still open: `none` / `none`; no other open row for #462 on the active diagram.
- Doctrine proposal (6c): none in note.
- Operator decision: deviation from the issue's literal `npm run lint` (ratchet on count, baseline 274) recorded in the plan note (AskUserQuestion 2026-11-16). Seal gate satisfied.
- Proportionality: 7-line YAML insert, optional husky hook skipped and named. SmallestDiff OK.

## Forbidden states
ADHOC_WORK no (node on diagram) · NO_EVIDENCE no · EDIT_UNVERIFIED no (real outputs cited) · CODE_IN_HAVEN no (only a table row edited) · DIAGRAM_DRIFT no (PM status updated by this pass).

## Verdict
SEAL — every criterion has cited evidence.

## Notes for operator
- Lint runs once per matrix entry (20.x, 22.x) — harmless duplicate, accepted in the note.
- Implementer's "Noticed, not done": `doctrine/MEMORY.md` Lint row could point at `LINT_BASELINE` in the workflow. Not a confirmed doctrine proposal, so not applied.
