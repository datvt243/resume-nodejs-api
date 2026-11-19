# Ship — hide-password-select-false
- Node: `hide-password-select-false` (SEALED, `agent-hub/evidence/verifier/2026-11-18/hide-password-select-false-seal.md`) · Branch: `refactor/459-hide-password-select` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "refactor(candidate): hide password at schema level with select: false

- models/candidate.model.ts: password gets select: false, so no query
  returns the hash unless it opts in
- auth/auth.service.ts: handlerLogin (only hash reader) opts in with
  .select('+password'); reset writes via updateOne, unchanged
- tests: login mocks chain .select and assert '+password'; new
  models/candidatePassword.test.ts asserts a plain findById() sends
  projection { password: 0 } (red without the fix)

npm test: Test Suites: 73 passed, 73 total; Tests: 784 passed, 784 total
npm run build: exit 0 (tsc typecheck); lint 274 = baseline, 0 new

Node: hide-password-select-false (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-18/hide-password-select-false-seal.md

Closes #459

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin refactor/459-hide-password-select`
- `gh pr create --base staging --head refactor/459-hide-password-select (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `41df4ae`
```
$ git commit -m refactor(candidate): hide password at schema level with select: false

- models/candidate.model.ts: password gets select: false, so no query
  returns the hash unless it opts in
- auth/auth.service.ts: handlerLogin (only hash reader) opts in with
  .select('+password'); reset writes via updateOne, unchanged
- tests: login mocks chain .select and assert '+password'; new
  models/candidatePassword.test.ts asserts a plain findById() sends
  projection { password: 0 } (red without the fix)

npm test: Test Suites: 73 passed, 73 total; Tests: 784 passed, 784 total
npm run build: exit 0 (tsc typecheck); lint 274 = baseline, 0 new

Node: hide-password-select-false (SEALED)
Evidence: agent-hub/evidence/verifier/2026-11-18/hide-password-select-false-seal.md

Closes #459

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[refactor/459-hide-password-select 41df4ae] refactor(candidate): hide password at schema level with select: false
 9 files changed, 214 insertions(+), 7 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-18/hide-password-select-false.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-18/hide-password-select-false-seal.md
 create mode 100644 src/__tests__/models/candidatePassword.test.ts
$ git push -u origin refactor/459-hide-password-select
To https://github.com/datvt243/resume-nodejs-api.git
   b1ea2be..41df4ae  refactor/459-hide-password-select -> refactor/459-hide-password-select
branch 'refactor/459-hide-password-select' set up to track 'origin/refactor/459-hide-password-select'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/488
build (20.x)	pass	1m36s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44271973245/job/134690561564	
build (22.x)	pass	1m5s	https://github.com/datvt243/resume-nodejs-api/actions/runs/44271973245/job/134690562088	
$ gh pr merge 488 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
