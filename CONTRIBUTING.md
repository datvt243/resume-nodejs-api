# Contributing — Branching & Release Workflow

2 tiers: **`staging`** (integration) → **`main`** (production). In effect
since 2026-08-30.

```
<type>/<n>-<desc> branch   →  PR  →  staging  →  /release  →  main  →  auto deploy
      (branched from staging)  (/ship)                (merge commit + tag)
```

## Rules

1. **Never branch from `main`.** Every feature/fix/hotfix/refactor/perf/chore
   branch is cut from `staging`:
   ```
   git checkout -b <type>/<issue-number>-<desc-max-3-words> staging
   ```
2. **PRs always merge into `staging`**, never directly into `main`.
3. **`main` only receives code through the official release step**
   (`/release` with Claude Code, or the manual equivalent — see "Release
   process" below) — no PR from a feature branch is ever based on
   `main`.
4. **Both `main` and `staging` have real GitHub branch protection**:
   nobody can push directly, not even the owner/admin (`enforce_admins: true`).
   Every change — even a 1-line version bump — goes through a PR.
5. **Both branches are gated by real CI** (`required_status_checks`):
   a PR cannot be merged (not even by the owner) while `build (20.x)`/`build
   (22.x)` (the `build` job in `.github/workflows/node.js.yml`, running
   `npm ci && npm run build && npm test`) is unfinished or failing on that
   exact commit. `strict: false` — the branch does not have to be rebased
   onto the latest base before merging, avoiding needless manual steps
   for a single maintainer; what is gated is "does this commit pass
   CI", not "is the branch up to date".

## Why `required_approving_review_count = 0`?

It sounds backwards for a "protected" branch, but it is deliberate:
this repo currently has a single maintainer, who uses both a human
account and an agent (Claude Code) to merge PRs. GitHub **does not let an
account approve its own PR** — with `required_approving_review_count >= 1`,
nobody (not even the owner) could merge their own PRs any more, locking
the whole workflow. Setting `0` keeps the part of branch protection that
matters (no direct push, no force-push, no branch deletion — every change
must be a PR whose diff can be reviewed before merge) without locking
ourselves out. When the repo gains more maintainers, this is the first
value to raise to `>= 1`.

## Why add `required_status_checks` (real CI) to branch protection?

Initially (2026-08-30) branch protection did NOT gate on CI checks
(`required_status_checks: null`) — the reasoning then: `/release` already
ran `npm run build`/`npm test` locally (in an isolated git worktree)
before opening the PR into `main`, so a gate effectively existed.

But that gate only existed on the `/release` path (`staging → main`).
The `/ship --merge` path (PR `<type>/…` → `staging`) **had no build
+test gate at all** before merging — it relied on the operator
remembering to have run the tests earlier in the session. Adding
`required_status_checks` (checks `build (20.x)`/`build (22.x)`, the real
job/matrix in `.github/workflows/node.js.yml`) to BOTH branches closes
that hole: every PR into `staging` OR `main`, whether via `/ship`,
`/release`, or a manual merge in the GitHub UI, must have real CI (running
on GitHub's machines, not the operator's local machine) green before
`gh pr merge` is accepted — and with `enforce_admins: true` the owner
cannot bypass it either.

`strict: false` (not `true`): the branch being merged does not have to
contain the latest base commit before merging. With a single
maintainer, overlapping PRs are rare — `strict: true` would only add a
manual "update branch" step every time the base moves, without buying
matching safety.

## Release process

Each time `staging` is promoted to `main` (production):

1. Run a real build + test on `staging` — merging on failure is not
   allowed.
2. Merge `staging` → `main` with a **real merge commit, not a squash**.
3. Bump the version (semver, derived automatically from the Conventional
   Commits messages), create git tag `vX.Y.Z`.
4. The push to `main` triggers the deploy automatically
   (`.github/workflows/deploy.yml` → Render, secrets already configured —
   nothing else to do).
5. Sync the version bump back to `staging` so the 2 branches don't drift.
6. Close the issues this release actually brought to `main`.

With Claude Code, all 6 steps above run through `/release`.

### Why a real merge commit, not a squash, at release?

A squash would collapse every commit on `staging` (possibly dozens of
commits from many different PRs) into a single commit on `main` — losing
every change boundary. A real merge commit keeps each original commit
on `main`, so `git bisect`/`git blame`/later audits still see exactly
which commit did what, instead of one indivisible "release" block.

### Why don't issues close when a PR merges into `staging`?

GitHub only auto-closes an issue (`Closes #N` in the PR body) when that
PR merges into the repo's **default branch** — currently `main`. A
`<type>/…` PR merged into `staging` (not the default branch) does **not**
close the issue even with `Closes #N` in its body — the issue only closes
when the release PR (`staging → main`) merges, carrying the `Closes #N`
for exactly the issues that reached `main` in that batch.

## Matching commands (Claude Code)

| Task | Command |
|---|---|
| Commit + push the current `<type>/…` branch | `/ship` |
| Commit + push, then open a PR + merge into `staging` | `/ship --merge` |
| Release `staging` → `main` (build+test gate, version bump, tag, deploy check, close issues) | `/release` |

`/ship` refuses to run when the current branch is `main`/`staging` (use
`/release` for that case).
