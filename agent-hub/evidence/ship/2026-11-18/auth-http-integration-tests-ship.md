# Ship — auth-http-integration-tests
- Node: `auth-http-integration-tests` (SEALED, `agent-hub/evidence/verifier/2026-11-18/auth-http-integration-tests-seal.md`) · Branch: `chore/463-auth-integration-tests` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "test(auth): add HTTP-level integration tests for the auth flow

- src/server.ts: extract the middleware chain into exported createApp(); startServer() and the unhandledRejection handler run only when the file is the entry point (require.main === module)
- src/__tests__/integration/auth.http.test.ts: supertest + mongodb-memory-server over the real chain (register/login/GET/refresh/logout with token rejected after; rotated refresh reuse after 10s grace revokes all sessions; cookie-only POST without CSRF -> 403; client candidateId ignored; unknown route -> 404 standard shape; Redis absent -> in-memory fallback)
- package.json/package-lock.json: dev deps supertest, @types/supertest, mongodb-memory-server
- CLAUDE.md: middleware order now lives in createApp

npm test: Test Suites: 74 passed, 74 total / Tests: 790 passed, 790 total
npm run build: exit 0 (tsc exit 0); lint 273 problems (<= 274 baseline), none new in changed files

Node: auth-http-integration-tests (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-18/auth-http-integration-tests-seal.md

Closes #463

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin chore/463-auth-integration-tests`
- `gh pr create --base staging --head chore/463-auth-integration-tests (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `f942b99`
```
$ git commit -m test(auth): add HTTP-level integration tests for the auth flow

- src/server.ts: extract the middleware chain into exported createApp(); startServer() and the unhandledRejection handler run only when the file is the entry point (require.main === module)
- src/__tests__/integration/auth.http.test.ts: supertest + mongodb-memory-server over the real chain (register/login/GET/refresh/logout with token rejected after; rotated refresh reuse after 10s grace revokes all sessions; cookie-only POST without CSRF -> 403; client candidateId ignored; unknown route -> 404 standard shape; Redis absent -> in-memory fallback)
- package.json/package-lock.json: dev deps supertest, @types/supertest, mongodb-memory-server
- CLAUDE.md: middleware order now lives in createApp

npm test: Test Suites: 74 passed, 74 total / Tests: 790 passed, 790 total
npm run build: exit 0 (tsc exit 0); lint 273 problems (<= 274 baseline), none new in changed files

Node: auth-http-integration-tests (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-18/auth-http-integration-tests-seal.md

Closes #463

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[chore/463-auth-integration-tests f942b99] test(auth): add HTTP-level integration tests for the auth flow
 11 files changed, 1293 insertions(+), 247 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-18/auth-http-integration-tests-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-18/auth-http-integration-tests-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-18/auth-http-integration-tests-seal.md
 create mode 100644 src/__tests__/integration/auth.http.test.ts
$ git push -u origin chore/463-auth-integration-tests
To https://github.com/datvt243/resume-nodejs-api.git
   33fcfb1..f942b99  chore/463-auth-integration-tests -> chore/463-auth-integration-tests
branch 'chore/463-auth-integration-tests' set up to track 'origin/chore/463-auth-integration-tests'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/489
build (20.x)	pass	2m4s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44277592330/job/134709638410	
build (22.x)	pass	1m59s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44277592330/job/134709639854	
$ gh pr merge 489 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
