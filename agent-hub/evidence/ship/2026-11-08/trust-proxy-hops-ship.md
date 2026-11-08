# 2026-11-08 - trust-proxy-hops (ship)
- Node: `trust-proxy-hops` — SEALED (`evidence/verifier/2026-11-08/trust-proxy-hops-seal.md`; implementer `evidence/implementer/2026-11-08/trust-proxy-hops-diff.md`)
- Branch: `386-global-rate-limit` · Remote: `origin` (github.com/datvt243/resume-nodejs-api)

## Commands
- `git add src/config/proxy.config.ts src/config/index.ts src/server.ts src/__tests__/config/proxy.config.test.ts src/middlewares/httpsRedirect.middleware.ts src/candidate_me/index.ts CLAUDE.md agent-hub/doctrine/features/public-profile.md agent-hub/evidence/worker-runs.log agent-hub/haven/diagrams/dev-loop-archive.md agent-hub/haven/diagrams/dev-loop.prime-mermaid.md agent-hub/evidence/implementer/2026-11-08/ agent-hub/evidence/verifier/2026-11-08/ agent-hub/evidence/ship/2026-11-08/`
- `git commit -F -` (title `fix(rate-limit): key on the real client IP behind Render's proxy`, `Closes #386.`)
- `git push origin 386-global-rate-limit`
- `gh pr create --base staging --head 386-global-rate-limit …`
- `gh pr checks 386-global-rate-limit --watch --required`
- `gh pr merge 433 --merge --delete-branch`
- then `git checkout 387-auth-rate-limiter && git merge --ff-only origin/staging` (next node's branch, instead of staging)

## Output
```
77ce8bb fix(rate-limit): key on the real client IP behind Render's proxy
   bd993b3..77ce8bb  386-global-rate-limit -> 386-global-rate-limit
https://github.com/datvt243/resume-nodejs-api/pull/433
build (20.x)	pass	1m6s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42420173006/job/128546678399
build (22.x)	pass	59s	https://github.com/datvt243/resume-nodejs-api/actions/runs/42420173006/job/128546678825
MERGED be96cb1
```
Render env (separate operator-requested action, "ok, set TRUST_PROXY_HOPS=1 trên Render giúp mình"): `update_environment_variables` on service `srv-cqp0podds78s73e275og` (merge mode) → "Environment variables updated. A new deploy has been triggered" (`dep-dbnq832jnfac73d2v460`, deploys `main` @ v2.7.1 — the variable takes effect once this node reaches `main` via `/release`).

## Seal gate
Operator: "Fix #386 first, then #387 (Recommended)" during the `/todo … xong tự chạy /ship --merge` batch (covers commit/push/merge).
