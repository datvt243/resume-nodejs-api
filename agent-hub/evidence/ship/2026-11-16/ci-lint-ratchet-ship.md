# Ship — ci-lint-ratchet
- Node: `ci-lint-ratchet` (SEALED, `agent-hub/evidence/verifier/2026-11-16/ci-lint-ratchet-seal.md`) · Branch: `chore/462-ci-run-lint` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "ci(lint): run ESLint in CI as a ratchet on the error baseline

- .github/workflows/node.js.yml: new 'Lint (ratchet)' step after npm ci;
  fails only when ESLint errors exceed LINT_BASELINE (274, current count on
  staging); lower it as errors get fixed, never raise it. A crashed eslint
  (no report) also fails the step.
- agent-hub: node ci-lint-ratchet + implementer/verifier evidence.

npm test: 72 suites / 781 tests passed. npm run build: exit 0.
Sealed node: ci-lint-ratchet — agent-hub/evidence/verifier/2026-11-16/ci-lint-ratchet-seal.md

Closes #462

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin chore/462-ci-run-lint`
- `gh pr create --base staging --head chore/462-ci-run-lint (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `f7067e9`
```
$ git commit -m ci(lint): run ESLint in CI as a ratchet on the error baseline

- .github/workflows/node.js.yml: new 'Lint (ratchet)' step after npm ci;
  fails only when ESLint errors exceed LINT_BASELINE (274, current count on
  staging); lower it as errors get fixed, never raise it. A crashed eslint
  (no report) also fails the step.
- agent-hub: node ci-lint-ratchet + implementer/verifier evidence.

npm test: 72 suites / 781 tests passed. npm run build: exit 0.
Sealed node: ci-lint-ratchet — agent-hub/evidence/verifier/2026-11-16/ci-lint-ratchet-seal.md

Closes #462

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[chore/462-ci-run-lint f7067e9] ci(lint): run ESLint in CI as a ratchet on the error baseline
 7 files changed, 148 insertions(+)
 create mode 100644 agent-hub/evidence/implementer/2026-11-16/ci-lint-ratchet-diff.md
 create mode 100644 agent-hub/evidence/implementer/2026-11-16/ci-lint-ratchet-plan.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-16/ci-lint-ratchet-seal.md
$ git push -u origin chore/462-ci-run-lint
To https://github.com/datvt243/resume-nodejs-api.git
   a6a2c65..f7067e9  chore/462-ci-run-lint -> chore/462-ci-run-lint
branch 'chore/462-ci-run-lint' set up to track 'origin/chore/462-ci-run-lint'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/477
build (20.x)	pass	1m22s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43825582481/job/133158537881	
build (22.x)	pass	1m16s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43825582481/job/133158537558	
$ gh pr merge 477 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
