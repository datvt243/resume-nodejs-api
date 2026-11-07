# 2026-11-07 - logout-revokes-refresh (verdict)

- Worker: verifier · Version: 0.1.0
- Node: `logout-revokes-refresh` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub issue #391)
- Notes audited: `evidence/implementer/2026-11-07/logout-revokes-refresh-plan.md`, `evidence/implementer/2026-11-07/logout-revokes-refresh-diff.md`
- Verdict: SEAL
- New PM status: SEALED (row collapsed to a pointer, full row appended to `haven/diagrams/dev-loop-archive.md`)

## Isolation proof
Fresh Agent-tool subagent spawned with the task string beginning "You are the agent-hub **verifier** worker for the repo at /Users/_david/Workspace/Project/resume/resume-nodejs-api. You are a separate subagent with a blank context (this is the NeverVerifyOwnWork isolation step) — you did not write the diff." — distinct from the implementer's task string (`/todo #391` — "Logout leaves the refresh token valid"). This context holds no implement-pass reasoning; it did not write the diff.

## Reasoning
| Criterion | Evidence (from diff note) | OK |
|---|---|---|
| (1) auth.controller tests pass incl. new "also blacklists the refresh token" test | "✓ also blacklists the refresh token sent with the request"; "Tests: 37 passed, 37 total" (auth.controller + refreshToken + refreshTokenReuse) | yes |
| (2) refreshToken.test.ts "401 TOKEN_REVOKED when refresh token is blacklisted" passes | "✓ returns 401 TOKEN_REVOKED when refresh token is blacklisted (1 ms)" in the same 37/37 run | yes |
| (3) `npm test` + `npm run build` (pre-existing tokenExpiry/atsPdfIntegration failures excepted) | base and after list the identical 5 `●` failures in exactly those 2 suites; 576/581 → 577/582 (+1 = new test); "build exit 0" | yes |
| (4) `npm run lint` ≤ 274, none new in changed files | "✖ 274 problems" (= MEMORY baseline 274); changed files "19 problems" base = after | yes |
| (5) matches `features/auth-session-tokens.md` Behavior #7 | doc Behavior 7 now states the request's `refreshToken` is blacklisted → later refresh 401 `TOKEN_REVOKED`; diff table: `authLogout` uses `extractTokenFromRequest(req, 'refreshToken')` (same extractor as Behavior 5) + `addToBlacklist`; changelog row present | yes |
| comments per code-comments.md | one added `//` WHY comment, no `(#N)` ref | yes |

- Command vs `doctrine/MEMORY.md`: `npm test`, `npx jest <file>`, `npm run build` (Typecheck = inside Build, exit 0), `npx eslint .` (= `npm run lint`) with baseline count cited. Matches.
- Output: grep-filtered, filter stated verbatim in `## Command`; no `...`/truncation markers. Accepted.
- Feature doc: `## Feature doc` line present; `## Feature doc changed` carries the operator's recorded answer ("Bug: revoke the refresh token too — #391", also in the doc's Open questions). Fix SEAL proves Behavior #7 only — doc Status left as is (step 11e).
- Same-issue open rows: none other for #391 on the active diagram; `## Supersedes: none` present.
- Forbidden states: ADHOC_WORK no (node exists) · NO_EVIDENCE no · EDIT_UNVERIFIED no (test + typecheck cited) · CODE_IN_HAVEN no (only `.md` changed under `haven/`) · DIAGRAM_DRIFT no (PM status updated here).
- Seal gate: no outward-facing action taken; `/ship` approval pending, as the note says.
- Proportionality: 2 `src/` files + the feature doc + the node row — matches the node. The note's "Noticed, not done" items (no end-to-end HTTP test; refresh-only logout still 400) are outside the node's criteria.

## Diagram housekeeping
- Active pointer rows reached 21 → deleted the oldest (`add-graceful-shutdown`, 2026-10-24; full row already in the archive), now 20.

## Re-run
none — audit-only; note output verbatim, commands match MEMORY, every criterion cited.
