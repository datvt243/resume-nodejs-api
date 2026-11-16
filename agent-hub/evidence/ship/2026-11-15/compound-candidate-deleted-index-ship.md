# Ship — compound-candidate-deleted-index
- Node: `compound-candidate-deleted-index` (SEALED, `agent-hub/evidence/verifier/2026-11-15/compound-candidate-deleted-index-seal.md`) · Branch: `465-add-compound-index` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "perf(models): add compound { candidateId, deletedAt } index on CV-section models

- src/models/{application,award,certificate,education,experience,profile,project}.model.ts,
  src/models/reference.modal.ts: replace single-field candidateId index: true with
  schema.index({ candidateId: 1, deletedAt: 1 }); the prefix still serves candidateId-only lookups.
- src/__tests__/models/candidateIndex.test.ts: assert each schema declares the compound index
  and no single-field candidateId index.

npm test: Test Suites: 72 passed, 72 total; Tests: 781 passed, 781 total
npm run build: build exit 0

Note: existing DBs keep the old candidateId_1 index (Mongoose never drops indexes); drop it manually after deploy.

Node: compound-candidate-deleted-index
Evidence: agent-hub/evidence/verifier/2026-11-15/compound-candidate-deleted-index-seal.md

Closes #465

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 465-add-compound-index`
- `gh pr create --base staging --head 465-add-compound-index (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `53f614a`
```
$ git commit -m perf(models): add compound { candidateId, deletedAt } index on CV-section models

- src/models/{application,award,certificate,education,experience,profile,project}.model.ts,
  src/models/reference.modal.ts: replace single-field candidateId index: true with
  schema.index({ candidateId: 1, deletedAt: 1 }); the prefix still serves candidateId-only lookups.
- src/__tests__/models/candidateIndex.test.ts: assert each schema declares the compound index
  and no single-field candidateId index.

npm test: Test Suites: 72 passed, 72 total; Tests: 781 passed, 781 total
npm run build: build exit 0

Note: existing DBs keep the old candidateId_1 index (Mongoose never drops indexes); drop it manually after deploy.

Node: compound-candidate-deleted-index
Evidence: agent-hub/evidence/verifier/2026-11-15/compound-candidate-deleted-index-seal.md

Closes #465

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[465-add-compound-index 53f614a] perf(models): add compound { candidateId, deletedAt } index on CV-section models
 15 files changed, 207 insertions(+), 9 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-15/compound-candidate-deleted-index-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-15/compound-candidate-deleted-index-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-15/compound-candidate-deleted-index-seal.md
 create mode 100644 src/__tests__/models/candidateIndex.test.ts
$ git push -u origin 465-add-compound-index
To https://github.com/datvt243/resume-nodejs-api.git
   5d4d209..53f614a  465-add-compound-index -> 465-add-compound-index
branch '465-add-compound-index' set up to track 'origin/465-add-compound-index'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/474
build (20.x)	pass	51s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43708655328/job/132795197991	
build (22.x)	pass	41s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43708655328/job/132795197887	
$ gh pr merge 474 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
