# 2026-11-08 - parsed-entries-bulk-shape (ship)
- Node: `parsed-entries-bulk-shape` — SEALED (`evidence/verifier/2026-11-08/parsed-entries-bulk-shape-seal.md`)
- Branch: `388-cv-pdf-linkedin` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` both parsers, swagger (candidate.route.ts), api.md, 4 test files (1 new), cv-file-upload-import.md, worker-runs.log, both diagrams, plan/diff/seal notes, linkedin-unparseable-end-date ship note
- `git commit -F -` → `fix(import): parsed CV/LinkedIn entries post to /bulk unchanged`
- `git push -u origin 388-cv-pdf-linkedin`
- `gh pr create --base staging --head 388-cv-pdf-linkedin`
- `gh pr checks 443 --watch --required`
- `gh pr merge 443 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
c37dfb2 fix(import): parsed CV/LinkedIn entries post to /bulk unchanged
   b277225..c37dfb2  388-cv-pdf-linkedin -> 388-cv-pdf-linkedin
PR https://github.com/datvt243/resume-nodejs-api/pull/443
build (20.x)	pass	1m2s
build (22.x)	pass	38s
MERGED fee5291
fee5291 Merge pull request #443 from datvt243/388-cv-pdf-linkedin
```

## Seal gate
Operator invocation 2026-11-08: `/todo #384 #386 #390 ... , fix lần lượt từng isssue, xong thì chạy /ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
