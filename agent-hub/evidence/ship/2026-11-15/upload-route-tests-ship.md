# Ship — upload-route-tests
- Node: `upload-route-tests` (SEALED, `agent-hub/evidence/verifier/2026-11-15/upload-route-tests-seal.md`) · Branch: `402-add-tests-for` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "test(upload): HTTP-level tests for stored-CV upload/download and section image upload

- src/__tests__/candidate/cvFileRoutes.test.ts (new, 8 tests): POST /candidate/upload-cv
  (valid PDF 200, >5MB 400 cvFileTooLarge, wrong mime/extension 400 FILE_INVALID_TYPE,
  no file 400) and GET /candidate/cv-file (no record 404, record but file gone 404,
  download under original name) through the real candidate router over HTTP.
- src/__tests__/candidate_profile/imageUploadRoutes.test.ts (new, 27 tests): POST
  /<award|certificate|project>/:id/images - success 200, unknown/soft-deleted 404 and
  another candidate's 403 with nothing written, no file / >5MB / >5 files / wrong type 400.
- agent-hub: node upload-route-tests SEALED + evidence notes.

npm test: 738 passed, 5 failed (known env-only: tokenExpiry local .env, atsPdfIntegration no Chrome)
npm run build: exit 0 · lint: 274 = baseline, 0 in new files

Node: upload-route-tests · evidence: agent-hub/evidence/verifier/2026-11-15/upload-route-tests-seal.md
Closes #402

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin 402-add-tests-for`
- `gh pr create --base staging --head 402-add-tests-for (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `73166cb`
```
$ git commit -m test(upload): HTTP-level tests for stored-CV upload/download and section image upload

- src/__tests__/candidate/cvFileRoutes.test.ts (new, 8 tests): POST /candidate/upload-cv
  (valid PDF 200, >5MB 400 cvFileTooLarge, wrong mime/extension 400 FILE_INVALID_TYPE,
  no file 400) and GET /candidate/cv-file (no record 404, record but file gone 404,
  download under original name) through the real candidate router over HTTP.
- src/__tests__/candidate_profile/imageUploadRoutes.test.ts (new, 27 tests): POST
  /<award|certificate|project>/:id/images - success 200, unknown/soft-deleted 404 and
  another candidate's 403 with nothing written, no file / >5MB / >5 files / wrong type 400.
- agent-hub: node upload-route-tests SEALED + evidence notes.

npm test: 738 passed, 5 failed (known env-only: tokenExpiry local .env, atsPdfIntegration no Chrome)
npm run build: exit 0 · lint: 274 = baseline, 0 in new files

Node: upload-route-tests · evidence: agent-hub/evidence/verifier/2026-11-15/upload-route-tests-seal.md
Closes #402

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[402-add-tests-for 73166cb] test(upload): HTTP-level tests for stored-CV upload/download and section image upload
 8 files changed, 420 insertions(+), 1 deletion(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-15/upload-route-tests-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-15/upload-route-tests-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-15/upload-route-tests-seal.md
 create mode 100644 src/__tests__/candidate/cvFileRoutes.test.ts
 create mode 100644 src/__tests__/candidate_profile/imageUploadRoutes.test.ts
$ git push -u origin 402-add-tests-for
To https://github.com/datvt243/resume-nodejs-api.git
   7f84edc..73166cb  402-add-tests-for -> 402-add-tests-for
branch '402-add-tests-for' set up to track 'origin/402-add-tests-for'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/469
build (20.x)	pass	1m37s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43705243445/job/132784799460	
build (22.x)	pass	1m13s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43705243445/job/132784799596	
$ gh pr merge 469 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
