# 2026-11-07 - restrict-query-token (verdict: SEAL, round 2)

- Worker: verifier · Version: 0.1.0 (subagent, dispatched via Agent tool)
- Node: `restrict-query-token` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #392
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`, pointer row left on the active diagram; oldest pointer `add-graceful-shutdown` dropped to keep 20, its full row already in the archive)
- Previous verdict: `evidence/verifier/2026-11-07/restrict-query-token-reopen.md` (kept)
- Notes audited: `evidence/implementer/2026-11-07/restrict-query-token-plan.md`, `restrict-query-token-diff.md` (round 1), `restrict-query-token-diff-r2.md` (round 2)
- Feature doc: `doctrine/features/auth-session-tokens.md` (Behavior #1). Fix SEAL: doc Status left as is (already `verified`).

## Isolation proof
Fresh Agent-tool spawn whose task string is the round-2 verifier dispatch ("You are the agent-hub **verifier** worker ... This is round 2 after a REOPEN", naming the reopen note, the three implementer note paths and the feature doc, and "Ignore the untracked agent-hub/evidence/ship/2026-11-07/"). The implementer's task string was `/todo #392`. This context holds none of the implement pass's reasoning or the round-1 verifier's context; the diff was not opened (EvidenceOnly).

## Reasoning
| Criterion | Verdict | Evidence (r2 note unless stated) |
|---|---|---|
| (1) verifyToken tests incl. new query-token tests | cited | `✓ ignores a query token on a normal protected route (401 NO_TOKEN)`, `✓ falls through to the cookie when a query token is ignored`, `✓ accepts a query token on verifyTokenByQuery (download-pdf)`; `Tests: 18 passed, 18 total` |
| (2) feature doc's jest commands | cited | round 1: `Test Suites: 7 passed, 7 total` / `Tests: 64 passed, 64 total` (covers refreshToken, refreshTokenReuse and the 5-suite middleware/utils command, incl. the logout/logout-all criteria); tokenExpiry env-dependent failure is excepted by the doc itself and by the node |
| (3) `npm test` + build | cited | stash base `Tests: 5 failed, 576 passed, 581 total` vs after `Tests: 5 failed, 579 passed, 584 total`; identical `FAIL src/__tests__/auth/tokenExpiry.test.ts`, `FAIL src/__tests__/services/atsPdfIntegration.test.ts` and the same 5 `●` names both runs = the excepted pre-existing failures; +3 = new tests. Build/Typecheck (inside Build per MEMORY.md): `build exit 0`, no src change since round 1 |
| (4) lint ≤ 274, none new in changed files | cited | per-file `npx eslint` on the 3 changed files: base `✖ 19 problems (19 errors, 0 warnings)` = after `✖ 19 problems (19 errors, 0 warnings)`; repo `✖ 274 problems (274 errors, 0 warnings)` ≤ baseline 274 |
| (5) matches Behavior #1 | cited | the 3 `✓` lines above map to: query ignored → 401 `NO_TOKEN`; ignored query falls through to cookie; only `verifyTokenByQuery` (download-pdf) reads it. Doc Behavior 1 + Changelog row present |
| comments per code-comments.md | cited | removed `// keep for compatibility; extractToken already supports query param` (stale WHAT); added one-line `//` WHY about URL tokens leaking via logs/history/referrers; no `(#N)` |
| Feature doc line (6b) | ok | `## Feature doc` + `## Feature doc changed` with operator answer "Change: only /download-pdf — #392", matching the doc's Open questions |
| Supersedes/Still open | ok | `## Supersedes: none`; no other open row for #392 on the active diagram |
| Forbidden states | none hit | node on diagram; notes present; no code in haven/; PM status updated with this SEAL; claims backed by verbatim output |
| Seal gate | ok | no outward-facing action ("`/ship` after SEAL") |
| Proportionality | ok | 2 src files + 1 test + doc; `allowQuery` default keeps refresh/logout/csrf unchanged; `refreshToken` query leak noted, not done |

Output not cut: the r2 `npm test` output is a declared `grep -E` filter (command stated), keeping every FAIL/●/summary line — accepted as an explicit, reproducible filter, not hidden truncation.

## Re-run
none — audit-only. The r2 note supplies verbatim output for every REOPEN item; no re-run exception applies.
