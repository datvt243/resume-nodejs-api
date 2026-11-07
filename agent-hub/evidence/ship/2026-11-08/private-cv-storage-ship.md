# 2026-11-08 - private-cv-storage (ship)
- Node: `private-cv-storage` — SEALED (`evidence/verifier/2026-11-08/private-cv-storage-seal-r2.md`; implementer `evidence/implementer/2026-11-08/private-cv-storage-diff.md` + `-diff-r2.md`)
- Branch: `383-generated-pdfs-uploaded` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add src/services/createPDF.ts src/middlewares/uploadCV.middleware.ts src/server.ts src/__tests__/services/createPDF.test.ts src/__tests__/middlewares/uploadCV.middleware.test.ts .gitignore .dockerignore Dockerfile agent-hub/doctrine/features/cv-export.md agent-hub/evidence/worker-runs.log agent-hub/haven/diagrams/dev-loop-archive.md agent-hub/haven/diagrams/dev-loop.prime-mermaid.md agent-hub/evidence/implementer/2026-11-08/ agent-hub/evidence/verifier/2026-11-08/ agent-hub/evidence/ship/2026-11-08/`
- `git commit -F -` (title `fix(cv): stop serving generated PDFs and uploaded CVs from public/`, `Closes #383.`)
- `git push origin 383-generated-pdfs-uploaded`
- `gh pr create --base staging --head 383-generated-pdfs-uploaded …`
- `gh pr checks 383-generated-pdfs-uploaded --watch --required`
- `gh pr merge 432 --merge --delete-branch`
- `git checkout staging && git pull --ff-only`

## Output
```
cf0b416 fix(cv): stop serving generated PDFs and uploaded CVs from public/
   a965a05..cf0b416  383-generated-pdfs-uploaded -> 383-generated-pdfs-uploaded
https://github.com/datvt243/resume-nodejs-api/pull/432
build (20.x)	pass	54s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42418351305/job/128541208397
build (22.x)	pass	59s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42418351305/job/128541208565
MERGED bd993b3
staging
```

## Seal gate
Operator: `/todo #380 #394 #382 #383 #387, xong tự chạy /ship --merge` + "ok resolve conflict rồi merge, tiếp #394" (covers commit/push/merge for each issue in the batch).
