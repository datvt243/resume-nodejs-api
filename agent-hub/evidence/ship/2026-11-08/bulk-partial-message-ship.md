# 2026-11-08 - bulk-partial-message (ship)
- Node: `bulk-partial-message` — SEALED (`evidence/verifier/2026-11-08/bulk-partial-message-seal.md`)
- Branch: `404-bulk-create-partial` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` 12 files (4 `src/`, feature doc, worker-runs.log, both diagrams, 4 evidence notes incl. the #403 ship note)
- `git commit -F -` → `fix(cv-sections): bulk partial success says "Created X of Y items"`
- `git push -u origin 404-bulk-create-partial`
- `gh pr create --base staging --head 404-bulk-create-partial`
- `gh pr checks 439 --watch --required`
- `gh pr merge 439 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
9962631 fix(cv-sections): bulk partial success says "Created X of Y items"
   075c28a..9962631  404-bulk-create-partial -> 404-bulk-create-partial
PR https://github.com/datvt243/resume-nodejs-api/pull/439
build (20.x)	pass	1m1s
build (22.x)	pass	51s
MERGED c98dec6
c98dec6 Merge pull request #439 from datvt243/404-bulk-create-partial
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
