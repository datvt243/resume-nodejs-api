# Ship — job-applications-status-transitions
- Node: `job-applications-status-transitions` (SEALED, `agent-hub/evidence/verifier/2026-11-15/job-applications-status-transitions-seal.md`) · Branch: `410-job-applications-add` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "feat(application): add accepted status and enforce status transitions

- model/validate: APPLICATION_STATUSES adds `accepted`
- service: update checks the stored status (QuerySafe _id + candidateId, non-deleted, withDBTimeout) — same status OK, forward by rank applied < interview < offer (skips allowed), `accepted` only from `offer`, applied/interview/offer -> `rejected`, `accepted`/`rejected` final; else 400 application.statusTransitionInvalid (vi + en). Create takes any status.
- swagger + .claude/rules/models.md: status enum + rules
- tests: transition matrix, create at any status, scoped lookup, 400 en/vi writes nothing

npm test: Test Suites: 71 passed, 71 total / Tests: 773 passed, 773 total
npm run build: exit 0

Node: job-applications-status-transitions (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-15/job-applications-status-transitions-seal.md

Closes #410

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 410-job-applications-add`
- `gh pr create --base staging --head 410-job-applications-add (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `c8eb552`
```
$ git commit -m feat(application): add accepted status and enforce status transitions

- model/validate: APPLICATION_STATUSES adds `accepted`
- service: update checks the stored status (QuerySafe _id + candidateId, non-deleted, withDBTimeout) — same status OK, forward by rank applied < interview < offer (skips allowed), `accepted` only from `offer`, applied/interview/offer -> `rejected`, `accepted`/`rejected` final; else 400 application.statusTransitionInvalid (vi + en). Create takes any status.
- swagger + .claude/rules/models.md: status enum + rules
- tests: transition matrix, create at any status, scoped lookup, 400 en/vi writes nothing

npm test: Test Suites: 71 passed, 71 total / Tests: 773 passed, 773 total
npm run build: exit 0

Node: job-applications-status-transitions (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-15/job-applications-status-transitions-seal.md

Closes #410

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[410-job-applications-add c8eb552] feat(application): add accepted status and enforce status transitions
 14 files changed, 310 insertions(+), 7 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-15/job-applications-status-transitions-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-15/job-applications-status-transitions-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-15/job-applications-status-transitions-seal.md
$ git push -u origin 410-job-applications-add
To https://github.com/datvt243/resume-nodejs-api.git
   879202c..c8eb552  410-job-applications-add -> 410-job-applications-add
branch '410-job-applications-add' set up to track 'origin/410-job-applications-add'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/473
build (20.x)	pass	1m8s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43707322937/job/132791101127	
build (22.x)	pass	53s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43707322937/job/132791101355	
$ gh pr merge 473 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
