# Ship — translate-vietnamese-docs
- Node: `translate-vietnamese-docs` (SEALED, `agent-hub/evidence/verifier/2026-11-16/translate-vietnamese-docs-seal.md`) · Branch: `chore/478-translate-vietnamese-content` · Remote: `https://github.com/datvt243/resume-nodejs-api.git`

## Commands
- `git commit -m "docs: translate Vietnamese skill and root docs to English

- README.md, CONTRIBUTING.md: full Vietnamese -> English; README TOC anchors re-pointed
- .claude/skills/todo, worker SKILL.md: translated; print marker now 'agent-hub content updated'
- Branch naming switched to <type>/<issue-number>-<desc> (PROJECT.md, ship.sh comment, ship/release/issues-ls/todo skills, CONTRIBUTING.md) - operator edits folded in on request
- agent-hub: diagram node + archive, implementer/verifier/ship evidence notes, worker-runs.log
- Out of scope (unchanged): evidence notes, dev-loop-archive quotes, feature docs quoting literal values

npm test: Tests: 781 passed, 781 total
npm run build: exit 0

Sealed node: translate-vietnamese-docs
Evidence: agent-hub/evidence/verifier/2026-11-16/translate-vietnamese-docs-seal.md

Closes #478

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"`
- `git push -u origin chore/478-translate-vietnamese-content`
- `gh pr create --base staging --head chore/478-translate-vietnamese-content (reuse an open one)`
- `gh pr checks <pr> --watch --required`
- `gh pr merge <pr> --merge`
- `git checkout staging`
- `git pull --ff-only origin staging`

## Output
Commit: `94efc34`
```
$ git commit -m docs: translate Vietnamese skill and root docs to English

- README.md, CONTRIBUTING.md: full Vietnamese -> English; README TOC anchors re-pointed
- .claude/skills/todo, worker SKILL.md: translated; print marker now 'agent-hub content updated'
- Branch naming switched to <type>/<issue-number>-<desc> (PROJECT.md, ship.sh comment, ship/release/issues-ls/todo skills, CONTRIBUTING.md) - operator edits folded in on request
- agent-hub: diagram node + archive, implementer/verifier/ship evidence notes, worker-runs.log
- Out of scope (unchanged): evidence notes, dev-loop-archive quotes, feature docs quoting literal values

npm test: Tests: 781 passed, 781 total
npm run build: exit 0

Sealed node: translate-vietnamese-docs
Evidence: agent-hub/evidence/verifier/2026-11-16/translate-vietnamese-docs-seal.md

Closes #478

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
[chore/478-translate-vietnamese-content 94efc34] docs: translate Vietnamese skill and root docs to English
 24 files changed, 1167 insertions(+), 315 deletions(-)
 create mode 100644 agent-hub/evidence/implementer/2026-11-16/translate-vietnamese-docs-plan.md
 create mode 100644 agent-hub/evidence/ship/2026-11-10/owner-export-profile-filter-ship.md
 create mode 100644 agent-hub/evidence/ship/2026-11-11/profile-section-ids-ownership-ship.md
 create mode 100644 agent-hub/evidence/ship/2026-11-14/education-project-manual-order-ship.md
 create mode 100644 agent-hub/evidence/ship/2026-11-14/job-applications-validate-ship.md
 create mode 100644 agent-hub/evidence/ship/2026-11-15/compound-candidate-deleted-index-ship.md
 create mode 100644 agent-hub/evidence/ship/2026-11-15/job-applications-status-transitions-ship.md
 create mode 100644 agent-hub/evidence/ship/2026-11-15/remove-express-session-unused-deps-ship.md
 create mode 100644 agent-hub/evidence/ship/2026-11-15/upload-route-tests-ship.md
 create mode 100644 agent-hub/evidence/ship/2026-11-16/ci-lint-ratchet-ship.md
 create mode 100644 agent-hub/evidence/verifier/2026-11-16/translate-vietnamese-docs-seal.md
$ git push -u origin chore/478-translate-vietnamese-content
To https://github.com/datvt243/resume-nodejs-api.git
   4fe1fa8..94efc34  chore/478-translate-vietnamese-content -> chore/478-translate-vietnamese-content
branch 'chore/478-translate-vietnamese-content' set up to track 'origin/chore/478-translate-vietnamese-content'.
PR: https://github.com/datvt243/resume-nodejs-api/pull/479
build (20.x)	pass	1m21s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43830025064/job/133172853759	
build (22.x)	pass	1m6s	https://github.com/datvt243/resume-nodejs-api/actions/runs/43830025064/job/133172854087	
$ gh pr merge 479 --merge
```

## Seal gate
Approved by the operator invoking /ship (AutoCommitNoGate), covering the whole chain above.
