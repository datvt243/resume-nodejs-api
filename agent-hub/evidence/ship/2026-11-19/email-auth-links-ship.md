# Ship — email-auth-links
- Node: `email-auth-links` (SEALED, `agent-hub/evidence/verifier/2026-11-19/email-auth-links-seal.md`) · Branch: `feature/461-password-reset-email` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "feat(auth): email reset/verify links over SMTP instead of logging tokens

Reset and verification links carried live tokens in logger.info, so anyone with log access could take over an account.

- src/services/mail.ts (new): sendAuthLinkEmail via Nodemailer SMTP (SMTP_HOST/PORT/USER/PASS, MAIL_FROM, APP_URL), plain text in the ?lang= language, 10s SMTP timeouts; SMTP_HOST or APP_URL unset -> dev logs the link, prod warns without it and sends nothing
- src/auth/auth.service.ts: register and forgot-password email the link fire-and-forget (no response-time difference for registered emails, a failed send keeps the generic response and is logged by message only); prod forgot-password logs only the candidate id
- src/locales/vi.ts, en.ts: mail subject/body strings
- src/utils/passwordReset.ts, emailVerification.ts, src/routers/api/v1/auth.route.ts: stale stub comments/summaries updated
- tests: auth.service.test.ts mocks the mail module (send asserted, no token in prod logs, failure path, no await); new services/mail.test.ts with nodemailer mocked
- package.json/package-lock.json: nodemailer ^10.6.0 (6.x had open high advisories), @types/nodemailer
- .env.example, CLAUDE.md, .claude/rules/api.md, README.md: new env vars, stub wording removed

npm test: Test Suites: 76 passed, 76 total / Tests: 801 passed, 801 total
npm run build: exit 0 (tsc typecheck); lint 273 problems (<= 274 baseline), none new in changed files

Node: email-auth-links (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-19/email-auth-links-seal.md

Closes #461

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin feature/461-password-reset-email`
- `gh pr create --base staging --head feature/461-password-reset-email (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `32cbe39`
```
$ git commit -m feat(auth): email reset/verify links over SMTP instead of logging tokens

Reset and verification links carried live tokens in logger.info, so anyone with log access could take over an account.

- src/services/mail.ts (new): sendAuthLinkEmail via Nodemailer SMTP (SMTP_HOST/PORT/USER/PASS, MAIL_FROM, APP_URL), plain text in the ?lang= language, 10s SMTP timeouts; SMTP_HOST or APP_URL unset -> dev logs the link, prod warns without it and sends nothing
- src/auth/auth.service.ts: register and forgot-password email the link fire-and-forget (no response-time difference for registered emails, a failed send keeps the generic response and is logged by message only); prod forgot-password logs only the candidate id
- src/locales/vi.ts, en.ts: mail subject/body strings
- src/utils/passwordReset.ts, emailVerification.ts, src/routers/api/v1/auth.route.ts: stale stub comments/summaries updated
- tests: auth.service.test.ts mocks the mail module (send asserted, no token in prod logs, failure path, no await); new services/mail.test.ts with nodemailer mocked
- package.json/package-lock.json: nodemailer ^10.6.0 (6.x had open high advisories), @types/nodemailer
- .env.example, CLAUDE.md, .claude/rules/api.md, README.md: new env vars, stub wording removed

npm test: Test Suites: 76 passed, 76 total / Tests: 801 passed, 801 total
npm run build: exit 0 (tsc typecheck); lint 273 problems (<= 274 baseline), none new in changed files

Node: email-auth-links (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-19/email-auth-links-seal.md

Closes #461

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[feature/461-password-reset-email 32cbe39] feat(auth): email reset/verify links over SMTP instead of logging tokens
 25 files changed, 591 insertions(+), 40 deletions(-)
 create mode 100644 agent-hub/evidence/analyst/2026-11-19/password-reset-email-spec.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-19/email-auth-links-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-19/email-auth-links-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-19/email-auth-links-seal.md
 create mode 100644 src/__tests__/services/mail.test.ts
 create mode 100644 src/services/mail.ts
$ git push -u origin feature/461-password-reset-email
To https://github.com/datvt243/resume-nodejs-api.git
   7e704be..32cbe39  feature/461-password-reset-email -> feature/461-password-reset-email
branch 'feature/461-password-reset-email' set up to track 'origin/feature/461-password-reset-email'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/493
build (20.x)	pass	2m4s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44500655348/job/135479229892	
build (22.x)	pass	1m35s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44500655348/job/135479230383	
$ gh pr merge 493 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
