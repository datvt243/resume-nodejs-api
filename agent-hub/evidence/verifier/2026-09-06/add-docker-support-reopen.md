# 2026-09-06 — add-docker-support (verifier verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `add-docker-support` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: REOPEN (row left as `PENDING` — RatchetOnly, no demotion needed since it
  was never advanced)

## Isolation proof
This pass was spawned by the orchestrator as a standalone `Agent` (subagent_type
`general-purpose`/verifier role) with task text beginning "You are acting as the
`verifier` worker for the agent-hub..." — no implementation history, no prior turns
about this task. Never saw the implementer's session; only read its written note
(`agent-hub/evidence/implementer/2026-09-06/add-docker-support-diff.md`) plus the repo
files themselves.

## Reasoning
Read the note (`add-docker-support-diff.md`), the diagram row (`dev-loop.prime-mermaid.md`
line 81, still `PENDING`, description matches the diff), and `CLAUDE.md`'s forbidden-states
table (auto-injected on touching `agent-hub/`).

`git status --porcelain` before any independent action confirmed exactly the 5 files the
note claims: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-compose.prod.yml`
(all untracked/new), `README.md` (modified), plus the diagram row addition (implementer's
own job, not PM-status-setting). Matches the note.

Command in the note (`npm run build`, `npm test`) matches `doctrine/MEMORY.md` verbatim.
Output not truncated.

**Re-run scope justification**: this node has zero Jest coverage (infra, not application
logic) — its only evidence for "works" is manual live-container testing, exactly the class
of unverifiable-by-citation-alone claim the task brief called out. Per `verify_seal.md`'s
"Re-run scope" exception #2 (this project has shipped a real prod bug once already;
independent confirmation is worth paying for when the evidence chain has no automated
backstop) I escalated past audit-only:

1. Independently opened `Dockerfile`, `.dockerignore`, `docker-compose.yml`,
   `docker-compose.prod.yml`, `README.md` diff directly (not just the note's quoted
   excerpts) — content matches the note's description in every case.
2. Re-ran `npm run build` from repo root — clean, identical output to the note (`tsc && npm
   run copy`, no errors).
3. Re-ran `npm test` from repo root — `Test Suites: 13 passed, 13 total` / `Tests: 77
   passed, 77 total` — matches the note exactly.
4. Docker was available (`docker info` succeeded). Re-ran the **dev** stack
   (`docker compose up -d --build`): `mongo` became healthy, `api` came up, logs showed
   `App listening on port: 3001 - development`, `curl http://localhost:3001/health` →
   `200 {"status":"ok",...}`. **Confirms the dev-stack acceptance criterion is real.**
   Torn down clean (`docker compose down -v`, image removed).
5. Re-ran the **production** stack using the *exact steps the note's own README diff
   documents* — `cp .env.example .env` (no manual edits beyond what the README instructs;
   `.env.example` already ships `LOCAL_PORT=3001` and placeholder secrets long enough to
   pass config validation) — then `docker compose -f docker-compose.prod.yml up -d --build`.

   **Result: the production container came up `unhealthy` and was unreachable on the
   host**, contradicting the note's claim of a live-verified, healthy production stack.
   Root cause, confirmed by direct inspection:
   - `src/server.ts:127` (pre-existing code, unrelated to this diff):
     `const _portNumber = _env !== 'production' ? portNumber : 3008;` — in production mode
     the app **always** hardcodes port 3008 internally, ignoring `LOCAL_PORT` entirely.
   - `docker-compose.prod.yml`'s port line, `'${LOCAL_PORT:-3008}:${LOCAL_PORT:-3008}'`,
     substitutes `LOCAL_PORT` from `.env` for **both** host and container side. With the
     shipped `.env.example` default (`LOCAL_PORT=3001`), this resolves to `3001:3001`.
   - Container logs confirmed the app actually bound to `3008` inside the container
     (`App listening on port: 3008 - production`) while the published mapping was
     `0.0.0.0:3001->3001/tcp` — nothing listens on the container's 3001, so the mapping is
     dead, and the `HEALTHCHECK` script (`process.env.LOCAL_PORT||3008`, resolving to 3001
     because `LOCAL_PORT=3001` **is** set) probes the wrong port too →
     `docker inspect ... .State.Health.Status` = `unhealthy`, `curl localhost:3001/health`
     and `curl localhost:3008/health` (unpublished) both failed (`HTTP_STATUS:000`).
   - This means the note's own live-verified `0.0.0.0:3008->3008/tcp ... (healthy)` result
     was only reproducible with a `.env` that set `LOCAL_PORT=3008` explicitly — a value
     that diverges from `.env.example`'s shipped default and from what the README's own
     new Docker section instructs (`cp .env.example .env`, fill in only the three secrets,
     then browse to `localhost:3008`). The note does not disclose this divergence.
   - Torn down clean after confirming (`docker compose -f docker-compose.prod.yml down -v`,
     image removed, throwaway `.env` deleted).
6. Also observed, while inspecting `docker ps -a` right before my dev re-run: a
   `resume-nodejs-api-mongo-1` container was already running, created ~27 minutes before
   this verifier pass started — i.e. it predates this session and was not torn down by
   whoever last ran it. The note claims "`git status --porcelain` confirmed clean before
   writing this note" (a file-level check) but does not claim to have checked
   `docker ps`/`docker volume ls` for stray containers — and a stray container was in fact
   present. This is a secondary, lower-severity gap in the teardown claim (no data/git
   damage from it, but it contradicts "leave no stray containers" being fully satisfied).
   Removed as part of my own teardown (`docker compose down -v`).

## Forbidden states scanned
1. **`ADHOC_WORK`** — not present. Node exists on the diagram
   (`dev-loop.prime-mermaid.md:81`, `add-docker-support`), work happened inside the
   implementer role with an evidence note.
2. **`NO_EVIDENCE`** — not present for the implementer's actions themselves; a note exists
   at `evidence/implementer/2026-09-06/add-docker-support-diff.md` citing real commands/output.
3. **`EDIT_UNVERIFIED`** — **present**. The note asserts "Works for production" as
   live-verified, but that result is not reproducible via the exact setup the note's own
   README diff documents (see Reasoning #5 above) — the claim holds only for an undisclosed
   non-default `.env` configuration. Claiming a result without it holding under the
   documented/general case is exactly what this forbidden state means.
4. **`CODE_IN_HAVEN`** — not present. All new files (`Dockerfile`, `.dockerignore`,
   `docker-compose.yml`, `docker-compose.prod.yml`) live at repo root; `README.md` edit is
   also outside `haven/`. Nothing runnable landed under `agent-hub/haven/`.
5. **`DIAGRAM_DRIFT`** — not present **for this node**. The note's "Noticed, not done"
   section flags that `fix-chrome-executable-path` (a separate, pre-existing PENDING node)
   looks like its underlying symptom no longer exists in `src/services/createPDF.ts` — but
   this diff never touches that file (diff table: `Dockerfile`, `.dockerignore`,
   `docker-compose.yml`, `docker-compose.prod.yml`, `README.md` only), so whatever fixed
   that trap's symptom happened in some earlier, unrelated change, not in this node's diff.
   Correctly flagging-not-fixing a different node's stale status (and not touching its PM
   row, respecting `AppendOnly`/`RatchetOnly` and that only a verifier pass on *that* node
   may move it) is the doctrine-correct behavior per `evidence/README.md`'s "Noticed, not
   done" format — not a drift this node is responsible for. Recommend a future
   `/worker verifier` pass specifically targeting `fix-chrome-executable-path` to check
   whether it should independently move to SEALED, but that is out of scope for this
   verdict.

## Missing
- **Acceptance criterion "Works for production" is not met for the documented/default
  configuration.** Following the exact steps the note's own README section instructs
  (`cp .env.example .env`, fill in `TOKEN_SECRET`/`TOKEN_REFRESH`/`SESSION_SECRET`, then
  `docker compose -f docker-compose.prod.yml up -d --build`) produces an `unhealthy`,
  unreachable container, because `docker-compose.prod.yml`'s port-mapping template
  (`'${LOCAL_PORT:-3008}:${LOCAL_PORT:-3008}'`) does not account for `src/server.ts:127`
  always hardcoding port 3008 in production regardless of `LOCAL_PORT`, and
  `.env.example` ships `LOCAL_PORT=3001`. Fix needs to either hardcode the container-side
  port to `3008` in the compose file (`'${LOCAL_PORT:-3008}:3008'`) or force
  `LOCAL_PORT=3008` in the `api` service's `environment:` block for the prod compose file,
  and the README's instructions should not silently depend on an unstated `.env` edit.
- Secondary, non-blocking: teardown claim ("no stray containers") wasn't fully true — a
  stray `mongo` container from an earlier session was found still running at the start of
  this verifier pass (see Reasoning #6). Worth the next implementer pass double-checking
  `docker ps -a` in addition to `git status --porcelain` before writing "clean" in a note.

## Re-run
`full` — re-ran `npm run build` and `npm test` in full from repo root (matched the note),
and independently brought up and tore down both the dev and production Docker Compose
stacks for real, including reproducing the note's exact documented setup steps for
production. Justified because: (1) this node has zero Jest/automated coverage — its entire
acceptance case rests on manual live-verification claims with no test-suite backstop, the
same class of risk `verify_seal.md`'s release-gate re-run exception is written for; (2)
Docker/CI is explicitly named in `doctrine/domains/PROJECT.md`'s Traps table
(`fix-chrome-executable-path`) as a place this codebase has broken before in exactly this
kind of environment-mismatch way.
