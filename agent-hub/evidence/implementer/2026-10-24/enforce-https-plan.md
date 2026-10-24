# 2026-10-24 - enforce-https (plan)

- Worker: implementer · Version: 0.1.0
- Node: `enforce-https` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #292): "feat(security): HTTPS enforcement / HSTS" — "Carried over from the retired `TODO.md` (item 5.10). No HTTPS redirect or `Strict-Transport-Security` header anywhere in `src/` (behind a proxy this needs `trust proxy` + `x-forwarded-proto`). May be covered by helmet's HSTS if that issue lands first."
- Branch: `292-feat-security-https` (from freshly pulled `staging` @ 1aff48c, linked via `gh issue develop`)

## Hub bytes before: 81431

## Node
No prior node for #292 / slug `enforce-https` in active diagram or archive. New row appended (AppendOnly), PENDING.

## Design
- HSTS half: already done — helmet (#290, node `add-security-headers`) sends `Strict-Transport-Security` by default; `helmet.config.test.ts` asserts `max-age=`. No change.
- Redirect half: new `src/middlewares/httpsRedirect.middleware.ts`. Reads `x-forwarded-proto` header directly (first comma value) instead of enabling `trust proxy` + `req.secure`: spoofing that header only affects the spoofer's own request, whereas `trust proxy` also changes `req.ip` (rate limiter, visit geo) and a wrong hop count lets clients spoof IPs → out of scope, own node.
- Production only (`NODE_ENV` from `@/config/process.config`, same source as errors middleware). Local dev / docker-compose without a proxy have no header → no-op.
- 308 (not 301) so POST/PUT bodies aren't turned into GETs.
- `/health` exempt: Dockerfile HEALTHCHECK and platform health checks call it over plain HTTP.
- Mount right after `requestLogger` in `src/server.ts`.

## Anchors
- `src/server.ts:37` (`app.use(requestLogger)`), `src/middlewares/index.ts` barrel, `src/config/process.config.ts:18` NODE_ENV, `Dockerfile:68` healthcheck.

## Blockers: none
