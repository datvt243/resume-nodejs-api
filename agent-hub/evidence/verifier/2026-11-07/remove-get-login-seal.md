# 2026-11-07 - remove-get-login (verdict)
- Worker: verifier · Version: 0.1.0
- Node: `remove-get-login` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #389)
- Notes audited: `evidence/implementer/2026-11-07/remove-get-login-plan.md`, `evidence/implementer/2026-11-07/remove-get-login-diff.md`
- New PM status: SEALED (row collapsed into `haven/diagrams/dev-loop-archive.md`; oldest pointer row `add-graceful-shutdown` (2026-10-24) pruned per step 11c — 21 → 20 pointer rows, its full row already in the archive)

## Isolation proof
Fresh Agent-tool subagent dispatched as "agent-hub verifier worker ... separate subagent with a blank context (NeverVerifyOwnWork isolation step)" for node `remove-get-login`, spawn token `VS-389-2026-11-07-a` — not the implementer's task string (`/todo #389`). No memory of the implement pass; diff not opened, only the two notes (file list cross-checked against `git status` only).

## Reasoning
| Criterion | Cited evidence |
|---|---|
| 1. `v1AuthRoute.test.ts` passes (only a POST `/login` layer) | `✓ serves /login only as POST — credentials never ride on a GET`; `Tests: 1 passed, 1 total` |
| 2. Doc's jest commands (`auth.controller`, `auth.service`, `v2AuthRoute`) pass | `Test Suites: 3 passed, 3 total` / `Tests: 33 passed, 33 total` |
| 3a. `npm test` — only pre-existing local failures | base `5 failed, 576 passed, 581 total` vs after `5 failed, 577 passed, 582 total`; identical 5 `●` names (tokenExpiry `TOKEN_EXP_IN` env, ATS no local Chrome) — same set prior seals accepted; +1 test / +1 suite = the new file |
| 3b. `npm run build` / Typecheck (inside Build) | `build exit 0` |
| 4. Lint ≤ 274, none in changed files | `✖ 274 problems (274 errors, 0 warnings)` = baseline; changed files base + after no output, `eslint exit 0` |
| 5. Behavior #5 (POST only; GET → 404) | Criterion 1 test proves no GET `/login` layer; doc Behavior 5 + Changelog row updated. `## Feature doc changed` carries the operator's recorded answer ("Change: remove the GET route — #389"), present in the doc's Open questions |
| comments per code-comments.md | no `//` added; only a `@swagger` block for the deleted route removed |
| Supersedes / Still open | `none`; grep of active diagram for 389 → only this node |

Forbidden states: ADHOC_WORK no (node on diagram) · NO_EVIDENCE no (plan + diff notes) · EDIT_UNVERIFIED no (test/build/lint output cited, typecheck via build) · CODE_IN_HAVEN no (only `.md` touched in `haven/`) · DIAGRAM_DRIFT no (status moved to SEALED here).
Seal gate: none — no commit/push/API call yet; `/ship` follows.
Proportionality: one route + its Swagger block (issue asks "Update Swagger"), one route-stack test, the `.claude/rules/api.md` row and the doc — all required by the node. HTTP-level 404 not live-tested, correctly listed under "Noticed, not done"; the unknown-route handler is unchanged code.
Fix SEAL — doc Status (`verified`) left as is (step 11e).

## Re-run
none — audit-only. Output cited verbatim, commands match `doctrine/MEMORY.md`, not outward-facing or a `/release` gate, and `doctrine/domains/PROJECT.md` lists no re-run class for this change.
