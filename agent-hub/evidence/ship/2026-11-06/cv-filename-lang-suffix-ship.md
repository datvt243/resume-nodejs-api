# 2026-11-06 - cv-filename-lang-suffix (ship)
- Node: `cv-filename-lang-suffix` — SEALED (`evidence/verifier/2026-11-06/cv-filename-lang-suffix-seal.md`)
- Branch: `375-feat-download-thêm` → `staging` (`--merge`)
- Remote: `origin` https://github.com/datvt243/resume-nodejs-api.git

## Commands
1. `git add <9 src files> .claude/rules/models.md agent-hub/evidence/worker-runs.log agent-hub/haven/diagrams/dev-loop-archive.md agent-hub/haven/diagrams/dev-loop.prime-mermaid.md agent-hub/evidence/implementer/2026-11-06 agent-hub/evidence/verifier/2026-11-06`
2. `git commit` → feat commit
3. `git add .claude/commands/issues-ls.md .claude/commands/issue-create.md agent-hub/evidence/implementer/2026-11-01/check-education-i18n-plan.md agent-hub/evidence/ship/2026-11-01/delete-all-visits-ship.md agent-hub/evidence/ship/2026-11-02 agent-hub/evidence/ship/2026-11-05` + `git commit` → chore commit (operator-made changes, operator said ship together)
4. `git push -u origin 375-feat-download-thêm`
5. `gh pr create --base staging --head 375-feat-download-thêm ...`
6. `gh pr checks 376 --watch --required`
7. `gh pr merge 376 --merge --delete-branch`

## Output
```
e373c12 chore(claude): add /issue-create, group done-dev in /issues-ls, add pending evidence notes
80ba039 feat(download): suffix CV download filenames with _VI/_EN
   8892b14..e373c12  375-feat-download-thêm -> 375-feat-download-thêm
https://github.com/datvt243/resume-nodejs-api/pull/376
build (22.x)	pass	37s
build (20.x)	pass	1m7s
MERGED 7eb5884
```

## Seal gate
Operator typed `/ship --merge and /release` (covers commit + push + merge into staging). Unrelated working-tree files: asked via AskUserQuestion → operator: "là tôi làm, hãy ship chung" → shipped in a separate chore commit.
