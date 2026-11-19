# Ship — fix-access-token-jti
- Node: `fix-access-token-jti` (SEALED, `agent-hub/evidence/verifier/2026-11-18/fix-access-token-jti-seal.md`) · Branch: `fix/490-access-token-jti` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "fix(auth): give every JWT a unique jti so same-second sessions don't collide

Access tokens were signed with { _id } only, so two issued for one candidate in the same second were byte-identical and logging out one session blacklisted the other.

- src/utils/jwt.ts: jwtSign sets jwtid: crypto.randomUUID() on every token (access and refresh)
- src/auth/auth.service.ts, src/auth/auth.controller.ts: drop the hand-built refresh jti (jsonwebtoken rejects payload jti + jwtid) and the now-unused crypto import
- tests: new src/__tests__/utils/jwt.test.ts; integration test for two same-second logins where logout of one leaves the other at 200; caller unit tests and refreshTokenReuse helper adjusted
- .claude/rules/api.md: auth flow payload now { _id, jti }
- agent-hub: ship note for auth-http-integration-tests

npm test: Test Suites: 75 passed, 75 total / Tests: 792 passed, 792 total
npm run build: exit 0 (tsc exit 0); lint 273 problems (<= 274 baseline), none new in changed files

Node: fix-access-token-jti (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-18/fix-access-token-jti-seal.md

Closes #490

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin fix/490-access-token-jti`
- `gh pr create --base staging --head fix/490-access-token-jti (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `df91bcc`
```
$ git commit -m fix(auth): give every JWT a unique jti so same-second sessions don't collide

Access tokens were signed with { _id } only, so two issued for one candidate in the same second were byte-identical and logging out one session blacklisted the other.

- src/utils/jwt.ts: jwtSign sets jwtid: crypto.randomUUID() on every token (access and refresh)
- src/auth/auth.service.ts, src/auth/auth.controller.ts: drop the hand-built refresh jti (jsonwebtoken rejects payload jti + jwtid) and the now-unused crypto import
- tests: new src/__tests__/utils/jwt.test.ts; integration test for two same-second logins where logout of one leaves the other at 200; caller unit tests and refreshTokenReuse helper adjusted
- .claude/rules/api.md: auth flow payload now { _id, jti }
- agent-hub: ship note for auth-http-integration-tests

npm test: Test Suites: 75 passed, 75 total / Tests: 792 passed, 792 total
npm run build: exit 0 (tsc exit 0); lint 273 problems (<= 274 baseline), none new in changed files

Node: fix-access-token-jti (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-18/fix-access-token-jti-seal.md

Closes #490

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[fix/490-access-token-jti df91bcc] fix(auth): give every JWT a unique jti so same-second sessions don't collide
 16 files changed, 279 insertions(+), 17 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-18/fix-access-token-jti-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-18/fix-access-token-jti-plan.md
 create mode 100644 agent-hub/evidence/ship/2026-11-18/auth-http-integration-tests-ship.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-18/fix-access-token-jti-seal.md
 create mode 100644 src/__tests__/utils/jwt.test.ts
$ git push -u origin fix/490-access-token-jti
To https://github.com/datvt243/resume-nodejs-api.git
   de5fd4f..df91bcc  fix/490-access-token-jti -> fix/490-access-token-jti
branch 'fix/490-access-token-jti' set up to track 'origin/fix/490-access-token-jti'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/491
build (20.x)	pass	1m12s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44279792722/job/134717130395	
build (22.x)	pass	1m5s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44279792722/job/134717130906	
$ gh pr merge 491 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
