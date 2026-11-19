# 2026-11-19 - email-auth-links - verdict: SEAL
Worker: verifier · Node: `email-auth-links` (#461) · Notes: `evidence/implementer/2026-11-19/email-auth-links-plan.md`, `...-diff.md`

## Isolation proof
Fresh Agent-tool subagent spawned by `/todo` pass 2, spawn=fresh, round 1; task string "agent-hub VERIFIER worker, a fresh independent pass (you never saw the implementer's session)". No prior context of the implement pass.

## Re-run
none — audit-only: verbatim output, commands match `doctrine/MEMORY.md`, node is not outward-facing (no push/deploy; code only, no mail sent).

## Criteria (each cited from the note)
- reset: mail mock called once with email + link containing token; not called for unregistered — `✓ creates a reset token and emails the link…`, `✓ returns the same generic…`.
- reset: prod → no logger arg has `raw-token` — `✓ never logs the reset token in production…`.
- reset: mail rejects → generic success, error log without token — `✓ still returns the generic message when sending fails…`.
- reset: prod + no SMTP_HOST → warn, no send, no token — mail.test `✓ in production with SMTP_HOST missing…` (+ APP_URL missing, Q9).
- register: mail called once with new email + token link; prod no token; failure → still success — `✓ should register successfully…`, `✓ never logs the verification token in production and still succeeds…`.
- Targeted jest 23 passed; `npm test` 801 passed / 76 suites; `npm run build` BUILD_EXIT=0 (Typecheck = inside Build, per MEMORY).
- Lint: 273 ≤ baseline 274 (cited); touched files 10 before = 10 after (same pre-existing `unbound-method`), new files 0.
- Red-before shown: 5 new tests fail on base `auth.service.ts`.
- Comments per code-comments.md: row present with touched comments cited; spot-read `src/services/mail.ts` (file overview, `/** */` WHY on export, `//` WHY on env read and timeouts) consistent.
- Feature doc line present (auth-password-reset 7–11, auth-register-login 10–11); doc unchanged by implementer, operator answers recorded (Q9, register 201).
- Review present: `/code-review medium` 8 findings each fixed or stated reason; `/security-review` run (issue labeled security), no finding >= 8. Noticed-not-done items listed.
- Supersedes none / Still open none; `grep "#461"` shows only this node.
- Seal gate: no outward-facing action; proportionality OK (mail module, 2 call sites, locales, tests, env docs, dep with audit upgrade to 10.6.0).

## Forbidden states
None hit. Node exists on the diagram (PENDING, ratchet forward only); no code in `haven/`; evidence real; single SEAL verdict.

## Non-blocking observations
- Feature docs still say "(draft)" and the edge case "`APP_URL` missing → open question Q9"; Q9 is answered (not configured). Analyst follow-up; doc Status left unchanged (rules 7–11 / 10–11 are a fix to an already verified doc, per recipe 11e only a `feat` implementing a `draft` doc flips status; these additions remain operator-confirmed drafts).
- Implementer's Noticed #1, #4, #5 (staging NODE_ENV, requireTLS, address in SMTP error log) are operator calls.

## PM status
`email-auth-links` PENDING → SEALED, archived to `haven/diagrams/dev-loop-archive.md`.
