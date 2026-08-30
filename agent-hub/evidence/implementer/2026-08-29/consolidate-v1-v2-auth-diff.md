# 2026-08-29 — consolidate-v1-v2-auth (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `consolidate-v1-v2-auth` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "#77" (GitHub issue #77 — consolidate the duplicate
  v1/v2 auth implementations), Option 1 confirmed by operator after a
  frontend code audit found zero real callers of `/api/v2/*`.

## Investigation (before touching code)

1. `gh issue view 77` — problem: `src/auth/` (used by `/api/v1/auth/*`,
   tested) vs `src/api/v1/auth/` (used by `/api/v2/auth/*`, register+login
   only, zero test coverage — already the site of the `fix-v2-register-
   missing-await` bug). Proposal: Option 1 (delete `src/api/v1/auth/`,
   point `/api/v2/auth/*` at `src/auth/`) vs Option 2 (bring v2 to parity).
2. Read frontend code (`/Users/_david/Workspace/Project/ResumeAPI/frontend`,
   separate repo, added as an extra working dir this session) —
   `grep -rnE "api/v[12]|/v1/|/v2/"` across `frontend/src` found exactly
   one base path in real use: `frontend/src/config/api.config.js:2` →
   `export const subURL = 'api/v1/'`. Every service file
   (`services/auth.ts`, `services/base.ts`, `services/axios.ts`) builds
   its URL as `${subURL}...` — `login`, `register`, `candidate/:email`,
   `auth/refresh` all resolve to `/api/v1/...`. Zero occurrences of
   `v2` anywhere in `frontend/src`. This confirms nobody is actually
   calling `/api/v2/*` — makes Option 1 unambiguously the safe pick
   (issue's own text already leaned this way: "v2 currently exposes
   strictly less functionality than v1 with none of its bug fixes or
   tests").
3. Operator confirmed: proceed with Option 1.
4. `grep -rn "api/v1/auth\|@/api/v1" src/` — exactly one real import site
   outside the doomed directory itself: `src/routers/api/v2/auth.route.ts:10`
   (`import { authRegister, authLogin } from '@/api/v1/auth/controllers/index'`).
   No test file references `src/api/v1/auth/` (confirmed: it has zero
   test coverage, per the issue).
5. Confirmed `src/auth/auth.controller.ts` already exports functions with
   the exact same names — `authRegister` (line 21), `authLogin` (line 60)
   — a drop-in swap, no signature/shape change needed at the call site.

## Diff
| File | Why |
|---|---|
| `src/routers/api/v2/auth.route.ts` | Changed the import from `@/api/v1/auth/controllers/index` to `@/auth/auth.controller` — same two function names, zero other line changes. `/api/v2/auth/register` and `/api/v2/auth/login` now run through the same tested, i18n'd, bug-fixed implementation `/api/v1/auth/*` already uses. |
| `src/api/v1/auth/` (13 files, all deleted via `git rm -r`) | The entire duplicate implementation (`controllers/`, `services/`, `vaidations/`) — `authLogin.ts`, `authRegister.ts`, `refreshToken.ts`, `refreshTokenCreate.ts`, `index.ts` (controllers); `index.ts`, `login.ts`, `register.ts`, `validEmailExist.ts` (services); `index.ts`, `schemaAuthLogin.ts`, `schemaAuthRegister.ts` (vaidations); plus the top-level `src/api/v1/auth/index.ts`. `refreshToken.ts`/`refreshTokenCreate.ts` were already dead code (exported from `controllers/index.ts` but never routed — the v2 route only ever wired up register+login). `src/api/.gitkeep` left in place (empty dir marker, unrelated). |

`-349` lines deleted, `+1/-1` on the route file — no new code written, matching
Option 1's framing as the smallest/safest choice.

## Command
```
npm run build
```
Output: clean, `tsc && npm run copy` completed with no errors — confirms
no remaining reference to the deleted `@/api/v1/auth/*` paths anywhere in
`src/` (a broken import would have failed `tsc`).

```
npm test
```
(run from `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied
verbatim from `doctrine/MEMORY.md`)

### Output (verbatim, tail)
```
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        4.347 s
Ran all test suites.
```
Same 10 suites / 52 tests as the prior sealed baseline
(`add-open-to-work-status-seal.md`) — zero regressions. No test file
referenced the deleted directory (confirmed by grep before deleting), so
no test needed updating or removing.

## Manual live verification (`npm run dev`, real Mongo/Atlas, Redis
falls back to in-memory — matches the project's documented dev behavior)

```
POST /api/v2/auth/login {"email":"votan.it@gmail.com","password":"david243"}
→ {"success":false,"message":"Dữ liệu không hợp lệ","errors":{"password":"Password không đúng định dạng"},"data":null}
```
This is the correct, expected response — it proves the request reached
the **new** target: the Joi message "Password không đúng định dạng" comes
from `passwordRegex` validation in `src/auth/auth.validate.ts`'s login
schema (confirmed by reading that file — `password` field uses
`.regex(passwordRegex)`), not from the now-deleted
`schemaAuthLogin.ts`. A 404/`Cannot find module` would have meant the
import swap broke; a *different* validation message shape would have
meant it was still hitting old code — neither happened. Did not attempt
a full successful login/register round-trip against production data to
avoid creating more throwaway accounts (same class of cleanup burden the
`add-candidate-self-delete` node exists to address) — the actual
register/login *business logic* in `src/auth/` is unchanged by this diff
and already has full test coverage (`auth.service.test.ts`,
`auth.controller.test.ts`), so re-proving it end-to-end wasn't necessary;
only the routing/wiring needed live confirmation, which the validation
response above supplies. Dev server stopped after the check
(`pkill -f "ts-node ./src/server.ts"`, confirmed port 3001 free
afterward).

## Acceptance
| Criterion | Evidence |
|---|---|
| `/api/v2/auth/register` + `/login` now run through `src/auth/`'s tested implementation, not a duplicate | `auth.route.ts` diff — import swapped to `@/auth/auth.controller`; live POST to `/login` returned a validation message traceable only to `src/auth/auth.validate.ts` |
| Duplicate implementation fully removed (Option 1) | `git diff --cached --stat` — 13 files deleted under `src/api/v1/auth/`, 349 lines removed |
| No dangling import / build break | `npm run build` clean (`tsc` would fail on any remaining `@/api/v1/auth/*` import) |
| `npm test` — all pass, zero regressions | Verbatim above — `Tests: 52 passed, 52 total`, same as pre-task baseline |
| No test coverage lost | Zero test files referenced `src/api/v1/auth/` before deletion (grepped first) |

## Noticed, not done (out of scope)
- `TODO.md` rows `6.2`/`6.3`/`10.1`/`10.2` reference the now-deleted
  `api/v1/auth/controllers/*` paths and describe v2 as "in-progress" —
  `TODO.md` is treated as a frozen dated snapshot by this hub (`doctrine/
  domains/PROJECT.md`'s Traps table cites it as "Source: TODO.md, last
  updated 2026-07-05" without live-editing it), and no prior sealed node
  in this diagram has edited `TODO.md` either — left untouched to match
  precedent. Flagging here in case the project owner wants it refreshed
  separately.
- `/api/v2/auth/*` still only exposes register+login (no logout/refresh) —
  unchanged from before this task; issue #77 Option 1 didn't ask for
  parity, only for de-duplication of what already exists.
- Didn't run a full successful register/login round-trip live (see Manual
  live verification above for why) — judged non-blocking since the
  business logic itself is unchanged and already covered by existing
  automated tests; only the wiring was new, and that's confirmed.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff shown above
(14 files: 13 deleted, 1 modified) for operator review, per seal gate.

## Status
`sealed_pending_verifier`
