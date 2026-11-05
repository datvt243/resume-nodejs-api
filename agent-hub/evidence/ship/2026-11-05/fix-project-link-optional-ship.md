# Ship — fix-project-link-optional
- Node: `fix-project-link-optional` (SEALED, `evidence/verifier/2026-11-05/fix-project-link-optional-seal.md`) · Branch: `364-fix-project-link` · Remote: origin (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` (7 paths: project.validate.ts, project.validate.test.ts, implementer plan, verifier seal, worker-runs.log, dev-loop-archive.md, dev-loop.prime-mermaid.md)
- `git commit -F -` · `git push -u origin 364-fix-project-link`
- `gh pr create --base staging --head 364-fix-project-link` · `gh pr checks 365 --watch --required` · `gh pr merge 365 --merge --delete-branch`

## Output
```
84ef2ed fix(project): make link optional
   6efeaf4..84ef2ed  364-fix-project-link -> 364-fix-project-link
https://github.com/datvt243/resume-nodejs-api/pull/365
build (20.x)	pass	1m6s
build (22.x)	pass	1m24s
MERGED fdbabf7
```

## Seal gate
Operator approved via AskUserQuestion "Ship #364" → "Approve all 4" (covers commit, push, PR, merge into staging for #364/#361/#362/#363 after each SEAL).
