# 2026-11-07 - fix-account-delete-cleanup (verdict)
- Worker: verifier · Version: 0.1.0
- Node: `fix-account-delete-cleanup` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #395)
- Notes audited: `evidence/implementer/2026-11-07/fix-account-delete-cleanup-plan.md`, `evidence/implementer/2026-11-07/fix-account-delete-cleanup-diff.md`
- New PM status: SEALED (row collapsed into `haven/diagrams/dev-loop-archive.md`; oldest pointer row `add-graceful-shutdown` (2026-10-24) pruned per step 11c, 21 → 20 pointer rows, its full row already in the archive)

## Isolation proof
Fresh Agent-tool subagent spawned with the task "agent-hub verifier worker ... Run `verify_seal` ... for Node `fix-account-delete-cleanup` (GitHub issue #395)", spawn token `VS-395-2026-11-07-a`. That is not the implementer's task string (`/todo #395`). No memory of the implement pass. Diff not opened, only the two notes, the node row and the cited feature doc.

## Reasoning
| Criterion | Cited evidence |
|---|---|
| 1. `npx jest src/__tests__/candidate/candidate.service.test.ts` passes incl. new assertions (`Visit.deleteMany({candidateId})` + `invalidateAllSessions(_id)` on delete, neither on id-not-found) | Output `Tests:       10 passed, 10 total`. Diff table: the not-found test asserts neither is called, and a new test asserts both are called with the id |
| 2a. `npm test` passes (no new failures vs staging) | `Tests:       5 failed, 577 passed, 582 total` vs the previous seal (`fix-section-id-empty-query`) at `5 failed, 576 passed, 581 total`, so +1 = the new test. Both failing suites are the same 2 files (tokenExpiry, atsPdfIntegration). Base proof (`git stash -u`): `Tests:       5 failed, 2 passed, 7 total` with 5 named tests, the same set that `fix-visit-real-client-ip` re-ran on base and `cv-filename-lang-suffix` accepted (local `.env` TOKEN_EXP_IN, no local Chrome). The diff touches neither area. Pre-existing claim: accepted |
| 2b. `npm run build` / Typecheck (inside Build) | `build exit 0` |
| 3. Lint ≤ 274, none new in changed files | `✖ 274 problems (274 errors, 0 warnings)` = baseline. Changed files 5 = stashed base 5. Same "none new" reading the prior seals used |
| 4. Matches `features/candidate-account.md` Behavior #6 | Diff: `Visit.deleteMany({ candidateId: _id })` before the candidate delete, then `invalidateAllSessions(_id)` (reused from `utils/sessionRevocation`, the same mechanism as `authLogoutAll`, so old tokens → 401). Doc Behavior 6 matches the verdict text |
| Feature doc changed | `## Feature doc changed` line cites the operator answer "Bug: delete visits + revoke all sessions — #395", which is recorded in the doc's Open questions (read). Changelog row present. Fix SEAL, so doc Status (already `verified`) is left as is (step 11e) |
| comments per code-comments.md | "one `//` WHY line, no `(#N)` ref" |
| Supersedes / Still open | `none`. A grep of the active diagram for 395 finds only this node |
| Forbidden states | none hit: node exists, notes exist, commands match MEMORY.md (Test/Build/Lint/Typecheck rows), no code in `haven/`, PM status updated here |
| Seal gate | no outward action yet (`/ship` after SEAL) |
| Proportionality | 2 src files + feature doc, all required by the node |

Minor: line 53 of the diff note abbreviates the tokenExpiry describe title with `…`. The full title is unambiguous (single describe at `src/__tests__/auth/tokenExpiry.test.ts:16`), and every count line is verbatim, so this is not a hidden output.

## Re-run
none (audit-only. The output is verbatim for every count, the commands match doctrine, the change is not outward-facing or a release gate)
