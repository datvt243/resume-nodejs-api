# 2026-11-08 - soft-deleted-writes-404 (ship)
- Node: `soft-deleted-writes-404` — SEALED (`evidence/verifier/2026-11-08/soft-deleted-writes-404-seal.md`)
- Branch: `403-soft-deleted-section` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` 12 files (4 `src/`, feature doc, worker-runs.log, both diagrams, 4 evidence notes incl. the #398 ship note)
- `git commit -F -` → `fix(cv-sections): soft-deleted entries are 404 on delete and image upload`
- `git push -u origin 403-soft-deleted-section`
- `gh pr create --base staging --head 403-soft-deleted-section`
- `gh pr checks 438 --watch --required`
- `gh pr merge 438 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
d869da0 fix(cv-sections): soft-deleted entries are 404 on delete and image upload
   87fa0a4..d869da0  403-soft-deleted-section -> 403-soft-deleted-section
PR https://github.com/datvt243/resume-nodejs-api/pull/438
build (20.x)	pass	1m4s
build (22.x)	pass	40s
MERGED 075c28a
075c28a Merge pull request #438 from datvt243/403-soft-deleted-section
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
