# Ship — owner-export-profile-filter
- Node: `owner-export-profile-filter` (SEALED, `agent-hub/evidence/verifier/2026-11-10/owner-export-profile-filter-seal.md`) · Branch: `400-support-profile-on` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "feat(cv-export): support ?profile= on owner export and ATS check

- src/candidate_me/index.ts, src/candidate_me/ats-check.ts: GET /api/v1/download-pdf
  (every format) and POST /api/v1/cv/ats-check read ?profile=<id> and pass it to
  handlerGetAboutMe — same rule as the public routes: a non-deleted profile of the
  caller filters each section to its ids; missing/unknown/foreign/malformed → unfiltered.
- src/routers/api/v1/index.ts, cv.route.ts, .claude/rules/api.md: document `profile`.
- src/__tests__/candidate_me/index.test.ts: 4 cases (filtered / unfiltered, both routes).
- agent-hub: feature docs cv-export, ats-check, cv-profiles updated; evidence notes.

npm test: Test Suites: 2 failed, 64 passed, 66 total / Tests: 5 failed, 658 passed,
663 total (same 5 pre-existing: tokenExpiry + 4 real-Chrome ATS integration).
npm run build: exit 0. npm run lint: 274 problems (baseline 274).

Node: owner-export-profile-filter (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-10/owner-export-profile-filter-seal.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 400-support-profile-on`
- `gh pr create --base staging --head 400-support-profile-on (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `0e5a97d`
```
$ git commit -m feat(cv-export): support ?profile= on owner export and ATS check

- src/candidate_me/index.ts, src/candidate_me/ats-check.ts: GET /api/v1/download-pdf
  (every format) and POST /api/v1/cv/ats-check read ?profile=<id> and pass it to
  handlerGetAboutMe — same rule as the public routes: a non-deleted profile of the
  caller filters each section to its ids; missing/unknown/foreign/malformed → unfiltered.
- src/routers/api/v1/index.ts, cv.route.ts, .claude/rules/api.md: document `profile`.
- src/__tests__/candidate_me/index.test.ts: 4 cases (filtered / unfiltered, both routes).
- agent-hub: feature docs cv-export, ats-check, cv-profiles updated; evidence notes.

npm test: Test Suites: 2 failed, 64 passed, 66 total / Tests: 5 failed, 658 passed,
663 total (same 5 pre-existing: tokenExpiry + 4 real-Chrome ATS integration).
npm run build: exit 0. npm run lint: 274 problems (baseline 274).

Node: owner-export-profile-filter (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-10/owner-export-profile-filter-seal.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[400-support-profile-on 0e5a97d] feat(cv-export): support ?profile= on owner export and ATS check
 15 files changed, 196 insertions(+), 12 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-10/owner-export-profile-filter-plan.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-10/owner-export-profile-filter.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-10/owner-export-profile-filter-seal.md
$ git push -u origin 400-support-profile-on
To https://github.com/datvt243/resume-nodejs-api.git
   d685d0c..0e5a97d  400-support-profile-on -> 400-support-profile-on
branch '400-support-profile-on' set up to track 'origin/400-support-profile-on'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/455
build (20.x)	pass	1m37s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42791196601/job/129744793514	
build (22.x)	pass	1m12s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42791196601/job/129744793852	
$ gh pr merge 455 --merge
```

## Seal gate
Approved by the operator before the run (`--yes`), covering the whole chain above.
