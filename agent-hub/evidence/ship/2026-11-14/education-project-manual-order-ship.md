# Ship — education-project-manual-order
- Node: `education-project-manual-order` (SEALED, `agent-hub/evidence/verifier/2026-11-14/education-project-manual-order-seal.md`) · Branch: `413-education-project-store` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "feat(cv-sections): store a manual display order for education and project

Closes #413

- models/validate: education + project get an optional `order`; create/
  update/bulk accept `order` in the body and ignore it
- services/index.ts: byManualOrder (order asc, entries without one last by
  startDate desc), baseFindDocument `manualOrder`, baseReorderDocuments
  (full own non-deleted id list required; unknown/foreign/deleted id → 400
  at ids.<i>, missing entry → 400 at ids; nothing written on error)
- BaseController + routes: PUT /api/v1/education/reorder and
  /api/v1/project/reorder; owner GET list (no ?sort) uses the same order
- candidate_me: public profile, public PDF, owner export and ATS check list
  educations/projects in that order; experience unchanged
- locales, swagger, .claude/rules docs; +18 tests

npm test: 5 failed, 687 passed, 692 total (same 5 env-only failures on
base: tokenExpiry local TOKEN_EXP_IN, atsPdfIntegration no Chrome)
npm run build: exit 0 · npm run lint: 274 (= baseline, per-file identical)

Node: education-project-manual-order (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-14/education-project-manual-order-seal.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 413-education-project-store`
- `gh pr create --base staging --head 413-education-project-store (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `ba8ce8a`
```
$ git commit -m feat(cv-sections): store a manual display order for education and project

Closes #413

- models/validate: education + project get an optional `order`; create/
  update/bulk accept `order` in the body and ignore it
- services/index.ts: byManualOrder (order asc, entries without one last by
  startDate desc), baseFindDocument `manualOrder`, baseReorderDocuments
  (full own non-deleted id list required; unknown/foreign/deleted id → 400
  at ids.<i>, missing entry → 400 at ids; nothing written on error)
- BaseController + routes: PUT /api/v1/education/reorder and
  /api/v1/project/reorder; owner GET list (no ?sort) uses the same order
- candidate_me: public profile, public PDF, owner export and ATS check list
  educations/projects in that order; experience unchanged
- locales, swagger, .claude/rules docs; +18 tests

npm test: 5 failed, 687 passed, 692 total (same 5 env-only failures on
base: tokenExpiry local TOKEN_EXP_IN, atsPdfIntegration no Chrome)
npm run build: exit 0 · npm run lint: 274 (= baseline, per-file identical)

Node: education-project-manual-order (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-14/education-project-manual-order-seal.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[413-education-project-store ba8ce8a] feat(cv-sections): store a manual display order for education and project
 27 files changed, 710 insertions(+), 13 deletions(-)
 create mode 100644 agent-hub/evidence/analyst/2026-11-14/cv-section-order-spec.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-14/education-project-manual-order-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-14/education-project-manual-order-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-14/education-project-manual-order-seal.md
 create mode 100644 src/__tests__/candidate_me/manualOrder.test.ts
 create mode 100644 src/__tests__/services/manualOrder.test.ts
$ git push -u origin 413-education-project-store
To https://github.com/datvt243/resume-nodejs-api.git
   74e857e..ba8ce8a  413-education-project-store -> 413-education-project-store
branch '413-education-project-store' set up to track 'origin/413-education-project-store'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/466
build (20.x)	pass	1m30s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43588251206/job/132427274360	
build (22.x)	pass	1m13s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43588251206/job/132427274060	
$ gh pr merge 466 --merge
```

## Seal gate
Approved by the operator before the run (`--yes`), covering the whole chain above.
