# Ship — account-settings
- Node: `account-settings` (SEALED, `agent-hub/evidence/verifier/2026-11-20/account-settings-seal.md`) · Branch: `feature/412-change-password-email` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "feat(auth): change password and change email for a signed-in candidate

- auth routes (v1): POST /change-password, POST /change-email (authLimiter + verifyToken), GET /confirm-email-change
- auth.service: current-password check (400 on mismatch), change-password revokes every session then issues the caller a fresh pair; change-email emails a 24h single-use confirm link to the new address, email changes only on confirm (uniqueness re-checked, emailVerified set, old address noticed); a revocation after the request cancels a pending change
- utils/emailChange.ts: single-use change-email token store (Redis + in-memory fallback)
- services/mail.ts: confirmEmailChange + emailChanged kinds, one-pass {placeholder} params
- locales en/vi, swagger, .claude/rules/api.md, README
- tests: service, validate, route wiring, mail, real-HTTP integration flows

npm test: Test Suites: 76 passed, 76 total; Tests: 826 passed, 826 total
npm run build: BUILD_EXIT=0
Node: account-settings (SEALED) — agent-hub/evidence/verifier/2026-11-20/account-settings-seal.md

Closes #412

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin feature/412-change-password-email`
- `gh pr create --base staging --head feature/412-change-password-email (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `3e76d83`
```
$ git commit -m feat(auth): change password and change email for a signed-in candidate

- auth routes (v1): POST /change-password, POST /change-email (authLimiter + verifyToken), GET /confirm-email-change
- auth.service: current-password check (400 on mismatch), change-password revokes every session then issues the caller a fresh pair; change-email emails a 24h single-use confirm link to the new address, email changes only on confirm (uniqueness re-checked, emailVerified set, old address noticed); a revocation after the request cancels a pending change
- utils/emailChange.ts: single-use change-email token store (Redis + in-memory fallback)
- services/mail.ts: confirmEmailChange + emailChanged kinds, one-pass {placeholder} params
- locales en/vi, swagger, .claude/rules/api.md, README
- tests: service, validate, route wiring, mail, real-HTTP integration flows

npm test: Test Suites: 76 passed, 76 total; Tests: 826 passed, 826 total
npm run build: BUILD_EXIT=0
Node: account-settings (SEALED) — agent-hub/evidence/verifier/2026-11-20/account-settings-seal.md

Closes #412

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[feature/412-change-password-email 3e76d83] feat(auth): change password and change email for a signed-in candidate
 25 files changed, 1198 insertions(+), 25 deletions(-)
 create mode 100644 agent-hub/doctrine/features/account-settings.md
 create mode 100644 agent-hub/evidence/analyst/2026-11-20/account-settings-spec-r2.md
 create mode 100644 agent-hub/evidence/analyst/2026-11-20/account-settings-spec.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-20/account-settings-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-20/account-settings-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-20/account-settings-seal.md
 create mode 100644 src/utils/emailChange.ts
$ git push -u origin feature/412-change-password-email
To https://github.com/datvt243/resume-nodejs-api.git
   f46e58b..3e76d83  feature/412-change-password-email -> feature/412-change-password-email
branch 'feature/412-change-password-email' set up to track 'origin/feature/412-change-password-email'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/497
build (20.x)	pass	1m10s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44737428988/job/136292234189	
build (22.x)	pass	56s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44737428988/job/136292233858	
$ gh pr merge 497 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
