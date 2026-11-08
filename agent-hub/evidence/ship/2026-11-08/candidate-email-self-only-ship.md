# 2026-11-08 - candidate-email-self-only (ship)
- Node: `candidate-email-self-only` — SEALED (`evidence/verifier/2026-11-08/candidate-email-self-only-seal-r2.md`; implementer `evidence/implementer/2026-11-08/candidate-email-self-only-diff.md` + `-diff-r2.md`)
- Branch: `394-candidate-email-self` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add src/candidate/candidate.controller.ts src/__tests__/candidate/candidate.controller.test.ts src/routers/api/v1/candidate.route.ts .claude/rules/api.md agent-hub/doctrine/features/candidate-account.md agent-hub/evidence/worker-runs.log agent-hub/haven/diagrams/dev-loop-archive.md agent-hub/haven/diagrams/dev-loop.prime-mermaid.md agent-hub/evidence/implementer/2026-11-08/ agent-hub/evidence/verifier/2026-11-08/ agent-hub/evidence/ship/2026-11-08/`
- `git commit -F -` (title `fix(candidate): GET /candidate/:email answers only the caller's own record`, `Closes #394.`)
- `git push origin 394-candidate-email-self`
- `gh pr create --base staging --head 394-candidate-email-self …`
- `gh pr checks 394-candidate-email-self --watch --required`
- `gh pr merge 430 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
c79eb25 fix(candidate): GET /candidate/:email answers only the caller's own record
   bc4a3f1..c79eb25  394-candidate-email-self -> 394-candidate-email-self
https://github.com/datvt243/resume-nodejs-api/pull/430
build (20.x)	pass	58s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42417194884/job/128537740336
build (22.x)	pass	58s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42417194884/job/128537740213
MERGED db07ab7
staging
```

## Seal gate
Operator: `/todo #380 #394 #382 #383 #387, xong tự chạy /ship --merge` + "ok resolve conflict rồi merge, tiếp #394" (covers commit/push/merge for #394).
