# 2026-08-25 — forgot-password-reset-flow (pick_next)

- Worker: implementer
- Version: 0.1.0
- Node: none yet (no matching PENDING node on `haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "Issue #70: Forgot password / reset password flow —
  POST /api/v1/auth/forgot-password + POST /api/v1/auth/reset-password"

## pick_next steps followed
1. Read `NORTHSTAR.md`, `doctrine/MEMORY.md`, `doctrine/domains/PROJECT.md` — done this session (`/boot`).
2. Read `haven/diagrams/dev-loop.prime-mermaid.md` PM status table — 12 nodes, none named
   `forgot-password`/`reset-password`/anything matching issue #70.
3. No PENDING node matches this task → per recipe step 4/6, cannot invent work silently;
   per `pick_next.md` "Task is ambiguous" failure branch → stop and ask, don't guess.

## Research done (code anchors, real paths)
- `grep -iE "mail|smtp|sendgrid|ses|resend|postmark" package.json` → no match. No email-sending
  dependency installed anywhere in the project.
- `grep -riE "smtp|mail" .env*` → only `ACCOUNT_TEST_EMAIL=votan.it@gmail.com` in `.env`
  (a test-account email address, not SMTP/mail-provider config).
- `src/utils/tokenBlacklist.ts:1-40` — confirmed as the existing single-use/TTL token pattern
  (Redis `setEx` + in-memory Map fallback) that a reset-token store would follow, per the issue's
  own suggestion.
- No existing route/controller/service anywhere under `src/` for forgot-password or reset-password.

## Why blocked (ambiguous, not guessed)
GitHub issue #70 body states directly: "No email-sending infra exists yet, so this issue should
probably also decide/scope that dependency (could be split into two issues if the email provider
choice needs its own discussion)." Confirmed true by the grep above — there is zero mail
infrastructure in this repo today.

Implementing `/forgot-password` requires actually sending an email, which requires picking one of:
- nodemailer + SMTP credentials (needs an SMTP account: which provider, new env vars)
- a transactional email API (SendGrid/SES/Resend/Postmark — needs an account + API key + new dep)
- deferring email delivery (e.g. log the reset link/token instead of emailing it) as a stand-in
  until a provider is chosen

This is an operator-level product/infra decision (which service, whether to pay for one, what env
vars to add to `.env.example`), not something `SmallestDiff`/`NodeBeforeCode` implementer judgment
should invent. Recipe `pick_next.md` failure branch: "Task is ambiguous | Stop and ask, don't
guess" — followed.

## Status
`blocked` — no diagram node created yet (would be `CODE_IN_HAVEN`-adjacent to draft a node around
an unscoped decision). Asked operator to choose the email-delivery approach before a DRAFT node is
created and `implement` runs.

## Seal gate
None — no `src/` change made, nothing outward-facing.
