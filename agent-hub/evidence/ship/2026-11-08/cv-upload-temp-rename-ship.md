# 2026-11-08 - cv-upload-temp-rename (ship)
- Node: `cv-upload-temp-rename` — SEALED (`evidence/verifier/2026-11-08/cv-upload-temp-rename-seal.md`)
- Branch: `384-a-failed-oversized` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` 11 files (4 `src/`, feature doc, worker-runs.log, both diagrams, 3 evidence notes)
- `git commit -F -` → `fix(cv): a rejected CV re-upload no longer deletes the stored CV`
- `git push -u origin 384-a-failed-oversized`
- `gh pr create --base staging --head 384-a-failed-oversized`
- `gh pr checks 435 --watch --required`
- `gh pr merge 435 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
6e74490 fix(cv): a rejected CV re-upload no longer deletes the stored CV
   e67ede7..6e74490  384-a-failed-oversized -> 384-a-failed-oversized
https://github.com/datvt243/resume-nodejs-api/pull/435
build (20.x)	pass	1m4s
build (22.x)	pass	46s
MERGED 27665c8
27665c8 Merge pull request #435 from datvt243/384-a-failed-oversized
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
