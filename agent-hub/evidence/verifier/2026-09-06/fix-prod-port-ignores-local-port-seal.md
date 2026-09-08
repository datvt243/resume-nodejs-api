# 2026-09-06 — fix-prod-port-ignores-local-port (verdict)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `fix-prod-port-ignores-local-port` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: **SEALED** (was PENDING)

## Isolation proof
Spawned by the orchestrator as a standalone `Agent` (verifier role), task text
beginning "You are acting as the `verifier` worker for the agent-hub ... This
is a genuinely independent verification pass — you have NOT seen any prior
conversation about this task." No implementation history in this context;
only read the implementer's written note
(`evidence/implementer/2026-09-06/fix-prod-port-ignores-local-port-diff.md`,
file mtime `Sep 7 00:24:50 2026`, pre-dating this session's own actions), the
repo files directly, and drove a real Docker daemon independently. Never had
access to whatever session produced the diff.

## Reasoning
Read the note, the diagram row (line 82, PENDING before this verdict), the
sibling PENDING row `fix-hardcoded-src-public-write-paths` (left untouched),
`doctrine/domains/PROJECT.md`'s trap entry, and `CLAUDE.md`'s forbidden-states
table (auto-injected).

**Re-run scope justification**: this is a `src/` behavior change with zero
Jest coverage (`server.ts` calls `startServer()` at import time, same
pre-existing gap the note itself names) — its entire acceptance case rests on
manual live-Docker verification. Per `verify_seal.md`'s "Re-run scope"
exception ("this class of change needs independent re-run — a per-project
call"), escalated to a full re-run rather than auditing the note alone,
matching the precedent already set for `add-docker-support` round 2.

1. **`src/server.ts` read directly** (not the note's excerpt): line 135 —
   `const _portNumber = process.env.LOCAL_PORT ? portNumber : _env !==
   'production' ? portNumber : 3008;` — confirmed: `LOCAL_PORT` respected
   whenever actually set, in every environment; falls back to the old
   env-specific default (3001 dev / 3008 prod, `portNumber` from
   `parseInt(LOCAL_PORT || '3001', 10)` at line 164) only when unset. Matches
   the note's description exactly.
2. **`docker-compose.prod.yml` / `Dockerfile` read directly**: port mapping
   at line 49 is `'${LOCAL_PORT:-3008}:${LOCAL_PORT:-3008}'` (not the prior
   node's hardcoded `'3008:3008'`); `HEALTHCHECK` at line 68 probes
   `port:process.env.LOCAL_PORT||3008` (not hardcoded `port:3008`). Both
   files carry updated comments describing the fix, not the bug. Confirmed
   reverted, not left hardcoded.
3. **`npx tsc --noEmit`**, re-run independently from repo root: exit 0, no
   output — clean, matches the note.
4. **`npm run build`**, re-run independently from repo root: `tsc && npm run
   copy`, exit 0 — clean, matches the note.
5. **`npm test`**, re-run independently from repo root (command matches
   `doctrine/MEMORY.md` verbatim): `Test Suites: 13 passed, 13 total` /
   `Tests: 77 passed, 77 total` / `Time: 7.221s` — matches the note's cited
   13/77 exactly.
6. **Independently reproduced both live-Docker cases, from a clean slate**:
   - `docker ps -a` before starting: only the 1 unrelated pre-existing
     `nifty_maxwell` container (21 months old, exited) — clean start
     confirmed, matches the note's own baseline.
   - Wrote my own `.env` (not derived from the note's) with only
     `SESSION_SECRET`/`TOKEN_SECRET`/`TOKEN_REFRESH`/`TOKEN_EXP_IN` —
     **`LOCAL_PORT` line genuinely omitted entirely**, not left at any
     default.
   - **Case 1 (regression check)**: `docker compose -f
     docker-compose.prod.yml up -d --build` → `api` reached `healthy`,
     published `0.0.0.0:3008->3008/tcp`. `curl http://localhost:3008/health`
     → `200 {"status":"ok",...}`. Container log: `App listening on port:
     3008 - production`. Confirms no regression: unset `LOCAL_PORT` still
     defaults to 3008.
   - **Case 2 (the actual fix, load-bearing)**: `docker compose down -v`,
     appended `LOCAL_PORT=6060` to the same `.env` (deliberately a different
     value from the note's own `5555`, not just re-confirming their number),
     `docker compose up -d` (no rebuild needed). Result: `api` reached
     `healthy`, published `3008/tcp, 0.0.0.0:6060->6060/tcp`. My own `curl
     http://localhost:6060/health` → `200 {"status":"ok",...}`. Container
     log: `App listening on port: 6060 - production`. **Additionally**
     confirmed `curl --max-time 3 http://localhost:3008/health` fails
     (`curl: (7) Failed to connect ... Couldn't connect to server`) —
     stronger than the note's own Case 2, proving the app is not also
     listening on 3008 as a fallback.
7. **Full live functional round trip on Case 2** (real throwaway account,
   port 6060, done myself, not inferred from the note):
   - `POST /api/v1/auth/register` (email+password+repassword, per
     `schemaAuthRegister`) → `200`, `"Đăng ký thành công"`.
   - `GET /api/v1/auth/login` (JSON body on a GET request — confirmed via
     `auth.controller.ts` that it reads `req.body`, not query) → `200`, real
     JWT `token`/`tokenRefresh` pair.
   - `GET /api/v1/download-pdf?token=...` (note: real route is
     `/api/v1/download-pdf`, not `/api/download-pdf` as `CLAUDE.md`'s doc
     summary states — confirmed via `router.get('/download-pdf', ...)` in
     `routers/api/v1/index.ts`) → `200`; downloaded file identified by `file`
     as `PDF document, version 1.4, 1 pages` — a real, non-empty PDF.
   - `DELETE /api/v1/candidate` (self, `Authorization: Bearer <token>`) →
     `200`, `"Xoá tài khoản thành công"` — throwaway account removed.
8. **Teardown and cleanliness**: `docker compose -f docker-compose.prod.yml
   down -v` — containers, volume, network removed. `docker ps -a` after:
   back to only `nifty_maxwell`, matching the pre-pass baseline exactly. My
   own `.env` and the downloaded test PDF (host-side
   `scratch-verifier.pdf`) deleted. `src/public/pdf/` contains only the
   pre-existing tracked `votan.it@gmail.com.pdf` — no stray generated files
   (the app writes generated PDFs inside the container's ephemeral
   filesystem only, no bind mount for `api` in `docker-compose.prod.yml`).
   `git status --porcelain` shows exactly `Dockerfile`,
   `docker-compose.prod.yml`, `src/server.ts` (modified) plus the
   implementer's own untracked evidence-note file — matches the note's claim
   exactly, unchanged by my pass.
9. **Scope judgment — reverting the 2 Docker files**: correctly in-scope for
   this node, not scope creep. `docker-compose.prod.yml`'s hardcoded
   `3008:3008` and the `Dockerfile`'s hardcoded `HEALTHCHECK` port existed
   *specifically* as a workaround for the exact bug this node fixes (per
   `add-docker-support` round 2's own evidence and the trap entry in
   `doctrine/domains/PROJECT.md`) — leaving them hardcoded after the root
   cause is fixed would immediately be stale, misleading documentation of a
   bug that no longer exists, and their accompanying comments explicitly
   narrate the bug/workaround relationship. This is the same commit-worthy
   unit of work as the `src/server.ts` fix, not an unrelated refactor
   riding along. Concur with the note's own reasoning.
10. **"Noticed, not done" disclosure prominence**: the Render-production
    `LOCAL_PORT` unknown-state caveat sits in its own clearly labeled `##
    Noticed, not done` section (the standard section per
    `evidence/README.md`'s implementer-note format), immediately before `##
    Seal gate` — not buried in a comment or footnote. It states plainly that
    Render's actual `LOCAL_PORT` value is unverified from this session and
    that this fix could change the real production port for the first time
    if Render currently has it set to something other than 3008. This is an
    honest disclosure of an out-of-reach fact (no Render dashboard access),
    not a defect — Case 1 above independently confirms the *unset* case is
    unaffected, which is the only case verifiable from this session.

## Forbidden states scanned
1. **`ADHOC_WORK`** — not present. Node exists on the diagram
   (`dev-loop.prime-mermaid.md` line 82, PENDING prior to this verdict, added
   during `add-docker-support` round 2), work happened inside the
   implementer role with a real evidence note.
2. **`NO_EVIDENCE`** — not present. Implementer note exists with real cited
   commands/output; this verdict's own claims are all independently
   re-derived above (tsc/build/test re-run, both live Docker cases, the full
   functional round trip), not inferred.
3. **`EDIT_UNVERIFIED`** — not present. Every claim that matters was
   independently reproduced: `src/server.ts`/`docker-compose.prod.yml`/
   `Dockerfile` read directly (not trusted from the note's diff excerpt),
   `npx tsc --noEmit`/`npm run build`/`npm test` re-run to identical results,
   both live-Docker cases reproduced from a clean `docker ps -a` state with a
   distinct port value (6060, not the note's 5555) for Case 2, and a fresh
   functional round trip done myself against a throwaway account.
4. **`CODE_IN_HAVEN`** — not present. This verdict note and the implementer's
   note are the only `agent-hub/` writes involved; both markdown, no runnable
   code under `haven/`. Confirmed no `.ts`/`.js`/`.sh` files under `haven/`
   newer than baseline doctrine files.
5. **`DIAGRAM_DRIFT`** — not present after this verdict. Before: node
   PENDING while the fix (independently confirmed working) sat unsealed —
   moving it to SEALED now matches the real, independently-verified code
   state. The sibling node `fix-hardcoded-src-public-write-paths` correctly
   remains PENDING (untouched by this fix, not this node's concern) — not
   touched by this SEAL, consistent with `AppendOnly`/`RatchetOnly`.

## Re-run
`full` — independently re-ran `npx tsc --noEmit`, `npm run build`, and `npm
test` from repo root (all matched the note exactly: clean tsc, clean build,
13/13 suites, 77/77 tests), and independently brought up, exercised, and tore
down the **production** Docker Compose stack for real from a clean `docker ps
-a` state, reproducing both of the note's cases end-to-end — including using
a genuinely distinct `LOCAL_PORT` value (6060) for Case 2 rather than
reusing the note's 5555, an additional negative check that port 3008 is
*not* reachable in Case 2, and a full register/login/download-pdf/self-delete
round trip on Case 2. Justified because: (1) this node touches `src/server.ts`
with zero Jest/automated coverage backing the change; (2) its entire
acceptance case rests on manual live-container verification, exactly the
class of claim that needs independent re-confirmation rather than
citation-trust, per the orchestrator's explicit task framing and consistent
with the precedent set by `add-docker-support` round 2's verifier pass.
