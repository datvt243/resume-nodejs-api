# Ship — contributing-kit-template
- Node: `contributing-kit-template` (SEALED, `agent-hub/evidence/verifier/2026-11-16/contributing-kit-template-seal.md`) · Branch: `chore/480-contributing-kit-template` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "docs(contributing): rewrite CONTRIBUTING.md from the agent-hub kit template

- CONTRIBUTING.md: operator rewrite onto the kit contributor template (ways to contribute, issue conventions, dev setup, branch model/naming, commits, PRs, protection + rationale, release, Claude Code commands); implementer fact-check fixed 2 lines to mention the CI lint ratchet
- agent-hub: diagram node + archive, implementer/verifier evidence, worker-runs.log, previous ship note (translate-vietnamese-docs)

npm test: Tests: 781 passed, 781 total
npm run build: exit 0

Sealed node: contributing-kit-template
Evidence: agent-hub/evidence/verifier/2026-11-16/contributing-kit-template-seal.md

Closes #480

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin chore/480-contributing-kit-template`
- `gh pr create --base staging --head chore/480-contributing-kit-template (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `e5bd022`
```
$ git commit -m docs(contributing): rewrite CONTRIBUTING.md from the agent-hub kit template

- CONTRIBUTING.md: operator rewrite onto the kit contributor template (ways to contribute, issue conventions, dev setup, branch model/naming, commits, PRs, protection + rationale, release, Claude Code commands); implementer fact-check fixed 2 lines to mention the CI lint ratchet
- agent-hub: diagram node + archive, implementer/verifier evidence, worker-runs.log, previous ship note (translate-vietnamese-docs)

npm test: Tests: 781 passed, 781 total
npm run build: exit 0

Sealed node: contributing-kit-template
Evidence: agent-hub/evidence/verifier/2026-11-16/contributing-kit-template-seal.md

Closes #480

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[chore/480-contributing-kit-template e5bd022] docs(contributing): rewrite CONTRIBUTING.md from the agent-hub kit template
 7 files changed, 299 insertions(+), 110 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-16/contributing-kit-template-plan.md
 create mode 100644 agent-hub/evidence/ship/2026-11-16/translate-vietnamese-docs-ship.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-16/contributing-kit-template-seal.md
$ git push -u origin chore/480-contributing-kit-template
To https://github.com/datvt243/resume-nodejs-api.git
   9352a5a..e5bd022  chore/480-contributing-kit-template -> chore/480-contributing-kit-template
branch 'chore/480-contributing-kit-template' set up to track 'origin/chore/480-contributing-kit-template'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/481
build (20.x)	pass	1m16s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43832447736/job/133180766452	
build (22.x)	pass	57s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43832447736/job/133180765980	
$ gh pr merge 481 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
