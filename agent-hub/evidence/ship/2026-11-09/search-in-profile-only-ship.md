# 2026-11-09 - search-in-profile-only (ship)
- Node: `search-in-profile-only` — SEALED (`evidence/verifier/2026-11-09/search-in-profile-only-seal.md`)
- Branch: `397-public-search-should` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add` search.ts, search.test.ts, `.claude/rules/api.md`, public-profile.md, worker-runs.log, both diagrams, plan/implement/seal notes, paginate-visits ship note
- `git commit -F -` → `feat(search): only match entries that belong to a profile`
- `git push -u origin 397-public-search-should`
- `gh pr create --base staging --head 397-public-search-should`
- `gh pr checks 449 --watch --required`
- `gh pr merge 449 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
c0a6793 feat(search): only match entries that belong to a profile
   01fa125..c0a6793  397-public-search-should -> 397-public-search-should
PR https://github.com/datvt243/resume-nodejs-api/pull/449
build (20.x)	pass	42s
build (22.x)	pass	53s
MERGED 4df057e
```

## Seal gate
Operator invocation 2026-11-09: `/ship --merge` — `--merge` typed by the operator, covers commit + push + PR + merge.
