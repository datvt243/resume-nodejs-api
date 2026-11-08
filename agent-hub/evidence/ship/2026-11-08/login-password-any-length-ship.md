# 2026-11-08 - login-password-any-length (ship)
- Node: `login-password-any-length` — SEALED (`evidence/verifier/2026-11-08/login-password-any-length-seal-r2.md`)
- Branch: `390-login-rejects-accounts` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` 12 files (2 `src/`, feature doc, worker-runs.log, both diagrams, 6 evidence notes incl. the #384 ship note)
- `git commit -F -` → `fix(auth): login accepts passwords that predate the current rules`
- `git push -u origin 390-login-rejects-accounts`
- `gh pr create --base staging --head 390-login-rejects-accounts`
- `gh pr checks 436 --watch --required`
- `gh pr merge 436 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
ecaf7d3 fix(auth): login accepts passwords that predate the current rules
   27665c8..ecaf7d3  390-login-rejects-accounts -> 390-login-rejects-accounts
PR https://github.com/datvt243/resume-nodejs-api/pull/436
build (20.x)	pass	1m3s
build (22.x)	pass	58s
MERGED e3725c3
e3725c3 Merge pull request #436 from datvt243/390-login-rejects-accounts
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
