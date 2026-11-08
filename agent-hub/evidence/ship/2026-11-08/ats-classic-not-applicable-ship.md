# 2026-11-08 - ats-classic-not-applicable (ship)
- Node: `ats-classic-not-applicable` — SEALED (`evidence/verifier/2026-11-08/ats-classic-not-applicable-seal.md`)
- Branch: `406-ats-check-with` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` 15 files (7 `src/`, `.claude/rules/api.md`, feature doc, worker-runs.log, both diagrams, 4 evidence notes incl. the #404 ship note)
- `git commit -F -` → `fix(ats-check): classic template marks headings + metadata not applicable`
- `git push -u origin 406-ats-check-with`
- `gh pr create --base staging --head 406-ats-check-with`
- `gh pr checks 440 --watch --required`
- `gh pr merge 440 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
b8549bb fix(ats-check): classic template marks headings + metadata not applicable
   c98dec6..b8549bb  406-ats-check-with -> 406-ats-check-with
PR https://github.com/datvt243/resume-nodejs-api/pull/440
build (20.x)	pass	1m8s
build (22.x)	pass	58s
MERGED 152a59e
152a59e Merge pull request #440 from datvt243/406-ats-check-with
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
