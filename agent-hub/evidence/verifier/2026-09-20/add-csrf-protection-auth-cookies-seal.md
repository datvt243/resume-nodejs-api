# 2026-09-20 — add-csrf-protection-auth-cookies — SEAL

- Worker: verifier
- Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `add-csrf-protection-auth-cookies`
- Evidence audited: `evidence/implementer/2026-09-20/add-csrf-protection-auth-cookies-plan.md`,
  `evidence/implementer/2026-09-20/add-csrf-protection-auth-cookies-diff.md`

## Isolation proof
This verdict was produced by a fresh Agent-tool subagent spawn, dispatched
with a task string that explicitly assigns it the `verifier` worker role
and instructs it to read only the implementer's two evidence notes above
(never the diff/source directly, per invariant #2). This session has no
memory of whatever session wrote the plan/diff and did not write them.
NeverVerifyOwnWork is satisfied by construction.

## Re-run
partial — self-selected (not required by the audit-only default: the
note's command matched `doctrine/MEMORY.md` verbatim, output was
untruncated, every acceptance criterion was cited). Chose to re-run
anyway because this touches auth-cookie/CSRF security surface directly
(the recipe explicitly leaves this to verifier judgment for exactly this
class of change). Independently ran, from
`/Users/_david/Workspace/Project/resume/resume-nodejs-api` on the
untouched working tree (branch `134-csrf-protection-for`, confirmed via
`git status --short` matching the diff note's file list exactly before
running anything):
- `npm test` → `Test Suites: 21 passed, 21 total` / `Tests: 121 passed,
  121 total` — byte-for-byte match to the note's claimed numbers.
- `npx jest csrf --verbose` → both new suites individually: `utils/csrf.
  test.ts` 10/10, `middlewares/csrf.test.ts` 6/6 (16 total), matching the
  note's 10+6 breakdown.
- `npx jest verifyToken.test --verbose` → the `CSRF (issue #134)` block's
  4 named cases all present and passing, suite total 13/13.
- `npx jest authCookies.test --verbose` → 5/5, including the new
  `'issues a non-httpOnly CSRF cookie...'`/clear-CSRF-cookie assertions.
- `npm run build` → `tsc && npm run copy` completed with no errors.

## Command check
Note used `npm test` / `npm run build`, run from
`/Users/_david/Workspace/Project/resume/resume-nodejs-api` — matches
`doctrine/MEMORY.md`'s table exactly, not invented. Confirmed identical
when re-run myself.

## Acceptance criteria walk
| Criterion (from diagram row / issue #134) | Verdict |
|---|---|
| `sameSite: 'strict'` → `'none'` (the actual cross-site cookie fix) | Cited — `authCookies.test.ts` `'sets both token and refreshToken cookies with httpOnly options'`; re-run PASS |
| Cross-site forged request relying purely on the auto-attached cookie is rejected on every route behind `verifyToken` | Cited — `verifyToken.test.ts` CSRF block, "no CSRF header" case; re-run PASS |
| Legitimate cookie + matching CSRF header still succeeds, `req.user` attached | Cited — same block, "CSRF header matches" case; re-run PASS |
| Existing Authorization-header flow (today's real frontend) unaffected | Cited — "does not require CSRF when token came from Authorization header"; re-run PASS, plus all pre-existing `verifyToken.test.ts` cases still pass unmodified |
| Safe methods (GET) never blocked even if cookie-sourced | Cited — "does not require CSRF ... safe method (GET)"; re-run PASS |
| `/auth/refresh` and `/auth/logout` (bypass `verifyToken`) also covered | Cited — `auth.route.ts` wiring + `middlewares/csrf.test.ts` field-name/reject/accept cases; re-run PASS (6/6) |
| `/auth/login` correctly left unguarded (no session yet) | Cited — not wired on that route, matches issue's own scope note; `auth.controller.test.ts` login cases unaffected |
| No regression in auth/controller/refresh flows | Cited — `auth.controller.test.ts`, `refreshToken.test.ts` unaffected (module-mocked, router-level change doesn't touch them) |
| Typecheck/build clean | Cited — `npm run build` verbatim; re-run reproduced, no errors |
| Deferred items (CORS_ORIGIN doc, frontend `resume-vuejs-website#8`) correctly out of scope | Cited — plan's "Deferred" section, matches issue bullets 3/4 verbatim reasoning, not silently dropped |

No criterion missing evidence; all independently reproduced, not just
audited off the paste.

## Forbidden-state scan
| State | Hit? |
|---|---|
| ADHOC_WORK | No — node exists on diagram (`add-csrf-protection-auth-cookies` row, was PENDING pre-seal) |
| NO_EVIDENCE | No — plan + diff evidence notes present and complete |
| EDIT_UNVERIFIED | No — test/build claims independently reproduced this pass, not just inferred from the note |
| CODE_IN_HAVEN | No — no runnable code under `haven/`; diff is entirely under `src/`, this note is under `evidence/` |
| DIAGRAM_DRIFT | No — diagram's `add-csrf-protection-auth-cookies` row updated in place, PENDING → SEALED |

## Seal gate
Not applicable — no outward-facing action has happened (`git status`
confirms working-tree changes only, no commit/push). `/todo #134` was
invoked without `--ship`. Correctly not claimed as approved in the note.

## Proportion (SmallestDiff)
Issue #134 explicitly requires steps 1+2 together (the `sameSite: 'none'`
fix and real CSRF defense land as one change, since step 1 alone reopens
a CSRF hole `'strict'` was incidentally closing). The diff's file list
matches exactly what that requires: 1 cookie-options change, 1 new CSRF
utility, 1 minimal `helper-auth.ts` extension (backward-compatible thin
wrapper, no behavior change to existing call sites), 1 middleware
extension, 1 new standalone middleware for the 2 routes that bypass
`verifyToken`, barrel re-exports, 1 error code, + matching tests. Steps 3
(CORS_ORIGIN doc) and 4 (frontend repo) are explicitly out of scope per
the issue's own text and correctly deferred, not silently dropped or
scope-crept into. No unrelated files touched.

## Verdict
**SEAL** — `add-csrf-protection-auth-cookies`. All acceptance criteria
have first-class evidence, independently reproduced via partial re-run
(command matches doctrine, output untruncated, no forbidden state hit,
diff proportionate to the issue's own two-part requirement). PM status
updated in place on `haven/diagrams/dev-loop.prime-mermaid.md` (PENDING
→ SEALED).
