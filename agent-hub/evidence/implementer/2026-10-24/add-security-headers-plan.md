# 2026-10-24 - add-security-headers (plan)

- Worker: implementer · Version: 0.1.0
- Node: `add-security-headers` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #290): "feat(security): add HTTP security headers (helmet)" — "Carried over from the retired `TODO.md` (item 5.7). No `helmet` (or equivalent) middleware in `src/server.ts` — responses ship without CSP, X-Content-Type-Options, X-Frame-Options, etc."
- Branch: `290-feat-security-add` (from fresh `staging`)

## Hub bytes before: 81139

## Node
No prior node for #290 in active diagram or archive (slug free). New row appended at end (AppendOnly), state PENDING (implementer never sets PM status beyond the initial row).

## Acceptance criteria (on node)
1. CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, HSTS present; `X-Powered-By` absent — real-HTTP test.
2. `Cross-Origin-Resource-Policy: cross-origin` (helmet default `same-origin` would break the cross-origin SPA embedding `public/` uploads).
3. Swagger UI `/api-docs` still works under CSP `script-src 'self'` (swagger-ui-express uses external scripts + inline styles; default `style-src` allows `'unsafe-inline'`).
4. `npm test` + `npm run build` green; `npm run lint` 0 new problems.
5. Comments per code-comments.md.

## Anchors
- `src/server.ts:35` (`app.use(requestLogger)`) — mount point.
- `src/config/cors.config.ts`, `src/config/index.ts` — config pattern to mirror.
- `src/__tests__/middlewares/uploadCvPdfParse.test.ts` — real-HTTP ephemeral-app test pattern (no supertest installed).

## Dependency
`helmet` not installed → `npm install helmet` (runtime dep). Issue names it explicitly; hand-writing its header set would be more code than the dep.

## Blockers: none
