# Ship — logout-refresh-token-header
- Node: `logout-refresh-token-header` (SEALED, `agent-hub/evidence/verifier/2026-11-17/logout-refresh-token-header-seal.md`) · Branch: `fix/475-logout-refresh-token` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "fix(auth): logout blacklists the real refresh token, not the access token twice

authLogout looked up refreshToken via extractTokenFromRequest, which returns
the Authorization header first; logout always carries Bearer <access>, so the
body/cookie refresh token was never revoked and could still mint a new pair.

- src/utils/helper-auth.ts: extractTokenWithSource/extractTokenFromRequest take
  an optional allowHeader (default true, every existing caller unchanged)
- src/auth/auth.controller.ts: authLogout's refresh lookup skips the header;
  /auth/refresh keeps accepting Bearer <refresh>
- src/__tests__/auth/auth.controller.test.ts: logout test runs the real helper
  with Bearer access + body refreshToken (red on the old code)
- agent-hub: feature doc Behavior #7 amended (operator-approved), node + evidence

npm test: Tests: 781 passed, 781 total
npm run build: exit 0
Node: logout-refresh-token-header (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-17/logout-refresh-token-header-seal.md

Closes #475

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin fix/475-logout-refresh-token`
- `gh pr create --base staging --head fix/475-logout-refresh-token (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `0d2ee3c`
```
$ git commit -m fix(auth): logout blacklists the real refresh token, not the access token twice

authLogout looked up refreshToken via extractTokenFromRequest, which returns
the Authorization header first; logout always carries Bearer <access>, so the
body/cookie refresh token was never revoked and could still mint a new pair.

- src/utils/helper-auth.ts: extractTokenWithSource/extractTokenFromRequest take
  an optional allowHeader (default true, every existing caller unchanged)
- src/auth/auth.controller.ts: authLogout's refresh lookup skips the header;
  /auth/refresh keeps accepting Bearer <refresh>
- src/__tests__/auth/auth.controller.test.ts: logout test runs the real helper
  with Bearer access + body refreshToken (red on the old code)
- agent-hub: feature doc Behavior #7 amended (operator-approved), node + evidence

npm test: Tests: 781 passed, 781 total
npm run build: exit 0
Node: logout-refresh-token-header (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-17/logout-refresh-token-header-seal.md

Closes #475

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[fix/475-logout-refresh-token 0d2ee3c] fix(auth): logout blacklists the real refresh token, not the access token twice
 10 files changed, 185 insertions(+), 10 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-17/logout-refresh-token-header-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-17/logout-refresh-token-header-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-17/logout-refresh-token-header-seal.md
$ git push -u origin fix/475-logout-refresh-token
To https://github.com/datvt243/resume-nodejs-api.git
   7bb612f..0d2ee3c  fix/475-logout-refresh-token -> fix/475-logout-refresh-token
branch 'fix/475-logout-refresh-token' set up to track 'origin/fix/475-logout-refresh-token'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/482
build (20.x)	pass	1m42s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44048449089/job/133919898982	
build (22.x)	pass	1m45s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44048449089/job/133919898382	
$ gh pr merge 482 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
