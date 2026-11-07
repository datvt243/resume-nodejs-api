# 2026-11-08 - auth-credential-limit (verdict)
- Worker: verifier · Version: 0.1.0
- Node: `auth-credential-limit` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #387)
- Notes audited: `evidence/implementer/2026-11-08/auth-credential-limit-plan.md`, `evidence/implementer/2026-11-08/auth-credential-limit-diff.md`
- Verdict: **SEAL**
- New PM status: SEALED. Full row appended to `haven/diagrams/dev-loop-archive.md`; active row collapsed to a pointer. Step 11c: 21 → 20 pointer rows, pruned the oldest `add-cv-file-name` (2026-11-05, first in file order; full row confirmed in the archive).

## Isolation proof
Fresh Agent-tool spawn, task string: "You are the agent-hub **verifier** worker for the repo at /Users/_david/Workspace/Project/resume/resume-nodejs-api (git branch `387-auth-rate-limiter`, uncommitted working tree = the diff under review). You are a fresh, independent subagent: you did NOT write this diff ...". The implementer's task was `/todo #387`. This context holds none of the implementer's reasoning.

## Reasoning
| Criterion | Cited evidence | Result |
|---|---|---|
| (1) one shared `authLimiter` (10, 15 min, `auth-rl`) on v1 register/login/forgot/reset + v2 register/login; not on refresh/logout/logout-all/verify-email; no `router.use` | wiring tests in `Tests: 19 passed, 19 total` (`auth limiter wiring` in `v1AuthRoute.test.ts`) | met |
| (1) 10 allowed, 11th → 429 | test "authLimiter allows 10 requests per window and blocks the 11th" in the same 19 passed | met |
| (2) tests via the 3 named files | `Tests:       19 passed, 19 total`, run after the lint fix | met |
| (3) `npm test` no new failures | `5 failed, 616 passed, 621 total`. Prior baseline (`trust-proxy-hops-diff.md`): `5 failed, 604 passed, 609 total`. +12 = new tests; same 5 env failures (atsPdfIntegration ×4, tokenExpiry ×1). That full run came before the lint-only change to the new test body; the edited file was re-run afterwards (19 passed), and Jest suites run independently, so this is accepted | met |
| (3) build clean (Typecheck: inside Build) | `npm run build \| grep -c "error TS"` → `0` | met |
| (3) lint ≤ 274, none new in touched files | `✖ 274 problems` after fix; per-file now = base for all 6 touched files (rateLimit.test.ts 13 = 13 pre-existing) | met |
| comments per code-comments.md | row present: one 1-line why comment on `authLimiter`, no issue ref. Spot check `rateLimit.middleware.ts:143`: a single `//` line stating why, no issue ref | met |
| Feature docs (fix, Behavior #9 register-login, #6 password-reset) | `## Feature doc changed` line cites operator answers "Bug — #387" / "covered by #387" (2026-11-07) + AskUserQuestion 2026-11-08 "10 / 15 min (Recommended)". Both docs read: Behavior lines, open-question answer and Changelog rows match the wiring. Fix SEAL → Status stays `verified` (step 11e) | met |
| Commands vs `doctrine/MEMORY.md` | Test, Test one file, Build, Lint rows match; lint baseline 274 cited | ok |
| Output cut/hidden | no `...`/truncated markers; summary-line excerpts, as accepted in prior seals | ok |
| Doctrine proposal | none | n/a |
| Supersedes / Still open | `none` / `none` (grep `#387` → only this row) | ok |
| Forbidden states | ADHOC_WORK no (node on diagram) · NO_EVIDENCE no · EDIT_UNVERIFIED no · CODE_IN_HAVEN no · DIAGRAM_DRIFT no (status moved here) | ok |
| Seal gate | no outward action in this pass; commit/push/merge via `/ship --merge` | ok |
| Proportionality | limiter definition + per-route wiring + tests + the fix to `v2AuthRoute.test.ts` that the wiring change forced + `CLAUDE.md`/`api.md` rate-limit lines (now true) + feature docs. Nothing beyond the node | ok |

Independent spot check (read-only grep of the routers, not the diff): `authLimiter` sits only on v1 `:42` register, `:70` login, `:187` forgot-password, `:223` reset-password and v2 `:13`/`:14`. There is no `router.use` in either auth router. The single instance comes from `rateLimit.middleware.ts:144`.

## Re-run
none (audit-only: outputs verbatim, commands match `doctrine/MEMORY.md`, not a release gate). No build/lint/test re-run, no diff opened; read-only `grep` of the routers and middleware as a spot check.
