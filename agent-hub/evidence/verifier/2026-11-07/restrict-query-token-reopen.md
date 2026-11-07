# 2026-11-07 - restrict-query-token (verdict: REOPEN)

- Worker: verifier · Version: 0.1.0 (subagent, dispatched via Agent tool)
- Node: `restrict-query-token` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #392
- New PM status: REOPEN (row left as `PENDING` — RatchetOnly, never advanced)
- Notes audited: `evidence/implementer/2026-11-07/restrict-query-token-plan.md`, `evidence/implementer/2026-11-07/restrict-query-token-diff.md`
- Feature doc: `doctrine/features/auth-session-tokens.md` (Behavior #1)

## Isolation proof
Fresh Agent-tool spawn whose task string is the verifier dispatch ("You are the agent-hub **verifier** worker ... You are a separate subagent with a blank context (this is the NeverVerifyOwnWork isolation step) — you did not write the diff"), naming this node, both note paths and the feature doc. The implementer's task string was `/todo #392` — "Restrict the `?token=` query parameter to `/download-pdf`". This context holds none of the implement pass's reasoning; the diff was not opened (EvidenceOnly).

## Reasoning
| Criterion | Verdict | Evidence in note |
|---|---|---|
| (1) verifyToken tests incl. new query-token tests pass | partial | `Tests: 18 passed, 18 total` — but no verbatim `✓` lines for the 3 new tests; their existence is only inferred (584 = 581 + 3) |
| (2) doc's jest commands pass | cited | `Test Suites: 7 passed` / `Tests: 64 passed, 64 total`; tokenExpiry exclusion is allowed by the doc's own env note |
| (3) `npm test` + build pass (pre-existing failures excepted) | NOT PROVEN | `Tests: 5 failed, 579 passed, 584 total` with no `FAIL`/`✕` names in the output. The "same pre-existing 5" claim cites `evidence/implementer/2026-11-07/fix-account-delete-cleanup-diff.md`, which does not exist in this hub (only `evidence/ship/2026-11-07/fix-account-delete-cleanup-ship.md` exists). No stash baseline run in this note. Build: `build exit 0` — accepted (Typecheck inside Build, per MEMORY.md) |
| (4) lint ≤ 274, none new in changed files | partial | Repo total `✖ 274 problems (274 errors, 0 warnings)` cited (≤ baseline 274). "None new in changed files" is prose only ("base 19 → now 19 ...") — no command line and no verbatim per-file eslint output for base or after |
| (5) matches Behavior #1 | partial | Doc updated (Behavior 1 + Changelog row confirmed in the doc; operator answer "Change: only /download-pdf — #392" recorded in its Open questions). Code behavior evidence is reasoning ("query read only when `allowQuery`") rather than cited test output (e.g. the `✓` names of the "query ignored → 401 NO_TOKEN", "falls through to cookie", "verifyTokenByQuery accepts query" tests) |
| comments per code-comments.md | NOT PROVEN | Row present but does not cite the touched comments (Enforcement requires citing them): neither the added `//` WHY line nor the removed comment is quoted |
| Feature doc line (6b) | ok | `## Feature doc` + `## Feature doc changed` with operator answer present |
| Supersedes/Still open | ok | `## Supersedes: none`; no other open row for #392 on the active diagram |
| Forbidden states | none hit | node exists on diagram (no ADHOC_WORK); no code in haven/; evidence notes present |
| Seal gate | ok | no outward-facing action yet ("none yet — `/ship` after SEAL") |
| Proportionality | ok | 2 src files + 1 test + doc; `allowQuery` default keeps refresh/logout/csrf unchanged; out-of-scope `refreshToken` query leak noted, not done |

## Missing
1. Criterion (3): verbatim `FAIL`/`✕` lines of the 5 `npm test` failures, plus a resolvable baseline proving they pre-exist — either a `git stash` → `npm test` → `git stash pop` baseline in this note, or a citation to a note that exists (e.g. `evidence/implementer/2026-11-07/fix-section-id-empty-query-diff.md` lists the same FAIL suites at 577/581 base). The cited `fix-account-delete-cleanup-diff.md` does not exist.
2. Criterion (4): the exact per-file eslint command (e.g. `npx eslint src/utils/helper-auth.ts src/middlewares/verifyToken.middleware.ts src/__tests__/middlewares/verifyToken.test.ts`) with verbatim output on the stash base and after the diff.
3. Criteria (1)/(5): verbatim `✓` lines for the 3 new verifyToken tests (query ignored → 401 `NO_TOKEN`; falls through to cookie; `verifyTokenByQuery` accepts query).
4. comments per code-comments.md: quote the added `//` WHY comment and the removed comment.

## Re-run
none — audit-only. Per "Re-run scope", a missing/unresolvable citation is an immediate REOPEN, not a reason to re-run.
