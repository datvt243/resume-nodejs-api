# Ship — job-applications-validate
- Node: `job-applications-validate` (SEALED, `agent-hub/evidence/verifier/2026-11-14/job-applications-validate-seal.md`) · Branch: `409-job-applications-validate` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "feat(application): validate jobLink as an http(s) URL

jobLink stays optional ('' or absent), but when present it must be an
http/https URL, else 400 with `details[].field = "jobLink"`.

- application.validate.ts: jobLink adds .uri({ scheme: ['http', 'https'] }),
  same idiom as award.link
- application.service.test.ts: schema accept/reject cases + create with a
  non-http(s) jobLink → 400 with jobLink in details (8 new tests)
- swagger.config.ts: document the jobLink rule
- agent-hub: feature doc job-applications.md Behavior #2 + changelog,
  node evidence, diagram

Tests: npx jest application.service.test.ts → 25 passed, 25 total;
npm test → 5 failed, 669 passed, 674 total (same 5 env-only failures on
base: tokenExpiry local TOKEN_EXP_IN, atsPdfIntegration no Chrome);
npm run build → exit 0; lint 274 = baseline.

Node: job-applications-validate (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-14/job-applications-validate-seal.md

Closes #409

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 409-job-applications-validate`
- `gh pr create --base staging --head 409-job-applications-validate (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `e4c73f2`
```
$ git commit -m feat(application): validate jobLink as an http(s) URL

jobLink stays optional ('' or absent), but when present it must be an
http/https URL, else 400 with `details[].field = "jobLink"`.

- application.validate.ts: jobLink adds .uri({ scheme: ['http', 'https'] }),
  same idiom as award.link
- application.service.test.ts: schema accept/reject cases + create with a
  non-http(s) jobLink → 400 with jobLink in details (8 new tests)
- swagger.config.ts: document the jobLink rule
- agent-hub: feature doc job-applications.md Behavior #2 + changelog,
  node evidence, diagram

Tests: npx jest application.service.test.ts → 25 passed, 25 total;
npm test → 5 failed, 669 passed, 674 total (same 5 env-only failures on
base: tokenExpiry local TOKEN_EXP_IN, atsPdfIntegration no Chrome);
npm run build → exit 0; lint 274 = baseline.

Node: job-applications-validate (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-14/job-applications-validate-seal.md

Closes #409

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[409-job-applications-validate e4c73f2] feat(application): validate jobLink as an http(s) URL
 10 files changed, 190 insertions(+), 4 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-14/job-applications-validate-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-14/job-applications-validate-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-14/job-applications-validate-seal.md
$ git push -u origin 409-job-applications-validate
To https://github.com/datvt243/resume-nodejs-api.git
   72cd118..e4c73f2  409-job-applications-validate -> 409-job-applications-validate
branch '409-job-applications-validate' set up to track 'origin/409-job-applications-validate'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/457
build (20.x)	pass	1m6s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43585308131/job/132418414096	
build (22.x)	pass	54s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43585308131/job/132418414360	
$ gh pr merge 457 --merge
```

## Seal gate
Approved by the operator before the run (`--yes`), covering the whole chain above.
