# Ship — add-cv-file-name
- Node: `add-cv-file-name` (SEALED r2, `evidence/verifier/2026-11-05/add-cv-file-name-seal-r2.md`) · Branch: `363-feat-candidate-thêm` · Remote: origin

## Commands
- `git add` (23 paths: 10 src, 5 tests incl. new candidate.validate.test.ts, models.md, implementer plan + diff-r2, verifier reopen + seal-r2, worker-runs.log, both diagram files)
- `git commit -F -` · `git push -u origin 363-feat-candidate-thêm`
- `gh pr create --base staging` · `gh pr checks 368 --watch --required` · `gh pr merge 368 --merge --delete-branch`

## Output
```
7305544 feat(candidate): cvFileName as the CV download filename
   b088a3c..7305544  363-feat-candidate-thêm -> 363-feat-candidate-thêm
https://github.com/datvt243/resume-nodejs-api/pull/368
build (20.x)	pass	1m2s
build (22.x)	pass	1m26s
MERGED 07ab985
```

## Seal gate
Operator "Approve all 4" (AskUserQuestion, this session).
