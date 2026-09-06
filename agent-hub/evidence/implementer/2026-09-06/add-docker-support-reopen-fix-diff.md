# 2026-09-06 — add-docker-support (REOPEN fix, round 2)

- Worker: implementer
- Version: 0.1.0
- Node: `add-docker-support` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: address the verifier's REOPEN
  (`evidence/verifier/2026-09-06/add-docker-support-reopen.md`) on round 1
  (`evidence/implementer/2026-09-06/add-docker-support-diff.md`).

## Hub bytes before: 55562 (unchanged from round 1 — same session)

## What round 1's verifier found (REOPEN reason, quoted from their note)
> **Missing**: Acceptance criterion "Works for production" is not met
> for the documented/default configuration. Following the exact steps
> the note's own README section instructs (`cp .env.example .env`, fill
> in `TOKEN_SECRET`/`TOKEN_REFRESH`/`SESSION_SECRET`, then
> `docker compose -f docker-compose.prod.yml up -d --build`) produces an
> `unhealthy`, unreachable container, because `docker-compose.prod.yml`'s
> port-mapping template (`'${LOCAL_PORT:-3008}:${LOCAL_PORT:-3008}'`)
> does not account for `src/server.ts:127` always hardcoding port 3008
> in production regardless of `LOCAL_PORT`, and `.env.example` ships
> `LOCAL_PORT=3001`.
>
> Secondary, non-blocking: a stray `mongo` container from an earlier
> session was found still running — teardown claim wasn't fully checked
> against `docker ps -a`.

## Fix
| File | Change |
|---|---|
| `docker-compose.prod.yml` | Port mapping changed from `'${LOCAL_PORT:-3008}:${LOCAL_PORT:-3008}'` to a fixed `'3008:3008'` — not templated at all, since `src/server.ts` ignores `LOCAL_PORT` in production regardless (verified: Compose's own `${VAR}` substitution reads the same project-root `.env` the `env_file:` directive injects into the container, so templating the host side off `LOCAL_PORT` would have silently followed `.env.example`'s `3001` too). Added a comment block explaining why the port is a literal, pointing at the new trap below. |
| `Dockerfile` | `HEALTHCHECK` changed from probing `process.env.LOCAL_PORT||3008` to a hardcoded `port:3008` — same reasoning, the production target always binds 3008 regardless of what `LOCAL_PORT` is set to. |
| `docker-compose.yml` + `docker-compose.prod.yml` | Mongo healthcheck `timeout` raised `5s` → `10s`, added `start_period: 30s`. Unrelated to the port bug but found live while re-testing (see "Second bug found" below) — genuinely flaky on this host, not a false positive from the fix above. |
| `Dockerfile` | Production stage now runs `RUN mkdir -p src/public/pdf src/public/uploads/cv src/public/uploads/images` before `EXPOSE`. Fixes a second, previously-undiscovered bug — see below. |
| `.dockerignore` | Narrowed the 2 blanket excludes (`src/public/pdf`, `src/public/uploads`) to per-file globs that keep each directory's `.gitkeep` (`src/public/pdf/*` + `!.../.gitkeep`, same for the 2 upload dirs) — otherwise the `development`/`build` stages' `COPY . .` would silently drop these directories from the build context too (previously masked in dev only because `docker-compose.yml` bind-mounts the real host `.` over the image, hiding the gap). |
| `agent-hub/doctrine/domains/PROJECT.md` | 2 new Traps table rows (see below) — real bugs found live, not fixed (out of scope for this Docker node), flagged per doctrine convention. |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | 2 new PENDING nodes: `fix-prod-port-ignores-local-port`, `fix-hardcoded-src-public-write-paths` — mirroring the 2 new traps. |

## Second bug found (not in round 1's REOPEN, found while re-verifying)
While reproducing the verifier's exact repro steps after the port fix,
production's `GET /api/v1/download-pdf` returned `500`:
```
{"status":false,"message":"Xảy ra lỗi, không thể đọc browser","error":{"errno":-2,"code":"ENOENT","syscall":"open","path":"src/public/pdf/docker-prod-fix+...@example.com.pdf"}}
```
Root cause: `src/services/createPDF.ts:9` (`const URL = \`src/public/pdf/\`;`),
`src/middlewares/uploadCV.middleware.ts:22`, and
`src/middlewares/uploadImages.middleware.ts:19` all hardcode a RELATIVE
`src/public/...` path regardless of `NODE_ENV` — not `dist/public/...`,
which is what `express.static(path.join(__dirname, 'public'))` actually
serves in production. `git ls-files` confirms all 3 target directories
only exist because of a checked-in `.gitkeep` each — the app never
creates them itself. This works on the real Render deploy only because
that host's working directory happens to contain both `src/` and `dist/`
side by side (full checkout), not because the path is actually correct.
The minimal production image (only `COPY --from=build /app/dist ./dist`,
no `src/` at all) has no such directory, hence `ENOENT`.

Fixed **for this Docker node's scope** by `mkdir -p`-ing the 3 literal
paths in the production stage (see Fix table) — the underlying app-code
design flaw (relative paths not anchored to `__dirname`) is flagged as
its own trap/node (`fix-hardcoded-src-public-write-paths`) rather than
fixed here, per `SmallestDiff`/`NodeBeforeCode` — changing
`createPDF.ts`/the 2 middleware files is a separate, unrelated node with
its own acceptance criteria, not implied by "add Docker support."

## Also checked, not a bug
Round 1's secondary finding — a stray `mongo` container from an earlier
session — was independently re-confirmed clean this round: `docker ps -a`
before starting showed only 1 unrelated, long-exited container
(`nifty_maxwell`, 21 months old, from an unrelated project image) — no
stray `resume-nodejs-api-*` containers. Checked explicitly this time,
per the verifier's ask.

## Command
```
npm run build
```
Output: `tsc && npm run copy` — clean, no errors.

```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, copied
verbatim from `doctrine/MEMORY.md`)

Output (tail):
```
Test Suites: 13 passed, 13 total
Tests:       77 passed, 77 total
Snapshots:   0 total
Time:        7.098 s
Ran all test suites.
```
Unchanged 13/77 baseline (Docker-only diff, no test surface).

## Live verification (real Docker daemon), reproducing the verifier's exact repro
1. `docker ps -a` → only the 1 unrelated pre-existing container. Clean start confirmed explicitly this round.
2. `docker compose -f docker-compose.prod.yml down -v` (from round 1's leftover state) → removed.
3. `docker compose -f docker-compose.prod.yml up -d --build` (image rebuilt with the fix) → `mongo` reported `Healthy` immediately this time (healthcheck timeout fix holding).
4. **Exact reproduction of the verifier's failing case**: `cp .env.example .env`, filled only the 3 secrets the README instructs, left `LOCAL_PORT=3001` untouched (the shipped default) —
   `docker ps` showed `resume-nodejs-api-api-1 ... Up ... (healthy) 0.0.0.0:3008->3008/tcp` (not 3001 — confirms the fix).
   `curl http://localhost:3008/health` → `200 {"status":"ok",...}`.
   `curl http://localhost:3001/health` → `curl: (7) Failed to connect` — confirms nothing is (incorrectly) published on 3001, matching `LOCAL_PORT`'s real (ignored) effect in production.
   Container logs: `App listening on port: 3008 - production`.
5. Full functional round trip on this corrected prod stack (real throwaway account):
   - `POST /api/v1/auth/register` → `200`
   - `GET /api/v1/auth/login` → `200`, real JWT pair
   - `GET /api/v1/download-pdf?token=...` → **`200`, `file` confirms
     `PDF document, version 1.4, 1 pages`** — this is the live proof the
     second bug (ENOENT) is actually fixed, not just theorized.
   - `DELETE /api/v1/candidate` (self) → `200`, test account removed.
6. Also directly confirmed inside the running container:
   `docker exec resume-nodejs-api-api-1 sh -c "ls -la src/public/pdf src/public/uploads/cv src/public/uploads/images"`
   → all 3 exist, empty, writable (created by the new `RUN mkdir -p`).
7. `docker inspect ... .State.Health.Status` → `healthy` for both `api`
   and `mongo` at teardown time (not just eventually-consistent).
8. Teardown: `docker compose -f docker-compose.prod.yml down -v`,
   throwaway `.env` deleted, both generated test PDFs deleted from the
   host bind-visible `src/public/pdf/` directory. `git status --porcelain`
   confirmed only the intended files changed (see Diff table across both
   rounds) before writing this note. `docker ps -a` re-checked clean
   after teardown (only the same 1 unrelated pre-existing container).

## Acceptance (re-checked against the REOPEN reason specifically)
| Criterion | Evidence |
|---|---|
| Production stack reachable using the exact documented default config (`.env.example` unmodified `LOCAL_PORT=3001`) | Live-verified above — `healthy`, `:3008/health` → 200, `:3001` correctly unreachable |
| No regression to the dev stack's already-passing criteria | Not touched by the port fix; dev's `LOCAL_PORT` handling was already correct (verifier's round-1 re-run confirmed dev fine) — mongo healthcheck timeout bump applies to both files identically, strictly increases robustness |
| Teardown leaves no stray containers | `docker ps -a` checked explicitly before AND after this round, not just `git status` |
| `npm run build` / `npm test` clean | See Command/Output above |

## Seal gate
No outward-facing action taken — no `commit`/`push`. All Docker commands
ran against local, throwaway containers/data only; no registry push, no
external network calls beyond pulling `mongo:7` (already cached from
round 1) and `apt`/`npm` package resolution (already cached from round
1's image layers). `src/`-adjacent diff (`Dockerfile`,
`docker-compose.prod.yml`, `docker-compose.yml`, `.dockerignore`) shown
in full below per the seal gate.
