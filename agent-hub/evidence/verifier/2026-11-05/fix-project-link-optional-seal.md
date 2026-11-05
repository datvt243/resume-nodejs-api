# 2026-11-05 - fix-project-link-optional — SEAL
- Worker: verifier · Version: 0.1.0
- Node: `fix-project-link-optional` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #364
- New PM status: SEALED
- Note audited: `evidence/implementer/2026-11-05/fix-project-link-optional-plan.md`

## Isolation proof
Fresh Agent-tool subagent spawned with description "Verify fix-project-link-optional seal" and a verifier bundle at scratchpad `verifier-bundle.md`; no memory of the implement pass, diff never opened (note-only audit).

## Reasoning
| # | Criterion | Evidence (from note) | Result |
|---|---|---|---|
| 1 | create/update without `link` → OK | test "accepts a missing link" within `Tests: 5 passed, 5 total` | Covered |
| 2 | `link: ''` → OK | test "accepts link \"\"" (+ `'   '` trims to '') in the same 5 passed | Covered |
| 3 | `link` > 100 chars → 400 | test "rejects a link longer than 100 characters" (error path `link`) — Joi rejection that the validate middleware maps to 400 | Covered |
| 4 | covered by a test in `src/__tests__/` | new `src/__tests__/candidate_profile/project.validate.test.ts`; 511 → 516 total = +5 | Covered |
| 5 | `npm test` green | after `Tests: 5 failed, 511 passed, 516 total` vs stashed base `5 failed, 506 passed, 511 total`, same 2 env suites (`tokenExpiry`, `atsPdfIntegration`), the pre-existing pair accepted at prior seals | Covered (pre-existing only) |
| 6 | `npm run build` green / Typecheck (inside Build per MEMORY.md) | `build_exit=0` | Covered |
| 7 | Lint ≤ 274 baseline, none new in touched files | `✖ 274 problems` before = after; touched-file eslint 1 error on untouched line 10 `_id`, identical on base | Covered |
| 8 | comments per code-comments.md | row present: one 1-line WHY in test file, no source comments | Covered |

- Commands match `doctrine/MEMORY.md` (Test, Test one file, Build, Lint); output verbatim, no truncation markers.
- Forbidden states: ADHOC_WORK no (node on diagram, branch 364) · NO_EVIDENCE no · EDIT_UNVERIFIED no (typecheck + lint cited) · CODE_IN_HAVEN no · DIAGRAM_DRIFT resolved by this SEAL.
- Seal gate: no outward-facing action yet (ship pending) — none required.
- Proportionality: 2 files (validator field + new test), shared `_stringDefault` untouched; `award.validate.ts` correctly left in Noticed.
- Supersedes: none; no other open #364 row on the active diagram.

## Re-run
none — audit-only; note verbatim, commands match doctrine, every criterion cited; not outward-facing, not a release gate.
