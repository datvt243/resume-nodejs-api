# Analyst spec — #461 password reset / verify email by mail

## Task (verbatim)
Title: Password reset / email verify: tokens are written to logs instead of being emailed
Body:
## Problem
`handlerForgotPassword` (`src/auth/auth.service.ts:139`) logs the full reset link including the token (`logger.info`). Anyone with log access (log files, Render log stream) can reset any account's password. Verify-email is the same stub.
## Proposal
1. Short term: never log the token when `NODE_ENV=production` (log only that a reset was requested).
2. Add a small mail service (provider TBD — Nodemailer/SMTP or a transactional API) and send the reset/verify links.
## Acceptance
- No token value appears in prod logs
- Mail service is mockable in tests; forgot-password test asserts a send call

## Docs (updated, not new — existing INDEX rows match)
- `doctrine/features/auth-password-reset.md` — rules 7–10, criteria, edge cases, out of scope, Q1–Q7, changelog
- `doctrine/features/auth-register-login.md` — rules 10–11, criteria, Q8, changelog
- `doctrine/features/INDEX.md` — both rows: `#461 additions draft`, issue added
Rules 1–6 / 1–9 stay verified; only the #461 additions are draft.

## Sources read
- `doctrine/domains/PROJECT.md`, `doctrine/MEMORY.md`, `doctrine/features/INDEX.md`
- `src/auth/auth.service.ts` (lines 55–80 register log at :71, 128–142 forgot-password log at :138)
- `src/__tests__/auth/auth.service.test.ts` (logger + passwordReset/emailVerification mocks, forgot-password tests :197–218)
- `src/routers/api/v1/auth.route.ts` (reset-password POST :223, verify-email GET :251)
- `src/config/process.config.ts` (NODE_ENV), `package.json` (no mail dependency), grep for a frontend/base-URL env var (none found)

## Questions + answers (round 1 — all unanswered)
Q1 provider · Q2 sender/env var · Q3 link base URL + env var · Q4 language/format · Q5 send-failure response · Q6 prod log content · Q7 no-provider behavior (dev + prod) · Q8 verify link target (API vs frontend). Full text in the two docs.

## Isolation proof
Spawned as a separate analyst subagent with only the issue text + bundle paths; no implementer reasoning, diff or plan was provided. Everything above came from files read in this spawn.

## Round 2 — operator answers (2026-11-19, via coordinator, verbatim)
Q1: Nodemailer over SMTP (config via SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS; provider-agnostic).
Q2: From address from env MAIL_FROM.
Q3: Frontend base URL from env APP_URL; reset link = APP_URL/reset-password?token=...
Q4: Language follows request ?lang= (vi/en); plain text only.
Q5: Send failure → still return the generic 200; log the error without the token.
Q6: Prod log on reset request: candidate id only (no email/PII).
Q7: Non-production with no SMTP configured → keep logging the full link to console as today. Production with no SMTP configured → log a warning (no token) and skip sending; do not fail startup.
Q8: Verification link → frontend APP_URL/verify-email?token=...

Folded into both docs; Q1–Q8 closed. Residual note Q9 (`APP_URL` unset while SMTP set → treat as not configured) recorded as implementer guidance, does not change Behavior. Register send failure keeps 201 (derived from Q5, same principle).

## Status
needs_input (round 1) → spec_ready (round 2)
