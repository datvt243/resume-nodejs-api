# 2026-11-08 - login-password-any-length (REOPEN)
- Worker: verifier · Version: 0.1.0
- Node: `login-password-any-length` (`haven/diagrams/dev-loop.prime-mermaid.md`, #390)
- New PM status: unchanged (IN_PROGRESS) — REOPEN is a verdict, not a state
- Notes audited: `evidence/implementer/2026-11-08/login-password-any-length-plan.md`, `evidence/implementer/2026-11-08/login-password-any-length-diff.md`
- Feature doc: `doctrine/features/auth-register-login.md` (Behavior #5)

## Isolation proof
Fresh Agent spawn, description "Verify node login-password-any-length" (not the implementer's `/todo #390` task string); no implement-pass reasoning in this context.

## Reasoning
| Criterion | Verdict | Evidence cited in note |
|---|---|---|
| (1) Behavior #5 — short legacy password passes login validation; missing/empty/>128 rejected | ok | `auth.validate.test.ts` "accepts a short password…" + "rejects a missing, empty or over-long password", `Tests: 3 passed, 3 total` |
| (1) register keeps strength rules | ok | "register still enforces the strength rules" |
| (1) wrong password stays 401 (+ doc acceptance: wrong password and unknown email → both 401, identical `error.message`) | MISSING | only "service not touched" (reasoning) + bare `68 passed` for `src/__tests__/auth`; no named test line proving 401 / identical message; the newly reachable path (short password now reaches `authLogin`) has no cited evidence |
| (2) new test passes, red on old schema | ok | new: `3 passed, 3 total`; old schema: `1 failed, 2 passed, 3 total` |
| (3) `npm test` no new failures | ok | `5 failed, 622 passed, 627 total`; 2 failing suites = known env failures (tokenExpiry, atsPdfIntegration), 619 + 3 new |
| (3) build/typecheck clean | ok | `npm run build \| grep -c "error TS"` → `0` (Typecheck = inside Build per MEMORY.md) |
| (3) lint ≤ 274, none new in touched files | ok | `✖ 274 problems`; per-file 0 \| 0 |
| comments per code-comments.md | ok | one 1-line `//` WHY, no issue ref |
| Feature doc changed + operator answer | ok | operator answer recorded in doc Open questions (2026-11-07) + Changelog row |
| Supersedes / Still open | ok | none; `#390` grep → only this row |

Forbidden states: none hit (node exists, notes exist, no code in haven/, PM status not drifted). Seal gate: none needed in this pass. Proportionality: 1 schema rule + 1 test file — minimal. Doctrine proposal: none.

## Missing
1. Cited evidence for "wrong password → 401": a named passing test line (verbatim output) asserting login with a wrong password and with an unknown email both return 401 with identical `error.message` — and since short passwords now reach the service, one case with a short (< 12 char) wrong password (existing test if one covers it, else add one). "Service not touched" is reasoning, not evidence.

## Re-run
none — audit-only; REOPEN on a missing citation, no re-run per "Re-run scope".
