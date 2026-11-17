# Contributing

Thanks for helping. This file is the human summary of how changes land
here. The agent-side source of truth is `agent-hub/doctrine/domains/PROJECT.md`
— if the two ever disagree, PROJECT.md wins and this file gets fixed.

## Ways to contribute
- **Report a bug** — open an issue (see below). Security problems: do NOT
  open a public issue; contact the maintainer privately.
- **Suggest a feature** — open an issue describing the problem first, not
  just the solution.
- **Fix / build something** — every change starts from an issue, so each
  branch, PR and release note traces back to one.

## Opening an issue
- Title: `[<GROUP>] short summary`, where `<GROUP>` is the area or
  campaign (`[AUTH]`, `[QC]`, …) — `/issues-ls` groups by it.
- Priority: label `priority: highest|high|medium|low|lowest` (or a title
  tag `[P0]`–`[P4]`). Status beyond open/closed: `status: <value>` label.
- Bugs: steps to reproduce, expected vs. actual, environment, logs/screenshots.

## Development setup
Node.js `>=20.19.0 <23.0.0`, npm.

| What | Command |
|---|---|
| Install | `npm ci` |
| Run locally | `npm run dev` |
| Lint | `npm run lint` — known baseline of 274 inherited errors; add none, especially in files you touch |
| Typecheck | part of `npm run build` (`tsc`) |
| Test | `npm test` (one file: `npx jest <path/to/file.test.ts>`) |
| Build | `npm run build` |

Run lint, test and build before opening a PR — CI runs lint (ratchet on the baseline), build + test.

## Branch model
```
<type>/<n>-<desc>  →  PR  →  staging  →  release PR (/release)  →  main  →  deploy (Render)
```
- **`staging`** — integration. Every branch is cut from it and its PR
  targets it.
- **`main`** — production. Only receives the release PR from `staging`.
  Nobody branches off it; no other PR targets it.

Always branch from a freshly pulled base:
```bash
git checkout staging && git pull
git checkout -b <type>/<issue-number>-<desc>
```

### Branch naming
`<type>/<issue-number>-<desc-max-3-words>` — e.g. `fix/408-general-info-confirm`.
- `<type>`: `feature` · `fix` · `hotfix` · `refactor` · `perf` · `chore`.
  From the issue: label `bug` → `fix` (`hotfix` if it must skip the normal
  release cadence), `enhancement`/`feature` → `feature`, else the title's
  leading verb.
- `<desc>`: kebab-case, at most 3 words.
- The issue number in the name is load-bearing: `/ship` turns it into
  `Closes #<n>` in the PR body.

## Commit messages
[Conventional Commits](https://www.conventionalcommits.org/):
`<type>(<scope>): <summary>` — e.g. `fix(auth): reject expired refresh token`.
`feat` → minor bump, `fix`/`perf` → patch, `!` or `BREAKING CHANGE:` →
major (the release version is computed from these).

## Pull requests
- Target `staging`; body contains `Closes #<n>`.
- One issue per PR; keep it reviewable.
- CI (`build (20.x)` and `build (22.x)` — job `build` in
  `.github/workflows/node.js.yml`: `npm ci`, lint ratchet, build, `npm test`) must be
  green on the PR's own commit before it can merge.
- Never `--force` push a shared branch, never `--no-verify`. A failing
  hook or check gets fixed, not bypassed.
- Merge with a real merge commit (`gh pr merge --merge`), on feature PRs
  and the release PR alike.

## Branch protection
Both `main` and `staging` are GitHub branch-protected:
`enforce_admins: true`, PR required, no force-push, no deletion,
required status checks `build (20.x)` + `build (22.x)` (`strict: false`).
A direct `git push` is rejected (`GH006`), owner included.

### Why `required_approving_review_count: 0`
Solo-maintainer repo (a human account and Claude Code both merge PRs), and
GitHub won't let an author approve their own PR — `1`+ would make every
PR unmergeable. `0` still forces every change through a PR (diff, CI
gate, audit trail). Raise it when a second maintainer joins.

### Why required status checks
At first (2026-08-30) only the release path was gated (`/release` runs
build + test locally); a PR into `staging` could merge red. Required
checks run on GitHub's machines for every PR into either branch — via
`/ship`, `/release` or the GitHub UI — so nothing merges on "it passed on
my laptop". `strict: false`: with one maintainer, forcing "update branch"
on every base move adds clicks, not safety.

## Releasing `staging` → `main`
`/release [patch|minor|major]` runs, in order:
1. Gate: `npm run build` + `npm test` on `staging` — red stops here.
2. Version bump (semver from the commit types).
3. Release PR merged with `--merge` (real merge commit), tag `vX.Y.Z`.
4. Push to `main` triggers deploy: `.github/workflows/deploy.yml` → Render.
5. Sync the bump back to `staging` so the two branches don't drift.
6. Close the issues this release actually shipped.

### Why the release merges with `--merge`, never squash
Squash collapses every commit of the release into one, losing which
change did what. A merge commit keeps each reviewed commit on `main`, so
`git bisect` / `git blame` / audits stay precise.

### Why issues don't close when a PR merges into `staging`
GitHub only auto-closes `Closes #n` on a merge into the **default**
branch (`main`). Issues merged into `staging` stay open (shown as
`done-dev` by `/issues-ls`) until the release PR carries them to production.

## Working with Claude Code (agent-hub)
| Task | Command |
|---|---|
| Orient a session | `/boot` |
| Issue → branch → implement → verify | `/todo "<task>"` or `/todo #<n>` (`--ship` to ship after SEAL) |
| Commit + push current branch | `/ship "[note]"` |
| …and PR + merge into `staging` | `/ship "[note]" --merge` |
| List issues, fix-first order | `/issues-ls --group` |
| Release to production | `/release [patch\|minor\|major]` |

`/ship` refuses to run on `main`/`staging`. Agent rules (forbidden
states, seal gate, verifier): `agent-hub/CLAUDE.md`.
