# 2026-11-17 - auth-service-throw-apperror (ship)
Node: `auth-service-throw-apperror` (SEALED — `evidence/verifier/2026-11-17/auth-service-throw-apperror-seal.md`) · Branch: `refactor/460-auth-service-throw` → `staging` via PR #483 · Remote: origin (https://github.com/datvt243/resume-nodejs-api)
Shipped from worktree `/Users/_david/Workspace/Project/resume/resume-nodejs-api-460` (primary checkout held #475 work at the time).

## Commands
1. `ship.sh auth-service-throw-apperror "<msg>" --merge` → `git commit`, `git push -u origin refactor/460-auth-service-throw`, `gh pr create --base staging` (PR #483), `gh pr checks --watch --required`, `gh pr merge 483 --merge` — merge FAILED (exit 1); ship.sh stopped before writing this note.
2. Operator: "fix it" → by hand: `git merge --no-ff --no-commit origin/staging` (staging had gained #482 / 38a532b); only conflict `agent-hub/evidence/worker-runs.log` (each side appended one line — kept both, chronological); `npm test`; `npm run build`; `git commit --no-edit`; `git push`; `gh pr checks 483 --watch --required`; `gh pr merge 483 --merge`.
3. Return to working branch: worktree `git checkout staging` refused (`'staging' is already used by worktree at '/Users/_david/Workspace/Project/resume/resume-nodejs-api'`) → `git pull --ff-only origin staging` in the primary checkout instead.
No `--force`/`--no-verify`/`--admin`. Branch not deleted (not created by ship — `CleanupFixBranch` n/a).

## Output
- Commit: `[refactor/460-auth-service-throw 20af792] refactor(auth): throw AppError from auth service instead of returning { success: false }` — `11 files changed, 219 insertions(+), 59 deletions(-)`
- Push: `* [new branch]      refactor/460-auth-service-throw -> refactor/460-auth-service-throw`
- PR: https://github.com/datvt243/resume-nodejs-api/pull/483
- First merge: `X Pull request datvt243/resume-nodejs-api#483 is not mergeable: the merge commit cannot be cleanly created.`
- After merging staging: `npm test` → `Test Suites: 1 failed, 71 passed, 72 total` / `Tests:       4 failed, 779 passed, 783 total` (only `atsPdfIntegration`, Could not find Chrome — pre-existing); `npm run build` → `build_exit=0`
- Merge commit on branch: `43ba4d2 Merge remote-tracking branch 'origin/staging' into refactor/460-auth-service-throw`; push `20af792..43ba4d2`
- Checks: `build (20.x) pass 1m17s`, `build (22.x) pass 1m53s`
- PR merged: `MERGED 0418cf04d363ec7f65e65468c60f577b2df1c634`; primary checkout now at `0418cf0 Merge pull request #483`

## Seal gate
`/ship --merge` typed by the operator = approval (`AutoCommitNoGate`, covers the merge); conflict-resolution merge + re-push approved by the operator's "fix it".
