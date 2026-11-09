# 2026-11-08 - short-values-validation (ship)
- Node: `short-values-validation` — SEALED (`evidence/verifier/2026-11-08/short-values-validation-seal-r2.md`)
- Branch: `414-validation-allow-short` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` both validate files, 2 test files (1 new), cv-section-crud.md, worker-runs.log, both diagrams, plan/diff/reopen/seal-r2 notes, parsed-entries-bulk-shape ship note
- `git commit -F -` → `fix(validation): allow short education majors and awards without a link`
- `git push -u origin 414-validation-allow-short`
- `gh pr create --base staging --head 414-validation-allow-short`
- `gh pr checks 444 --watch --required`
- `gh pr merge 444 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
4db8860 fix(validation): allow short education majors and awards without a link
   fee5291..4db8860  414-validation-allow-short -> 414-validation-allow-short
PR https://github.com/datvt243/resume-nodejs-api/pull/444
build (20.x)	pass	1m7s
build (22.x)	pass	44s
MERGED 4af0eee
4af0eee Merge pull request #444 from datvt243/414-validation-allow-short
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
