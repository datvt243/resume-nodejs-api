# 2026-11-14 - job-applications-validate (SEAL)

- Worker: verifier · Version: 0.1.0
- Node: `job-applications-validate` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`; oldest pointer `candidate-email-self-only` dropped, 21 > 20, its full row already in the archive)
- Notes audited: `evidence/implementer/2026-11-14/job-applications-validate-plan.md`, `evidence/implementer/2026-11-14/job-applications-validate-diff.md`

## Isolation proof
Fresh Agent-tool spawn from the main session's `/todo` orchestration, task string opening "You are the VERIFIER worker of the agent-hub ... freshly spawned, independent subagent ... This is spawn=fresh, round 1." — not the implementer's task string ("#409 Job applications: validate `jobLink` as an http(s) URL — ..."). This context wrote no part of the diff.

## Reasoning
| # | Criterion (node row + feature doc) | Evidence in note | Result |
|---|---|---|---|
| 1 | absent / `""` accepted | `✓ still accepts an application without profileId`, `✓ accepts ""` | Covered |
| 2 | `http`/`https` accepted | `✓ accepts "http://acme.com/jobs/1"`, `✓ accepts "https://acme.com/jobs?id=1"` | Covered |
| 3 | `ftp://` / `javascript:` / bare text rejected | `✓ rejects "ftp://acme.com/jobs"`, `✓ rejects "javascript:alert(1)"`, `✓ rejects "acme.com/jobs"` (+ >500) | Covered |
| 4 | `fnCreate` bad `jobLink` → 400, `details` field `jobLink` (also feature doc's new acceptance line) | `✓ answers 400 with jobLink in details` | Covered |
| 5 | one-file jest passes | `Tests: 25 passed, 25 total` | Covered |
| 6 | `npm test` green | `5 failed, 669 passed, 674 total`; stashed base `5 failed, 661 passed, 666 total`, same 2 suites (`tokenExpiry` env TOKEN_EXP_IN, `atsPdfIntegration` no Chrome). Same pre-existing set accepted by prior seals (e.g. `fix-visit-real-client-ip`, `cast-legacy-localized-strings`) | Covered (0 new failures) |
| 7 | Typecheck (MEMORY: inside Build) | `npm run build` → `tsc && npm run copy`, `build exit=0` | Covered |
| 8 | Lint ≤ 274, none in changed files | `✖ 274 problems` = baseline; only touched-file hit `application.validate.ts:11:3` on untouched `_id` line, identical on base — same reading as `fix-project-link-optional`/`salary-desired-range` seals | Covered |
| 9 | comments per code-comments.md | "no comments touched" (Swagger `description` is API doc text) | Covered |
| 10 | Feature doc | `## Feature doc` cites `doctrine/features/job-applications.md`; `## Feature doc changed` carries operator answer (Open question #1, 2026-11-07) — doc shows Behavior #2 + acceptance line + Changelog row. Other doc criteria (`hired`, foreign profile) are pre-existing, already verified, covered by the same passing test file | Covered |
| 11 | Supersedes / Still open | `none` / `none` (#410 has no row) — diagram has no other #409 row | Covered |

- Commands match `doctrine/MEMORY.md` verbatim (Test, Test one file, Build/Typecheck, Lint), Run from repo root.
- Truncation: only the 500-char test name is shortened, explicitly disclosed; all summary lines verbatim — not hidden output.
- Forbidden states: ADHOC_WORK no (node on diagram, branch-local); NO_EVIDENCE no; EDIT_UNVERIFIED no; CODE_IN_HAVEN no (agent-hub changes are .md only); DIAGRAM_DRIFT resolved by this SEAL.
- Seal gate: none needed (no outward action).
- Proportionality: 3 src files (validator 1 line, tests, Swagger doc sync per `.claude/rules/api.md`) — matches node scope.
- Doctrine proposal: none. Feature doc already `verified` → Status/INDEX untouched (11e n/a).

## Re-run
none — audit-only; note is verbatim, commands match doctrine, every criterion cited; not outward-facing, not a release gate, no PROJECT.md re-run rule.
