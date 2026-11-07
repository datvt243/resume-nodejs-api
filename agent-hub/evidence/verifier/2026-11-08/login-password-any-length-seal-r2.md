# 2026-11-08 - login-password-any-length (SEAL, round 2)
- Worker: verifier · Version: 0.1.0
- Node: `login-password-any-length` (`haven/diagrams/dev-loop.prime-mermaid.md`, #390)
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`, pointer row on active diagram)
- Notes audited: `evidence/implementer/2026-11-08/login-password-any-length-diff-r2.md` (re-read from disk), plan `evidence/implementer/2026-11-08/login-password-any-length-plan.md`
- Previous verdict: `evidence/verifier/2026-11-08/login-password-any-length-reopen.md`
- Feature doc: `doctrine/features/auth-register-login.md` (Behavior #5)

## Isolation proof
Round 2 via coordinator resume message: "Round 2 of verify_seal for node `login-password-any-length`: re-read …-diff-r2.md from disk (it addresses your REOPEN …)". Original spawn description "Verify node login-password-any-length". Context holds only my round-1 verdict, no implementer reasoning.

## Reasoning
| Criterion | Verdict | Evidence cited in note |
|---|---|---|
| (1) Behavior #5 — short legacy password passes login validation; missing/empty/>128 rejected | ok | "accepts a short password that predates the current strength rules" + "rejects a missing, empty or over-long password", `Tests: 3 passed, 3 total` |
| (1) register keeps strength rules | ok | "register still enforces the strength rules" |
| (1) wrong password (incl. < 12 chars) and unknown email → 401, identical message (round-1 gap) | ok | Round 2 verbose run: "should fail if password incorrect" (`wrongpass`, 9 chars) + "should fail if user not found" (same object) + "answers a failed login with 401 INVALID_CREDENTIALS via errorsMiddleware"; `Tests: 30 skipped, 6 passed, 36 total` |
| (2) new test passes, red on old schema | ok | new `3 passed, 3 total`; old schema `1 failed, 2 passed, 3 total` |
| (3) `npm test` no new failures | ok | `5 failed, 622 passed, 627 total`; failing suites = known env ones (tokenExpiry, atsPdfIntegration), 619 + 3 new |
| (3) build/typecheck clean | ok | `npm run build \| grep -c "error TS"` → `0` (Typecheck inside Build per MEMORY.md) |
| (3) lint ≤ 274 baseline, none new in touched files | ok | `✖ 274 problems`; per-file 0 \| 0 |
| comments per code-comments.md | ok | one 1-line `//` WHY, no issue ref |
| Feature doc changed + operator answer | ok | answer recorded in doc Open questions (2026-11-07) + Changelog row; fix SEAL leaves doc Status as is |
| Supersedes / Still open | ok | none; `#390` grep → only this row |

Forbidden states: none hit. Seal gate: no outward-facing action in this pass (ship is separate). Proportionality: 1 schema rule + 1 test file, round 2 no code change. Doctrine proposal: none.
Collapse: full row appended to archive as SEALED; pointer row added; pointer count hit 21 → oldest (`localize-education-school-major`, 2026-11-02, full row already in archive) deleted.

## Re-run
none — audit-only; cited output verbatim, commands match `doctrine/MEMORY.md`.
