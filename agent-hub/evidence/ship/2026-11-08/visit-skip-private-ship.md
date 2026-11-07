# 2026-11-08 - visit-skip-private (ship)
- Node: `visit-skip-private` — SEALED (`evidence/verifier/2026-11-08/visit-skip-private-seal.md`)
- Branch: `398-dont-record-visits` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` 12 files (3 `src/`, `.claude/rules/api.md`, feature doc, worker-runs.log, both diagrams, 4 evidence notes incl. the #390 ship note)
- `git commit -F -` → `fix(visits): don't record visits for private profiles`
- `git push -u origin 398-dont-record-visits`
- `gh pr create --base staging --head 398-dont-record-visits`
- `gh pr checks 437 --watch --required`
- `gh pr merge 437 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
e8d6adb fix(visits): don't record visits for private profiles
   e3725c3..e8d6adb  398-dont-record-visits -> 398-dont-record-visits
PR https://github.com/datvt243/resume-nodejs-api/pull/437
build (20.x)	pass	45s
build (22.x)	pass	40s
MERGED 87fa0a4
87fa0a4 Merge pull request #437 from datvt243/398-dont-record-visits
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
