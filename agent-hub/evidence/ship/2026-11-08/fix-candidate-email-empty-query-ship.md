# 2026-11-08 - fix-candidate-email-empty-query (ship)
- Node: `fix-candidate-email-empty-query` — SEALED (`evidence/verifier/2026-11-07/fix-candidate-email-empty-query-seal-r2.md`)
- Branch: `380-get-candidate-email` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
Commit `e001771` and its push already existed from the 2026-11-07 session (working tree clean, branch in sync with origin) — steps 1-5 were no-ops.
- `gh pr create --base staging --head 380-get-candidate-email --title "fix(candidate): 404 instead of an arbitrary record when :email is dropped by QuerySafe" --body …(Closes #380.)`
- `gh pr checks 429 --watch --required` → "no required checks reported"; `gh pr view 429 --json mergeStateStatus` → `DIRTY` (conflict with staging in `agent-hub/evidence/worker-runs.log`) → stopped, asked operator
- after approval: `git merge --no-ff origin/staging -m "Merge staging into 380-get-candidate-email"`; conflict resolved by keeping both sides' appended lines (append-only log, no line dropped); `git commit --no-edit`
- `git push origin 380-get-candidate-email`
- `gh pr checks 429 --watch --required`
- `gh pr merge 429 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
https://github.com/datvt243/resume-nodejs-api/pull/429
   e001771..e3f42c9  380-get-candidate-email -> 380-get-candidate-email
build (20.x)	pass	43s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42416667690/job/128536133666
build (22.x)	pass	37s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42416667690/job/128536133383
MERGED bc4a3f1
staging
```
Local `npm test` after the staging merge: `Tests: 5 failed, 586 passed, 591 total` — `atsPdfIntegration` (4, also fails on a clean `origin/staging` worktree: local Chrome) + `tokenExpiry` (1, local `.env`); `npm run build` clean.

## Seal gate
Operator: `/todo #380 #394 #382 #383 #387, xong tự chạy /ship --merge` (covers commit/push/merge); the conflict-resolution merge commit approved separately: "ok resolve conflict rồi merge, tiếp #394".
