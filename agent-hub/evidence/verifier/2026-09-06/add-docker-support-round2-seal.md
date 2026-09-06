# 2026-09-06 — add-docker-support round 2 (verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `add-docker-support` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: **SEALED** (was PENDING)

## Isolation proof
Spawned by the orchestrator as a standalone `Agent` (verifier role) with task text
beginning "You are acting as the `verifier` worker for the agent-hub... This is a
genuinely independent verification pass — you have NOT seen any prior conversation
about this task." No implementation history in this context; only read the
implementer's written notes (`evidence/implementer/2026-09-06/add-docker-support-diff.md`,
`evidence/implementer/2026-09-06/add-docker-support-reopen-fix-diff.md`) and round 1's
verdict (`evidence/verifier/2026-09-06/add-docker-support-reopen.md`), plus the repo
files and a real Docker daemon, independently.

Mid-task this pass hit an API session-limit cutoff while a supplementary (non-required)
dev-stack sanity re-check was still compiling in a container; the orchestrator found
and tore down the stray `resume-nodejs-api-api-1`/`resume-nodejs-api-mongo-1` containers
before resuming me. On resume I independently re-confirmed `docker ps -a` myself (only
the 1 unrelated pre-existing `nifty_maxwell`, 21 months old, exited) and `git status
--porcelain` (unchanged from before the cutoff) rather than trusting the orchestrator's
summary — both matched. All substantive verification below (build/test re-run, the
production repro, the full functional round trip, source-line checks) was completed
before the cutoff, in this same subagent context, prior to the interruption.

## Reasoning
Read both implementer notes for this node (round 1: `add-docker-support-diff.md`;
round 2 fix: `add-docker-support-reopen-fix-diff.md`) and round 1's verifier REOPEN
(`add-docker-support-reopen.md`). Read the diagram row (`dev-loop.prime-mermaid.md`,
`add-docker-support` PENDING + 2 new sibling PENDING trap rows
`fix-prod-port-ignores-local-port`/`fix-hardcoded-src-public-write-paths`, both present
before this verdict) and `CLAUDE.md`'s forbidden-states table (auto-injected).

**Re-run scope justification**: same as round 1 — this node has zero Jest coverage
(infra only); its acceptance rests entirely on manual live-container verification. Round
1 already found a real production bug this way, so per `verify_seal.md`'s "Re-run scope"
exception #2 (this project has shipped a real prod bug before; independent confirmation
is worth paying for when there's no automated backstop) I again escalated to a full
re-run rather than auditing the note alone — especially since round 2's core claim is
"the exact thing round 1 found broken is now fixed," which is not credible from citation
alone.

1. **Files match the note's claims, read directly, not via the note's excerpts**:
   - `docker-compose.prod.yml` port mapping: hardcoded literal `'3008:3008'`, not
     templated off `${LOCAL_PORT}` — confirmed at line 50, with an explanatory comment
     block (lines 11-19) matching the note's stated reasoning.
   - `Dockerfile` `HEALTHCHECK`: hardcoded `port:3008` (line 68), not
     `process.env.LOCAL_PORT||3008` — confirmed, with an explanatory comment (lines 61-66).
   - `Dockerfile` production stage: `RUN mkdir -p src/public/pdf src/public/uploads/cv
     src/public/uploads/images` present (line 59), with a comment (lines 51-58) citing
     the 3 hardcoded-path bug as the reason.
   - `.dockerignore`: narrowed from a blanket exclude to per-file globs preserving each
     `.gitkeep` (`src/public/pdf/*` + `!.../.gitkeep`, same pattern ×3 for the 2 upload
     dirs) — confirmed lines 14-23.
   - Mongo healthcheck bump in **both** `docker-compose.yml` and `docker-compose.prod.yml`:
     `timeout: 10s` (was 5s per the note), `start_period: 30s` (new) — confirmed present
     identically in both files via `grep -n "timeout\|start_period"`.
2. **`npm run build`, re-run independently from repo root**: clean, `tsc && npm run
   copy`, no errors — matches the note exactly.
3. **`npm test`, re-run independently from repo root**: `Test Suites: 13 passed, 13
   total` / `Tests: 77 passed, 77 total` / `Time: 6.905s` — matches the note's cited
   13/77 exactly (command matches `doctrine/MEMORY.md` verbatim: `npm test` from repo
   root).
4. **Independently reproduced round 1's exact failing repro, from a clean slate**:
   - `docker ps -a` before starting: only the 1 unrelated `nifty_maxwell` container —
     confirmed no stray state left over from either implementer round.
   - `cp .env.example .env`; confirmed `.env.example` ships `LOCAL_PORT=3001` and
     placeholder `SESSION_SECRET`/`TOKEN_SECRET`/`TOKEN_REFRESH` values (read the file
     directly). Filled in only those 3 secrets with new throwaway values; left
     `LOCAL_PORT=3001` untouched — did not re-hide the bug by setting it to 3008 myself.
   - `docker compose -f docker-compose.prod.yml up -d --build`: image built clean, `mongo`
     reached `healthy`, `api` started.
   - `docker ps` / `docker inspect --format '{{.State.Health.Status}}'`: `api` reached
     **`healthy`**, published on **`0.0.0.0:3008->3008/tcp`** (confirmed literally, not
     3001).
   - `curl http://localhost:3008/health` → `200 {"status":"ok",...}`.
   - `curl --max-time 3 http://localhost:3001/health` → `HTTP_STATUS:000` (connection
     failed) — confirms nothing is incorrectly published on 3001, exactly matching
     `LOCAL_PORT`'s real (ignored-in-production) effect and round 2's own claimed result.
   - This directly contradicts round 1's finding under the identical default
     configuration — the port bug is fixed.
5. **Full live functional round trip against the corrected production stack** (real
   throwaway account, real Docker daemon, not simulated):
   - `POST /api/v1/auth/register` → `200`, `"Đăng ký thành công"`.
   - `GET /api/v1/auth/login` (JSON body per `schemaAuthLogin`, despite GET) → `200`,
     real JWT `token`/`tokenRefresh` pair.
   - `GET /api/v1/download-pdf?token=...` → **`200`**; downloaded file identified by
     `file` as `PDF document, version 1.4, 1 pages` — a real, non-empty PDF, not a
     theorized fix. This is the load-bearing check for the second (ENOENT) bug.
   - `docker exec resume-nodejs-api-api-1 sh -c "ls -la src/public/pdf ..."` — confirmed
     the generated PDF (`verifier-round2-<ts>@example.com.pdf`) actually landed inside
     the container's `src/public/pdf/` directory, i.e. the exact directory created by the
     new `RUN mkdir -p` line — not a coincidental success some other way.
   - `DELETE /api/v1/candidate` (self, `Authorization: Bearer <token>`) → `200`,
     `"Xoá tài khoản thành công"` — test account removed.
   - Container logs corroborate every step (`POST .../register 200`, `GET .../login 200`,
     `GET .../download-pdf ... 200 - 800ms`), no errors.
6. **Source-line accuracy of the 2 new trap/PENDING descriptions**, read directly rather
   than trusted from the note or the trap text itself:
   - `src/server.ts:127` — `grep`/direct read confirms exactly
     `const _portNumber = _env !== 'production' ? portNumber : 3008;` — matches the trap
     verbatim.
   - `src/services/createPDF.ts:9` — confirms `const URL = \`src/public/pdf/\`;` exactly
     at line 9.
   - `src/middlewares/uploadCV.middleware.ts:22` — confirms
     `export const CV_UPLOAD_DIR = path.join('src', 'public', 'uploads', 'cv');` exactly
     at line 22.
   - `src/middlewares/uploadImages.middleware.ts:19` — confirms
     `export const IMAGE_UPLOAD_DIR = path.join('src', 'public', 'uploads', 'images');`
     exactly at line 19.
   - All 4 line numbers cited in both the note and the doctrine Traps table /
     diagram PENDING rows are accurate against the real source, not approximate.
7. **`git status --porcelain`**, checked before and after all of my own Docker actions:
   shows exactly the files round 2's note claims to have touched —
   `README.md`/`agent-hub/doctrine/domains/PROJECT.md`/
   `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` (modified),
   `.dockerignore`/`Dockerfile`/`docker-compose.yml`/`docker-compose.prod.yml` (new,
   untracked), plus the 2026-09-06 evidence directories. `git status --porcelain --
   src/public/` is clean — no stray generated PDFs/test artifacts committed or left as
   untracked files (my own test PDF only ever existed inside the container's ephemeral
   filesystem, since `docker-compose.prod.yml` has no bind mount for `api` — it never
   touched the host).
8. **`docker ps -a`**, checked before my pass (only `nifty_maxwell`) and after full
   teardown (`docker compose -f docker-compose.prod.yml down -v`, throwaway image and
   `.env` removed) — back to only `nifty_maxwell`. No stray containers survived my pass.
9. A supplementary (not required by the checklist) dev-stack spot re-check was attempted
   for extra due diligence but did not finish before an API session-limit cutoff — its
   `npm run dev` (ts-node, no `transpile-only`) took several minutes to cold-compile over
   the bind-mounted volume on this host; CPU/memory traces (`ps aux` inside the
   container, `docker stats`) showed it actively compiling, not hung or errored. The
   orchestrator tore down the resulting stray containers before resuming me. This is not
   treated as a finding against the diff: round 1's verifier already independently and
   fully re-ran the dev stack (`add-docker-support-reopen.md` Reasoning #4) and confirmed
   it healthy end-to-end; round 2's diff only changes the mongo healthcheck
   `timeout`/`start_period` for dev (a strictly more lenient, non-breaking change) —
   it does not touch the `development` Dockerfile target, `docker-compose.yml`'s `api`
   service, or anything else dev-boot-relevant. Re-deriving that already-settled result
   was not repeated a second time after the interruption, to avoid repeating the same
   stray-container risk for a check that isn't part of this round's REOPEN reason.

## Forbidden states scanned
1. **`ADHOC_WORK`** — not present. Node exists on the diagram
   (`dev-loop.prime-mermaid.md`, `add-docker-support`, PENDING prior to this verdict),
   work happened inside the implementer role with 2 evidence notes (round 1 + round 2
   fix), addressing a verifier's named REOPEN reason.
2. **`NO_EVIDENCE`** — not present. Both implementer notes exist with real cited
   commands/output; this verdict's own claims are all independently re-derived above,
   not inferred.
3. **`EDIT_UNVERIFIED`** — not present. Every claim in round 2's note that mattered for
   the REOPEN reason was independently reproduced: the port fix (healthy on 3008, 3001
   unreachable, from the exact documented default `.env`), the second bug's fix (real
   PDF downloaded and confirmed written into the `mkdir -p`-created directory inside the
   container), `npm run build`/`npm test` re-run to identical results, and the 4 cited
   source line numbers checked directly against the real files.
4. **`CODE_IN_HAVEN`** — not present. `git status --porcelain` shows the only
   `agent-hub/` writes are `doctrine/domains/PROJECT.md` (2 new Traps table rows, prose)
   and `haven/diagrams/dev-loop.prime-mermaid.md` (2 new PENDING rows + this verdict's
   SEAL edit) — both markdown, no runnable code under `haven/`. All Docker/app files
   (`Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-compose.prod.yml`) live
   at repo root, outside `agent-hub/`.
5. **`DIAGRAM_DRIFT`** — not present after this verdict. Before: `add-docker-support`
   PENDING while round 2's fix (independently confirmed working) sat unsealed — moving it
   to SEALED now matches the real, independently-verified code state. The 2 sibling trap
   nodes (`fix-prod-port-ignores-local-port`, `fix-hardcoded-src-public-write-paths`)
   correctly remain PENDING (not this node's concern, not fixed in `src/`, per
   `SmallestDiff`/`NodeBeforeCode`) — not touched by this SEAL, consistent with
   `AppendOnly`.

## Judgment: flag-not-fix for the 2 newly-found bugs
Same reasoning as round 1's `fix-chrome-executable-path` precedent: `SmallestDiff` says
the Docker node's job is "make the app run correctly in a container," not "fix every
latent app-code bug a container surfaces." Both underlying bugs
(`src/server.ts:127`'s hardcoded prod port, and the 3 hardcoded `src/public/...` write
paths) are pre-existing app-code issues, unrelated to Docker itself — they'd affect any
non-`src/`-carrying deploy topology, not just this one. Working around them at the
infra layer (hardcoded `3008:3008` + `mkdir -p`) while flagging the real fix as its own
node is the correct minimal diff; verified the trap descriptions are accurate against
the actual source (see Reasoning #6) rather than trusting the note's or the diagram's
line numbers blindly.

## Re-run
`full` — independently re-ran `npm run build` and `npm test` from repo root (matched
the note), and independently brought up, exercised, and tore down the **production**
Docker Compose stack for real from a clean `docker ps -a` state, reproducing round 1's
exact failing repro (`.env.example`'s default `LOCAL_PORT=3001`, only the 3 secrets
filled in) end-to-end including a full register/login/download-pdf/self-delete round
trip. Justified because: (1) this node has zero Jest/automated coverage; (2) round 1
already found a real, undisclosed-until-caught production bug via exactly this kind of
independent re-run, and round 2's central claim is that the same failure mode is now
fixed — not credible from the note's citation alone per `verify_seal.md`'s re-run-scope
exception #2. (A supplementary, non-required dev-stack spot-check was attempted but not
completed after an API session-limit cutoff — see Reasoning #9; not required for this
verdict since round 1 already fully covered dev and round 2 doesn't touch anything
dev-boot-relevant beyond a strictly safer healthcheck timing bump.)
