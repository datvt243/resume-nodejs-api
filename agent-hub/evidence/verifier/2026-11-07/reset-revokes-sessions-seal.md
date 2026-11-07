# 2026-11-07 - reset-revokes-sessions (verdict)

- Worker: verifier · Version: 0.1.0
- Node: `reset-revokes-sessions` in `haven/diagrams/dev-loop.prime-mermaid.md` (GitHub #393)
- Notes audited: `evidence/implementer/2026-11-07/reset-revokes-sessions-plan.md`, `evidence/implementer/2026-11-07/reset-revokes-sessions-diff.md`
- Verdict: SEAL
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`, pointer left on the active diagram; oldest pointer `add-graceful-shutdown` (2026-10-24) trimmed to keep 20 — its full row already in the archive)

## Isolation proof
Fresh Agent-tool subagent spawned with the task string "You are the agent-hub **verifier** worker ... Run `verify_seal` exactly as the recipe's numbered steps say for: Node: `reset-revokes-sessions` ... (GitHub issue #393)" — distinct from the implementer's task (`/todo #393` — "Password reset does not revoke existing sessions"). This context holds no implementer reasoning; first action was loading the verifier bundle.

## Reasoning
- Step 4 (commands vs MEMORY.md): `npx jest <file>`, `npm test`, `npm run build` (Typecheck = inside Build), `npx eslint .` (= `npm run lint`) — all match. Lint baseline 274: note cites "✖ 274 problems (274 errors, 0 warnings)" (≤ 274); changed files "10 problems" base = after.
- Step 5 (cut/hidden output): no `...`/truncated markers. Output is filtered by an explicitly stated grep (`^FAIL|^Tests:|^Test Suites:|  ●.*›`), not silently cut.
- Step 6, node criteria:
  1. Service tests incl. new assertions, success assertion red on base: base "✕ updates the password when the reset token is valid ... Tests: 1 failed, 12 passed, 13 total"; after "✓ updates the password when the reset token is valid", "✓ fails without touching the password when the token is invalid/expired", "Tests: 13 passed, 13 total". The note says the success test asserts `invalidateAllSessions('user_id')` and the bad-token test asserts it is not called.
  2. `npm test` + build: base and after both "Tests: 5 failed, 576 passed, 581 total", and the same 5 `●` lines (tokenExpiry `|| '1h'` + 4 ATS Puppeteer), which the node's own exception covers; "build exit 0".
  3. Lint ≤ 274, none new in changed files: "274 problems"; changed files 10 = 10.
  4. Behavior #4: `invalidateAllSessions(candidateId)` after `CandidateModel.updateOne`, only on a valid token (early return before it on a bad token, backed by the not-called assertion); doc Behavior 4 updated.
  - comments per code-comments.md: one `//` line, gives the WHY (security rationale), no `(#N)`. Complies.
  - Same-issue open rows: only this node references #393 on the active diagram; `## Supersedes: none` is consistent.
- Step 6b, feature doc `doctrine/features/auth-password-reset.md`: the `## Feature doc` line is present. For a fix, the cited Behavior #4 is evidenced (above). The doc's own criterion `npx jest src/__tests__/auth/auth.service.test.ts` passes ("13 passed, 13 total"). `## Feature doc changed` records the operator answer "Change: reset revokes all sessions — #393", which matches the doc's Open questions answer (2026-11-07). Doc Status stays as it is (a fix SEAL, step 11e).
- Step 7, forbidden states: ADHOC_WORK no (node exists, added on this branch); NO_EVIDENCE no (plan + diff notes); EDIT_UNVERIFIED no (real output cited, typecheck via build); CODE_IN_HAVEN no (the diagram diff is one table row); DIAGRAM_DRIFT no (PM status updated here).
- Step 8, seal gate: the diff has no outward-facing action. The note records the operator's ship pre-approval for the later /ship step.
- Step 9, proportionality: working-tree stat is 3 lines in `src/auth/auth.service.ts`, 4 lines in the test, plus the doc and one diagram row. Matches the note's Diff table and nothing beyond the node.

## Re-run
none — audit-only (default): output verbatim, commands match doctrine, and every criterion is covered. Not outward-facing and not a /release gate. Only `git status --short` / `git diff --stat` were run, to confirm the file list.
