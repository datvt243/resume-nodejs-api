# Ship — config-fail-fast
- Node: `config-fail-fast` (SEALED, `agent-hub/evidence/verifier/2026-11-14/config-fail-fast-seal.md`) · Branch: `458-config-fail-fast` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "fix(config): fail fast at startup when required env vars are missing

Closes #458

- src/config/process.config.ts: replace the warn-only required-vars list
  with checkEnv(), a Joi schema run at import. TOKEN_SECRET/TOKEN_REFRESH/
  SESSION_SECRET required, min 32 chars; MONGOBD_USER/MONGOBD_PASSWORD
  required only without MONGO_URI; LOCAL_PORT/MONGO_*_POOL_SIZE/
  TRUST_PROXY_HOPS optional numbers; blank KEY= treated as unset.
  NODE_ENV=production + any error -> throw before listen (exit 1, every
  failing var named); elsewhere only missing vars are warned about.
- src/__tests__/config/process.config.test.ts: schema unit tests (prod
  missing/short secret, MONGO_URI-only, no Mongo config, non-number vars,
  blank vars, dev warn-only)
- agent-hub: feature doc startup-config-env.md (backfill + operator
  decisions), node + evidence

npx jest src/__tests__/config/: 43 passed, 43 total
npm test: 5 failed, 703 passed, 708 total (same 5 env-only failures on
staging: tokenExpiry local TOKEN_EXP_IN, atsPdfIntegration no Chrome)
npm run build: exit 0 · npm run lint: 274 (= baseline), none in changed files
Real boot: production + short TOKEN_SECRET -> exit 1, nothing listens;
development + unset TOKEN_SECRET -> warning, keeps running

Node: config-fail-fast (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-14/config-fail-fast-seal.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 458-config-fail-fast`
- `git checkout staging`

## Output
Commit: `48ce123`
```
$ git commit -m fix(config): fail fast at startup when required env vars are missing

Closes #458

- src/config/process.config.ts: replace the warn-only required-vars list
  with checkEnv(), a Joi schema run at import. TOKEN_SECRET/TOKEN_REFRESH/
  SESSION_SECRET required, min 32 chars; MONGOBD_USER/MONGOBD_PASSWORD
  required only without MONGO_URI; LOCAL_PORT/MONGO_*_POOL_SIZE/
  TRUST_PROXY_HOPS optional numbers; blank KEY= treated as unset.
  NODE_ENV=production + any error -> throw before listen (exit 1, every
  failing var named); elsewhere only missing vars are warned about.
- src/__tests__/config/process.config.test.ts: schema unit tests (prod
  missing/short secret, MONGO_URI-only, no Mongo config, non-number vars,
  blank vars, dev warn-only)
- agent-hub: feature doc startup-config-env.md (backfill + operator
  decisions), node + evidence

npx jest src/__tests__/config/: 43 passed, 43 total
npm test: 5 failed, 703 passed, 708 total (same 5 env-only failures on
staging: tokenExpiry local TOKEN_EXP_IN, atsPdfIntegration no Chrome)
npm run build: exit 0 · npm run lint: 274 (= baseline), none in changed files
Real boot: production + short TOKEN_SECRET -> exit 1, nothing listens;
development + unset TOKEN_SECRET -> warning, keeps running

Node: config-fail-fast (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-14/config-fail-fast-seal.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[458-config-fail-fast 48ce123] fix(config): fail fast at startup when required env vars are missing
 11 files changed, 390 insertions(+), 8 deletions(-)
 create mode 100644 agent-hub/doctrine/features/startup-config-env.md
 create mode 100644 agent-hub/evidence/analyst/2026-11-14/startup-config-env-spec.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-14/config-fail-fast-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-14/config-fail-fast-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-14/config-fail-fast-seal.md
 create mode 100644 src/__tests__/config/process.config.test.ts
$ git push -u origin 458-config-fail-fast
To https://github.com/datvt243/resume-nodejs-api.git
   b4ea8f8..48ce123  458-config-fail-fast -> 458-config-fail-fast
branch '458-config-fail-fast' set up to track 'origin/458-config-fail-fast'.
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
# Ship — config-fail-fast
- Node: `config-fail-fast` (SEALED, `agent-hub/evidence/verifier/2026-11-14/config-fail-fast-seal.md`) · Branch: `458-config-fail-fast` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "chore(agent-hub): ship note for config-fail-fast

Adds the ship evidence for commit 48ce123 (fix(config): fail fast at
startup when required env vars are missing).

npm test: 5 failed, 703 passed, 708 total (same 5 env-only failures on
staging: tokenExpiry local TOKEN_EXP_IN, atsPdfIntegration no Chrome)
npm run build: exit 0

Node: config-fail-fast (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-14/config-fail-fast-seal.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 458-config-fail-fast`
- `gh pr create --base staging --head 458-config-fail-fast (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `094afeb`
```
$ git commit -m chore(agent-hub): ship note for config-fail-fast

Adds the ship evidence for commit 48ce123 (fix(config): fail fast at
startup when required env vars are missing).

npm test: 5 failed, 703 passed, 708 total (same 5 env-only failures on
staging: tokenExpiry local TOKEN_EXP_IN, atsPdfIntegration no Chrome)
npm run build: exit 0

Node: config-fail-fast (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-14/config-fail-fast-seal.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[458-config-fail-fast 094afeb] chore(agent-hub): ship note for config-fail-fast
 1 file changed, 82 insertions(+)
 create mode 100644 agent-hub/evidence/ship/2026-11-15/config-fail-fast-ship.md
$ git push -u origin 458-config-fail-fast
To https://github.com/datvt243/resume-nodejs-api.git
   48ce123..094afeb  458-config-fail-fast -> 458-config-fail-fast
branch '458-config-fail-fast' set up to track 'origin/458-config-fail-fast'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/468
build (20.x)	pass	1m31s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43704142563/job/132781478073	
build (22.x)	pass	1m11s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43704142563/job/132781477847	
$ gh pr merge 468 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
