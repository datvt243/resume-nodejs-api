# 2026-11-20 - account-settings (verdict)
Worker: verifier · Node: `account-settings` · New PM status: SEALED · Verdict: SEAL · Issue: #412
Notes audited: `evidence/implementer/2026-11-20/account-settings-plan.md`, `account-settings-diff.md`

## Isolation proof
Spawned fresh as a verifier subagent via the Agent tool, task "run verify_seal for node account-settings (#412), implementer notes plan+diff 2026-11-20"; no implementer context.

## Re-run
none — audit-only; not an outward-facing node, no doctrine/PROJECT.md re-run rule.

## Checks
- Command matches MEMORY.md (`npm test`, `npm run build` = typecheck, `npm run lint`, `npx jest <path>`): yes. Typecheck = `BUILD_EXIT=0`.
- Lint baseline 274: note cites `273 problems`, `before 273 after 273`, `changed: []`, `emailChange.ts: 0` -> within baseline, none in changed files.
- Output verbatim, no cuts: yes (`Tests: 826 passed, 826 total`, `Tests: 12 passed, 12 total`, `110 passed`).
- Every feature-doc criterion (validate, service x10, route 401/400, old/new login + refresh, 11th -> 429, npm test/build/lint) has a cited test name; extra edge cases (deleted account, cancel-on-revoke) have red-before output (`2 failed` with guard disabled).
- Route-401/400 criterion is proven by the real-HTTP integration test plus wiring in `v1AuthRoute.test.ts` (doc names the latter file; equivalent or stronger evidence).
- comments per code-comments.md row: present, specific.
- `## Feature doc` present; `## Feature doc changed` records the operator's answer (cancel on revoke, 2026-11-20); changelog row exists in the doc.
- `## Review`: `/code-review medium`, 9 findings each fixed or reasoned; issue is not `security`-labeled, so no /security-review needed.
- Supersedes: none; no other active row cites #412.
- Forbidden states: none hit. Seal gate: no outward-facing action (no push/deploy/external call). Proportionality: diff matches the node's files list.

## Doctrine proposal
none.

## Minor (not a REOPEN reason)
- Implementer note has no explicit `## Seal gate` line; the diff is not outward-facing, so step 8 does not require it.
- Doc "Out of scope: Cancelling a pending email change" refers to a user-initiated cancel; the cancel-on-revoke edge case is a separate rule. Wording could be tightened later.

## PM / doctrine updates
Row archived to `haven/diagrams/dev-loop-archive.md`, pointer row (20 pointers kept; oldest dropped); feature doc + INDEX row set to `verified`.
