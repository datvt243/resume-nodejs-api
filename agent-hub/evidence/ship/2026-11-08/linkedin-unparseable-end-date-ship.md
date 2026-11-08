# 2026-11-08 - linkedin-unparseable-end-date (ship)
- Node: `linkedin-unparseable-end-date` — SEALED (`evidence/verifier/2026-11-08/linkedin-unparseable-end-date-seal.md`)
- Branch: `401-linkedin-import-an` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` 10 files (2 `src/`, feature doc, worker-runs.log, both diagrams, 4 evidence notes incl. the #407 ship note)
- `git commit -F -` → `fix(linkedin-import): an unparseable end date is no longer "current"`
- `git push -u origin 401-linkedin-import-an`
- `gh pr create --base staging --head 401-linkedin-import-an`
- `gh pr checks 442 --watch --required`
- `gh pr merge 442 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
633ad03 fix(linkedin-import): an unparseable end date is no longer "current"
   d14595a..633ad03  401-linkedin-import-an -> 401-linkedin-import-an
PR https://github.com/datvt243/resume-nodejs-api/pull/442
build (20.x)	pass	1m7s
build (22.x)	pass	56s
MERGED b277225
b277225 Merge pull request #442 from datvt243/401-linkedin-import-an
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
