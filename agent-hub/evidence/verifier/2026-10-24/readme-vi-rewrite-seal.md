# 2026-10-24 - readme-vi-rewrite (SEAL)
- Worker: verifier · Version: 0.1.0
- Node: `readme-vi-rewrite` · Issue #309 · Branch `309-docs-readme-vi`
- Note audited: `evidence/implementer/2026-10-24/readme-vi-rewrite-diff.md`

## Isolation proof
Agent-tool subagent spawned fresh by the agent-hub-init session with task "agent-hub VERIFIER worker ... Node to verify: `readme-vi-rewrite`"; no access to the implementer's conversation or reasoning, only files on disk.

## Verdict: SEAL

## Criteria
| # | Evidence | Verified |
|---|---|---|
| 1 Vietnamese | README.md | read: prose Vietnamese, commands/terms English |
| 2 Standard Readme order | README.md | title → desc → TOC → Tính năng → Bắt đầu nhanh/Docker → API docs/lệnh → sự cố → công nghệ → Đóng góp → License |
| 3 no emoji in headings | README.md | grep emoji ranges on `^#` lines → 0. TOC anchors match GitHub slugs (incl. `#tác-giả--license`) |
| 4 commands/paths exist | note file checks + scripts list | `package.json` scripts dev/build/start/test/lint/lint:fix/env:setup/copy present; `.env.example`, `API-STANDARD.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `docker-compose{,.prod}.yml` exist |
| 5 no stale facts | grep `\| POST` → 0 | no version string, no endpoint tables, no src tree, no test list |
| 6 facts retained | section list | old vs new walk: engines range + SlowBuffer reason, env vars, Docker dev 3001/prod 3008, Mongo 7 + volume, Redis not containerized, troubleshooting, branch model, deploy-on-main → Render, author, ISC, issues link all present. Dropped items (endpoint/auth-flow details, email-verify stub, CV upload/download, rate-limit `/health` exemption, JWT-invalid/rate-limited rows) are covered by Swagger `/api-docs` / API-STANDARD.md / CONTRIBUTING.md |
| 7 test/lint/build unchanged | 5f/454p, 275 lint errors = baseline; build clean | docs-only diff, verbatim counts |
| Comments per code-comments.md | n/a | no source file touched |
| Typecheck | `npm run build` no errors | matches MEMORY.md |

## Claim spot checks (true against repo)
- Engines `>=20.19.0 <23.0.0`, license ISC: `package.json`. No LICENSE file: confirmed.
- `npm run dev` → 3001: `.env.example` `LOCAL_PORT=3001`; `src/server.ts:107` default 3001 non-prod.
- Docker dev `3001:3001`, built-in dev secrets, no `.env`: `docker-compose.yml`. Prod `env_file: .env`, `${LOCAL_PORT:-3008}`, `mongo:7`: `docker-compose.prod.yml`.
- `MONGO_URI` or `MONGOBD_USER/PASSWORD`: `src/database/mongo.db.ts:31-41`.
- CSRF on cookie-only mutating requests: `src/utils/csrf.ts:48` (`tokenSource==='cookie' && !SAFE_METHODS`), enforced in `verifyToken.middleware.ts:52`. True.
- `/health`, `/api-docs`, `/api-docs.json`: `src/server.ts:75,84,85`. `/api/me/search`: `src/routers/index.ts:78`.
- `logs/`: `src/logger/winston.ts:10` (`LOG_DIR='./logs'`). Deploy: `.github/workflows/deploy.yml` push main → Render.
- Tech majors (Express 4, TS 5, Mongoose 8, Redis 4, ESLint 9, Jest) match `package.json`.
- Minor imprecision, not blocking: `?lang=` is honored only on public `/api/me` + public PDF endpoints (`candidate_me/index.ts:37`, `public-pdf.ts:70`), README phrases it as general alongside `Accept-Language`.

## Checks
- Command matches `doctrine/MEMORY.md` (`npm test`, `npm run build`). Output not truncated.
- 6b: no other open row for #309; `## Supersedes: none`.
- Forbidden states: none hit.
- Seal gate: operator approval quoted in note.
- Proportion: README.md + diagram row only.

## Re-run: none
Docs-only, not outward-facing/release; note covers every criterion. Only read-only greps against repo to confirm README claims.
