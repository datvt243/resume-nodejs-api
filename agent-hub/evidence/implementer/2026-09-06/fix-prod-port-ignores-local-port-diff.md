# 2026-09-06 — fix-prod-port-ignores-local-port (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-prod-port-ignores-local-port` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): `/todo "fix-prod-port-ignores-local-port"`

## Hub bytes before: 61270

## Investigation (before touching code)
Node already exists on the diagram (PENDING, added 2026-09-06 during
`add-docker-support`'s round 2 fix) with a real, cited code anchor:
`src/server.ts:127` — `const _portNumber = _env !== 'production' ?
portNumber : 3008;`. Re-read the trap entry in
`doctrine/domains/PROJECT.md` for the exact remediation options it
recorded: "Either respect `LOCAL_PORT` in production too (drop the
`_env !== 'production'` branch), or document that production always
means 3008 and stop reading `LOCAL_PORT` for it at all — pick one."

Chose option 1 (respect `LOCAL_PORT`), but preserved the existing
env-specific *default* (3001 dev / 3008 prod) for when `LOCAL_PORT` is
genuinely unset — not a blind drop of the ternary — because:
- `README.md`/`CLAUDE.md` document "dev port 3001 / prod port 3008" as
  the intended default; a deploy that has never set `LOCAL_PORT`
  (possibly the real Render production service) must keep listening on
  3008 after this fix, unchanged.
- Only when an operator actually sets `LOCAL_PORT` should it now be
  honored in production too — that's the actual bug (silently ignored),
  not the existence of a production default.

Since this trap was created specifically because
`docker-compose.prod.yml`/`Dockerfile` had to work around the bug
(hardcoding `3008` on both sides instead of trusting `LOCAL_PORT`), also
reverted those 2 files back to templating off `${LOCAL_PORT:-3008}` /
`process.env.LOCAL_PORT||3008` now that the underlying bug is fixed —
in scope because leaving their comments/hardcoding in place would
immediately be stale, incorrect documentation of behavior this exact
node just changed (not scope creep into an unrelated area; same trap,
same commit-worthy unit of work).

## Diff
| File | Why |
|---|---|
| `src/server.ts:126-133` | `_portNumber` now `process.env.LOCAL_PORT ? portNumber : (_env !== 'production' ? portNumber : 3008)` — respects `LOCAL_PORT` whenever it's actually set, in every environment; only falls back to the old env-specific default (3001 dev / 3008 prod) when unset, so an existing deploy that never sets `LOCAL_PORT` keeps its current port unchanged. |
| `docker-compose.prod.yml` | Port mapping reverted from the round-2 workaround (`'3008:3008'`) back to `'${LOCAL_PORT:-3008}:${LOCAL_PORT:-3008}'` — safe now, since both Compose's own substitution and the container's actual bind read the same `LOCAL_PORT` value. Comment updated to describe the fix, not the bug. |
| `Dockerfile` | `HEALTHCHECK` reverted from the round-2 workaround (hardcoded `port:3008`) back to `port:process.env.LOCAL_PORT||3008` — matches whichever port the app actually bound to. Comment updated. |

## Command
```
npx tsc --noEmit
```
Output: clean, no errors.

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
Time:        7.568 s, estimated 10 s
Ran all test suites.
```
Unchanged 13/77 baseline — `server.ts` has zero existing test coverage
(calls `startServer()` at import time, same pre-existing gap noted for
this file already); acceptance verified via live container testing
instead, matching the precedent set by `add-docker-support`.

## Live verification (real Docker daemon, not simulated)
`docker ps -a` before starting: only the 1 unrelated pre-existing
`nifty_maxwell` container (21 months old, exited) — clean start
confirmed explicitly.

**Case 1 — `LOCAL_PORT` unset (regression check)**: `cp .env.example
.env`, filled the 3 required secrets, then removed the `LOCAL_PORT=3001`
line entirely (simulating a deploy that never sets it, e.g. the real
Render service). `docker compose -f docker-compose.prod.yml up -d --build`:
```
resume-nodejs-api-api-1   ...   Up 52 seconds (healthy)   0.0.0.0:3008->3008/tcp
```
`curl http://localhost:3008/health` → `200 {"status":"ok",...}`. Log:
`App listening on port: 3008 - production`. **Confirms no regression**:
an unset `LOCAL_PORT` still defaults to 3008, exactly as before this fix.

**Case 2 — `LOCAL_PORT` set to a non-default value (the actual fix)**:
`docker compose -f docker-compose.prod.yml down -v`, appended
`LOCAL_PORT=5555` to the same `.env`, `docker compose -f
docker-compose.prod.yml up -d` (image already built, no code change
needed to rebuild):
```
resume-nodejs-api-api-1   ...   Up 49 seconds (healthy)   3008/tcp, 0.0.0.0:5555->5555/tcp
```
`curl http://localhost:5555/health` → `200 {"status":"ok",...}`. Log:
`App listening on port: 5555 - production`. **This is the load-bearing
proof**: before this fix, the app would have ignored `LOCAL_PORT=5555`
and bound 3008 regardless (per round 1's REOPEN finding on
`add-docker-support`) — now it genuinely listens on the configured port,
and the container reports `healthy` (confirms the `Dockerfile`
`HEALTHCHECK`'s own `process.env.LOCAL_PORT||3008` also correctly picked
up `5555`, not just the app itself).

Full live functional round trip on Case 2 (real throwaway account, port
5555 end-to-end):
- `POST /api/v1/auth/register` → `200`
- `GET /api/v1/auth/login` → `200`, real JWT pair
- `GET /api/v1/download-pdf?token=...` → `200`, `file` confirms `PDF
  document, version 1.4, 1 pages`
- `DELETE /api/v1/candidate` (self) → `200`, test account removed

Teardown: `docker compose -f docker-compose.prod.yml down -v`, throwaway
`.env` and generated test PDF (host-side `/tmp/fixport.pdf`) deleted.
`git status --porcelain` shows exactly 3 files
(`Dockerfile`/`docker-compose.prod.yml`/`src/server.ts`), no stray
generated PDFs under `src/public/pdf/` (only the pre-existing tracked
`votan.it@gmail.com.pdf`). `docker ps -a` re-checked clean after
teardown.

## Acceptance
| Criterion | Evidence |
|---|---|
| `LOCAL_PORT` respected in production when set | Case 2 above — app bound and served on `5555`, not `3008` |
| No regression when `LOCAL_PORT` is unset | Case 1 above — still defaults to `3008`, unchanged |
| `HEALTHCHECK` matches whichever port the app actually uses | Case 2 — container reached `healthy` on port 5555 |
| `docker-compose.prod.yml`'s port mapping and comments no longer describe a bug that's now fixed | Diff table — reverted to `${LOCAL_PORT:-3008}` templating, comment rewritten |
| `npx tsc --noEmit` / `npm run build` / `npm test` clean | See Command/Output above |

## Noticed, not done
- The real Render production deploy's actual `LOCAL_PORT` env var (if
  any) was not inspected — out of reach from this session (no access to
  Render's dashboard). If Render currently has `LOCAL_PORT` set to some
  value other than `3008` that was previously silently ignored, this fix
  would change the real production port for the first time. Flagging for
  the operator to confirm Render's env config before this ships to
  `main` — Case 1 above proves the *unset* case is unaffected, but
  cannot prove what Render's dashboard actually has configured.
- `src/server.ts` still has zero dedicated test coverage — a unit test
  for this port-selection logic would need `startServer()`'s
  side-effecting module-load pattern refactored to be testable in
  isolation, which is a larger, separate change than this node's scope.

## Seal gate
No outward-facing action taken — no `commit`/`push`. All Docker commands
ran against local, throwaway containers/data (real Docker daemon, ports
3008/5555 only on localhost). `src/` diff (`server.ts`) and the 2
Docker-adjacent files (`Dockerfile`, `docker-compose.prod.yml`) shown in
full above per the seal gate.
