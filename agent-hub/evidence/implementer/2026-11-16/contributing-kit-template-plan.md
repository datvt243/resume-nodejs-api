# 2026-11-16 - contributing-kit-template

Worker: implementer · Version: 0.1.0 · Node: `contributing-kit-template` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS) · Issue #480 · Branch `chore/480-contributing-kit-template`
Task (verbatim /todo arg): "what the conttibuting rewrites" — the operator's placeholder text; the issue (#480) was titled from the real uncommitted diff: "docs: rewrite CONTRIBUTING.md from the agent-hub kit template".

## Author: operator (rewrite written by hand on `chore/contributing-kit-template`, 0 commits over `origin/staging`; carried uncommitted onto the issue branch), adopted + fact-checked by the implementer

## Hub bytes before: 98669
(measured after the node row was appended)

## Feature doc: none
Docs-only.

## Diff
| file | why |
|---|---|
| `CONTRIBUTING.md` | operator's full rewrite (kit template sections: ways to contribute, issues, dev setup, branch model/naming, commits, PRs, protection + rationale, release, Claude Code commands) |
| `CONTRIBUTING.md` (implementer, 2 lines) | fact fix: CI also runs the lint ratchet — "CI runs build + test" → "CI runs lint (ratchet on the baseline), build + test"; CI job list "`npm ci`, build, `npm test`" → "`npm ci`, lint ratchet, build, `npm test`" |
| `haven/diagrams/dev-loop.prime-mermaid.md` | node row |

## Fact check (criterion 1)
| Claim | Source | Result |
|---|---|---|
| CI steps | `.github/workflows/node.js.yml:29-38`: `npm ci`, `Lint (ratchet)` `LINT_BASELINE: 274`, `npm run build --if-present`, `npm test` | was missing lint → fixed |
| Lint baseline 274 | `doctrine/MEMORY.md` Lint row; workflow `LINT_BASELINE: 274` | ✅ |
| Commands (`npm ci`/dev/lint/build/test/`npx jest <path>`), Node range | `doctrine/MEMORY.md` commands + Stack | ✅ |
| Branch naming `<type>/<issue-number>-<desc-max-3-words>`, type rules | `doctrine/domains/PROJECT.md:33` | ✅ verbatim match |
| `/ship` turns issue number into `Closes #<n>` | `.claude/skills/ship/ship.sh:93-96` | ✅ |
| Version from commit types (`feat` minor, `!`/BREAKING major, else patch) | `release.sh:38-42` + `release.env:3` `RELEASE_AUTO_BUMP=true` | ✅ |
| `/release [patch|minor|major]` | `.claude/skills/release/SKILL.md:4` | ✅ |
| `/issues-ls --group`, `done-dev`, `[GROUP]` title tag, `priority: <level>` labels | `.claude/skills/issues-ls/SKILL.md:4,43,47,61` | ✅ |
| `agent-hub/CLAUDE.md` exists | `ls` | ✅ |

## Old-rules coverage (criterion 2)
Branch from staging (Branch model + `git checkout -b` block) · PR into staging (Pull requests) · `main` release-only (Branch model) · protection `enforce_admins`, no force-push/deletion (Branch protection) · review count 0 rationale · required checks rationale incl. `strict: false` · merge commit not squash · issues close only on default branch — all present.

## Command
From repo root (`doctrine/MEMORY.md`): `npm test`; Typecheck = `inside Build` → `npm run build`. Lint: no `.ts`/`.js` touched → not run.

## Output
```
Test Suites: 72 passed, 72 total
Tests:       781 passed, 781 total
build exit 0
```

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) claims match repo | Fact check table above; 1 mismatch found and fixed |
| (2) no old rule lost | Old-rules coverage above |
| (3) tests + build green | `Tests: 781 passed, 781 total`; `build exit 0` |
| comments per code-comments.md | n/a — no code |

## Supersedes: none
## Still open: none
## Review: skipped — docs

## Noticed, not done
- Old empty branch `chore/contributing-kit-template` (local, no commits) can be deleted by the operator: `git branch -d chore/contributing-kit-template`.
- `agent-hub/evidence/ship/2026-11-16/translate-vietnamese-docs-ship.md` (previous ship's note) is untracked; belongs in the next commit.

## Seal gate: none
