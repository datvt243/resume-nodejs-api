# 2026-11-07 - atomic-token-consume (verdict)

- Worker: verifier · Version: 0.1.0
- Node: `atomic-token-consume` in `haven/diagrams/dev-loop.prime-mermaid.md` (GitHub issue #385)
- Notes audited: `evidence/implementer/2026-11-07/atomic-token-consume-plan.md`, `evidence/implementer/2026-11-07/atomic-token-consume-diff.md`
- Verdict: SEAL
- New PM status: SEALED (row archived verbatim to `haven/diagrams/dev-loop-archive.md`; active row → pointer; oldest pointer `add-graceful-shutdown` (2026-10-24) dropped to keep 20 pointer rows — its full row already in the archive)

## Isolation proof
Fresh Agent-tool subagent spawned with the task string "You are the agent-hub **verifier** worker ... Run `verify_seal` exactly as the recipe's numbered steps say for: Node: `atomic-token-consume` ... Do NOT commit, push, or modify anything under src/." — a verifier dispatch prompt, not the implementer's `/todo #385` task string. Primary cwd at spawn: `agent-hub/evidence/implementer/2026-11-07`. No implementer reasoning in this context; diff not authored here.

## Reasoning
Step 4 — commands vs `doctrine/MEMORY.md`: `npm test`, `npx jest <file>`, `npm run build` (Typecheck row = `inside Build`, cited "build exit 0"), lint via `npx eslint .` (= `npm run lint`). Lint baseline 274: note cites "✖ 274 problems (274 errors, 0 warnings)" (≤ 274) and changed-files eslint "eslint exit 0". Match.
Step 5 — no `...`/truncated markers. `npm test` output is grep-filtered, but the filter is disclosed in `## Command` and the `Tests:`/`Test Suites:` summary lines are verbatim. Accepted.
Step 6 — node criteria:
| # | Criterion | Evidence cited |
|---|---|---|
| 1 | race test red on base, green after | base "✕ … Tests: 2 failed, 2 total"; after "✓ lets only one of two concurrent consumes succeed" ×2, "Tests: 2 passed, 2 total" |
| 2 | auth.service tests pass | "Tests: 13 passed, 13 total" |
| 3 | npm test + build | after "Tests: 5 failed, 578 passed, 583 total"; the 5 `●` are tokenExpiry (1) + atsPdfIntegration (4), identical in base → the excepted pre-existing ones; base 7 failed = those 5 + the 2 new race tests. "build exit 0" |
| 4 | lint ≤ 274, none in changed files | "274 problems"; "eslint exit 0" on the 3 changed files |
| 5 | single-use per both feature docs | criterion 1 race test, both token kinds (`reset token (redis)`, `email-verify token (redis)`) |
| — | comments per code-comments.md | cited: one `//` one-sentence WHY ("One atomic GETDEL: a separate GET then DEL lets two concurrent requests both read the token."), no `(#N)`; test `/** */` overview (multi-sentence → `/** */`, correct) |
Open rows for #385 on the active diagram: only this node; `## Supersedes: none` consistent.
Step 6b — `## Feature doc` present: `auth-password-reset.md` Behavior #2, `auth-register-login.md` Behavior #4 (both "single-use token"; register-login also lists #385 in Issues). Fix SEAL → evidence for the cited Behavior items = race test (criterion 1/5). Docs unchanged, no `## Feature doc changed` line needed. Fix SEAL leaves both docs' Status as is (already `verified`).
Step 7 — forbidden states: ADHOC_WORK no (node on diagram); NO_EVIDENCE no; EDIT_UNVERIFIED no (test + typecheck via build cited); CODE_IN_HAVEN no (only `.md` changed under haven/); DIAGRAM_DRIFT resolved by this SEAL.
Step 8 — seal gate: no outward-facing action taken; note records "none yet".
Step 9 — proportionality: `git status` file list = the 3 files in `## Diff` (2 src edits, 5 ins/6 del, + 1 new test). Minimal.

Observation (not blocking): the base-red is partly because the fake Redis has no `get` (base code errors → both consumes null), so the test proves "consume uses atomic `getDel`" rather than reproducing the interleaving itself — the test's `/** */` documents that design. `GETDEL` needs Redis ≥ 6.2; note's `## Noticed, not done` records it fails closed on older servers.

## Re-run
none — audit-only; note output verbatim, commands match doctrine, every criterion cited, node not outward-facing.
