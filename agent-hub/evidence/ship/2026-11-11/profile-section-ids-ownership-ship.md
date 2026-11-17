# Ship — profile-section-ids-ownership
- Node: `profile-section-ids-ownership` (SEALED, `agent-hub/evidence/verifier/2026-11-10/profile-section-ids-ownership-seal.md`) · Branch: `405-cv-profiles-reject` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "feat(cv-profiles): reject foreign/unknown section ids on profile create/update

POST /api/v1/profile/create and PUT /update now reject any id in
educationIds/experienceIds/projectIds/certificateIds/awardIds/referenceIds
that is not a non-deleted entry of the caller in that section:
400 VALIDATION_ERROR, details[].field = <field>.<index>, nothing written.

- src/candidate_profile/profile/profile.service.ts: checkSectionIds ownership
  check before create/update (Joi only checks shape)
- src/locales/en.ts, vi.ts: new error message key
- src/__tests__/candidate_profile/profile.service.test.ts: owned ids create;
  foreign/unknown ids -> 400 per field.index, no create; same on update
- agent-hub: feature doc cv-profiles.md Behavior, evidence notes, diagrams

Tests (from SEAL note):
- npx jest src/__tests__/candidate_profile/profile.service.test.ts: 6 passed, 6 total
- npm test: 5 failed, 661 passed, 666 total (same 5 pre-existing failures as
  staging: tokenExpiry TOKEN_EXP_IN, 4 atsPdfIntegration no-Chrome)
- npm run build: exit 0
- npm run lint: 274 problems = baseline, none new

Sealed node: profile-section-ids-ownership
Evidence: agent-hub/evidence/verifier/2026-11-10/profile-section-ids-ownership-seal.md

Closes #405

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 405-cv-profiles-reject`
- `gh pr create --base staging --head 405-cv-profiles-reject (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `ae33a57`
```
$ git commit -m feat(cv-profiles): reject foreign/unknown section ids on profile create/update

POST /api/v1/profile/create and PUT /update now reject any id in
educationIds/experienceIds/projectIds/certificateIds/awardIds/referenceIds
that is not a non-deleted entry of the caller in that section:
400 VALIDATION_ERROR, details[].field = <field>.<index>, nothing written.

- src/candidate_profile/profile/profile.service.ts: checkSectionIds ownership
  check before create/update (Joi only checks shape)
- src/locales/en.ts, vi.ts: new error message key
- src/__tests__/candidate_profile/profile.service.test.ts: owned ids create;
  foreign/unknown ids -> 400 per field.index, no create; same on update
- agent-hub: feature doc cv-profiles.md Behavior, evidence notes, diagrams

Tests (from SEAL note):
- npx jest src/__tests__/candidate_profile/profile.service.test.ts: 6 passed, 6 total
- npm test: 5 failed, 661 passed, 666 total (same 5 pre-existing failures as
  staging: tokenExpiry TOKEN_EXP_IN, 4 atsPdfIntegration no-Chrome)
- npm run build: exit 0
- npm run lint: 274 problems = baseline, none new

Sealed node: profile-section-ids-ownership
Evidence: agent-hub/evidence/verifier/2026-11-10/profile-section-ids-ownership-seal.md

Closes #405

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[405-cv-profiles-reject ae33a57] feat(cv-profiles): reject foreign/unknown section ids on profile create/update
 11 files changed, 269 insertions(+), 4 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-10/profile-section-ids-ownership-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-10/profile-section-ids-ownership-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-10/profile-section-ids-ownership-seal.md
$ git push -u origin 405-cv-profiles-reject
To https://github.com/datvt243/resume-nodejs-api.git
   778e330..ae33a57  405-cv-profiles-reject -> 405-cv-profiles-reject
branch '405-cv-profiles-reject' set up to track 'origin/405-cv-profiles-reject'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/456
build (20.x)	pass	1m7s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42962876729/job/130333312328	
build (22.x)	pass	54s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42962876729/job/130333312643	
$ gh pr merge 456 --merge
```

## Seal gate
Approved by the operator before the run (`--yes`), covering the whole chain above.
