# 2026-11-08 - public-profile-field-whitelist (ship)
- Node: `public-profile-field-whitelist` — SEALED (`evidence/verifier/2026-11-08/public-profile-field-whitelist-seal.md`; implementer `evidence/implementer/2026-11-08/public-profile-field-whitelist-diff.md`)
- Branch: `382-public-profile-payload` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add src/candidate_me/index.ts src/__tests__/candidate_me/index.test.ts agent-hub/doctrine/features/public-profile.md agent-hub/evidence/worker-runs.log agent-hub/haven/diagrams/dev-loop-archive.md agent-hub/haven/diagrams/dev-loop.prime-mermaid.md agent-hub/evidence/implementer/2026-11-08/ agent-hub/evidence/verifier/2026-11-08/ agent-hub/evidence/ship/2026-11-08/`
- `git commit -F -` (title `fix(public-profile): explicit whitelist of public candidate fields`, `Closes #382.`)
- `git push origin 382-public-profile-payload`
- `gh pr create --base staging --head 382-public-profile-payload …`
- `gh pr checks 382-public-profile-payload --watch --required`
- `gh pr merge 431 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
3e61d35 fix(public-profile): explicit whitelist of public candidate fields
   db07ab7..3e61d35  382-public-profile-payload -> 382-public-profile-payload
https://github.com/datvt243/resume-nodejs-api/pull/431
build (20.x)	pass	50s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42417740946/job/128539375626
build (22.x)	pass	41s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42417740946/job/128539375947
MERGED a965a05
staging
```

## Seal gate
Operator: `/todo #380 #394 #382 #383 #387, xong tự chạy /ship --merge` + "ok resolve conflict rồi merge, tiếp #394" (covers commit/push/merge for each issue in the batch).
