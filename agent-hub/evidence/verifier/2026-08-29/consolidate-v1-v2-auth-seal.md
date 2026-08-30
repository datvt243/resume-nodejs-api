# 2026-08-29 — consolidate-v1-v2-auth — SEAL

- Worker: verifier (subagent, dispatched via Agent tool, fresh session)
- Node: `consolidate-v1-v2-auth` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: **SEALED** (was PENDING)
- Implementer note reviewed: `evidence/implementer/2026-08-29/consolidate-v1-v2-auth-diff.md`
- GitHub issue: #77 (`gh issue view 77`, read directly, not inferred)

Per this dispatch's explicit instruction, every claim below was
re-verified independently against the real repo state — not inferred
from the note's prose.

## Reasoning (evidence cited per criterion)

1. **Diff shape matches the claim.** `git log -1` showed HEAD is
   `6ecb143 feat(general-information): add openToWork status field` —
   this task's changes are uncommitted. `git status --short -- src/`
   (run myself) showed exactly 13 `D` (staged delete) lines under
   `src/api/v1/auth/` (`controllers/{authLogin,authRegister,index,
   refreshToken,refreshTokenCreate}.ts`, `index.ts`,
   `services/{index,login,register,validEmailExist}.ts`,
   `vaidations/{index,schemaAuthLogin,schemaAuthRegister}.ts`) plus one
   ` M src/routers/api/v2/auth.route.ts` (unstaged). `git diff --cached
   -- src/` confirmed the 13 files are full deletions (no partial
   edits). `git diff -- src/` confirmed the route file's only change is:
   ```
   -import { authRegister, authLogin } from '@/api/v1/auth/controllers/index';
   +import { authRegister, authLogin } from '@/auth/auth.controller';
   ```
   Exactly the 1-line import swap claimed, nothing else touched in that
   file.

2. **`src/auth/auth.controller.ts` is a genuine drop-in replacement.**
   Read the file directly. It exports `authRegister` (line 21) and
   `authLogin` (line 60), both `(req: Request, res: Response, next:
   NextFunction) => Promise<...>` — the standard Express handler
   signature the route file wires with `router.post('/register',
   authRegister)` / `router.post('/login', authLogin)`. Names and
   signatures match exactly what the deleted `@/api/v1/auth/
   controllers/index` exported. Not a broken import.

3. **No dangling references anywhere in `src/`.**
   `grep -rn "api/v1/auth\|@/api/v1" src/` (run myself, full tree) found
   exactly two files:
   - `src/routers/api/v1/auth.route.ts` — 6 hits, all inside Swagger
     JSDoc path comments (`* /api/v1/auth/register:` etc.) describing
     the real, still-existing v1 routes at
     `src/routers/api/v1/auth.route.ts` — a different, unrelated router
     file, not the deleted `src/api/v1/auth/` implementation directory.
   - `src/http/api.http` — one line, a manual REST-client request URL
     (`GET http://localhost:3001/api/v1/auth/login?...`) — again the
     real v1 endpoint URL, not an import of the deleted code.
   No import, no `require`, no reference to the deleted directory
   survives. `find src/api -maxdepth 3` confirmed `src/api/v1/auth/` no
   longer exists; `src/api/.gitkeep` and the unrelated `src/api/v1/user`
   remain untouched, as claimed.

4. **Frontend independently confirmed to have zero `/api/v2/` callers.**
   Ran `grep -rn "api/v2\|/v2/\|subURL" src` myself in
   `/Users/_david/Workspace/Project/ResumeAPI/frontend` (separate repo,
   read-only). Found exactly one base-path constant in use:
   `src/config/api.config.js:2` → `export const subURL = 'api/v1/'`,
   consumed by `services/base.ts`, `services/auth.ts`, `services/
   axios.ts` (login, register, candidate lookup, refresh — all built as
   `${subURL}...`). Zero occurrences of `v2` anywhere in `frontend/src`.
   Independently confirms the note's claim: nothing depends on the old
   `src/api/v1/auth/` implementation via the v2 surface.

5. **`npm test` — ran myself, from repo root, exact command from
   `doctrine/MEMORY.md`.** Verbatim tail of my own run:
   ```
   Test Suites: 10 passed, 10 total
   Tests:       52 passed, 52 total
   Snapshots:   0 total
   Time:        4.453 s, estimated 5 s
   Ran all test suites.
   ```
   Same 10 suites / 52 tests as the prior sealed baseline
   (`add-open-to-work-status-seal.md`) — zero regressions, output not
   truncated.

6. **`npm run build` — ran myself.** Output:
   ```
   > nodejs-resume-api@1.1.0 build
   > tsc && npm run copy
   > nodejs-resume-api@1.1.0 copy
   > cp -R ./src/views ./src/public ./dist/
   ```
   Clean exit, no `tsc` errors. This is the strongest structural signal:
   if the route file's import still pointed at a deleted module, or if
   `src/auth/auth.controller.ts` didn't export the expected names with
   compatible types, `tsc` would have failed to compile — it didn't.

7. **Issue #77 match confirmed via `gh issue view 77` myself.** The
   issue's Proposal section lists exactly two options: "1. Delete
   `src/api/v1/auth/`... 2. Finish v2 properly... bring `src/api/v1/
   auth/` to parity...". The issue's own text leans toward Option 1
   ("option 1 is the pragmatic default unless there's a reason v2 needs
   to diverge"). The shipped diff is Option 1 exactly: full deletion of
   `src/api/v1/auth/`, `/api/v2/auth/*` repointed at `src/auth/` — not a
   half-measure (no partial parity work was added, no v2 route left
   unwired).

8. **Forbidden states — all clear.**
   - `ADHOC_WORK` — node exists on `dev-loop.prime-mermaid.md` (row 61,
     added by implementer as PENDING per convention), traced to issue
     #77. Not ad-hoc.
   - `NO_EVIDENCE` — implementer note exists at
     `evidence/implementer/2026-08-29/consolidate-v1-v2-auth-diff.md`.
   - `EDIT_UNVERIFIED` — both `npm test` and `npm run build` re-run and
     read back by me, independent of the note's claims.
   - `CODE_IN_HAVEN` — no `.ts`/`.js`/config files leaked into `haven/`;
     `git status --short` shows only the diagram row addition (prose)
     under `agent-hub/`, no code.
   - `DIAGRAM_DRIFT` — node was PENDING while the deletion is real and
     verified; this verdict brings PM status in sync (PENDING → SEALED).

9. **`SmallestDiff` proportion check.** `git diff --cached --stat --
   src/` + the one unstaged file change: 13 files deleted (~349 lines,
   matches the note's stated count) plus exactly 1 line changed in 1
   file (`src/routers/api/v2/auth.route.ts`). No unrelated refactor, no
   new code written — purely subtractive plus a single import repoint.
   Matches Option 1's framing as the smallest possible diff.

## Missing
None — every acceptance criterion has independently-reproduced evidence.

## Verdict: SEAL

`pm_updated: true` — `consolidate-v1-v2-auth` row on
`haven/diagrams/dev-loop.prime-mermaid.md` updated PENDING → SEALED.
