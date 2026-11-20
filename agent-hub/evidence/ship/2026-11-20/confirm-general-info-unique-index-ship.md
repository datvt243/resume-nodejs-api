# Ship — confirm-general-info-unique-index
- Node: `confirm-general-info-unique-index` (SEALED, `agent-hub/evidence/verifier/2026-11-20/confirm-general-info-unique-index-seal.md`) · Branch: `408-general-information-confirm` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "chore(general-information): confirm unique candidateId index exists in prod

#408 was an ops check: prod resume-api.general-informations already has
candidateId_1 (UNIQUE), matching unique: true at
src/models/generalInformation.model.ts:14. No duplicate cleanup or index
build needed; no src/ change.

- agent-hub/evidence: implementer plan note + operator's Compass
  screenshot, verifier SEAL note, worker-runs.log lines
- agent-hub/haven/diagrams: node row archived as SEALED

npm test: Test Suites 76 passed, 76 total; Tests 826 passed, 826 total
npm run build: exit 0

Node: confirm-general-info-unique-index (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-20/confirm-general-info-unique-index-seal.md

Refs #408

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 408-general-information-confirm`
- `gh pr create --base staging --head 408-general-information-confirm (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `3f2041d`
```
$ git commit -m chore(general-information): confirm unique candidateId index exists in prod

#408 was an ops check: prod resume-api.general-informations already has
candidateId_1 (UNIQUE), matching unique: true at
src/models/generalInformation.model.ts:14. No duplicate cleanup or index
build needed; no src/ change.

- agent-hub/evidence: implementer plan note + operator's Compass
  screenshot, verifier SEAL note, worker-runs.log lines
- agent-hub/haven/diagrams: node row archived as SEALED

npm test: Test Suites 76 passed, 76 total; Tests 826 passed, 826 total
npm run build: exit 0

Node: confirm-general-info-unique-index (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-20/confirm-general-info-unique-index-seal.md

Refs #408

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[408-general-information-confirm 3f2041d] chore(general-information): confirm unique candidateId index exists in prod
 6 files changed, 122 insertions(+), 1 deletion(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-20/confirm-general-info-unique-index-compass.png
 create mode 100644 agent-hub/evidence/implementer/2026-11-20/confirm-general-info-unique-index-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-20/confirm-general-info-unique-index-seal.md
$ git push -u origin 408-general-information-confirm
To https://github.com/datvt243/resume-nodejs-api.git
   a6a2c65..3f2041d  408-general-information-confirm -> 408-general-information-confirm
branch '408-general-information-confirm' set up to track 'origin/408-general-information-confirm'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/498
build (20.x)	pass	59s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44739776856/job/136300199580	
build (22.x)	pass	1m19s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44739776856/job/136300199102	
$ gh pr merge 498 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
