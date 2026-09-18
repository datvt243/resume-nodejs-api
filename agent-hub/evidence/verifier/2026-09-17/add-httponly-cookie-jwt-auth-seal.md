# 2026-09-17 — add-httponly-cookie-jwt-auth (verdict)

- Worker: verifier
- Version: 0.1.0
- Node: `add-httponly-cookie-jwt-auth`
- Verdict: **SEAL**

## Isolation proof
This subagent was spawned via the Agent tool with the exact task
description "Verify add-httponly-cookie-jwt-auth node" for the sole
purpose of grading
`evidence/implementer/2026-09-17/add-httponly-cookie-jwt-auth-plan.md` +
`-diff.md`. No memory of the implementer session that produced the diff —
genuinely independent (NeverVerifyOwnWork moot by construction).

## Re-run
None — the note's `npm test` output is verbatim, untruncated, matches
`doctrine/MEMORY.md`'s exact command run from repo root, and covers every
acceptance criterion with a specific citation. Node is not outward-facing
(no commit/push/publish in this pass — Seal gate section says "None") and
not a release gate, so per `verify_seal.md`'s re-run scope, audit-only
applies.

## Command check
Note's command: `npm test`. Matches `doctrine/MEMORY.md` row exactly
(`npm test`, run from
`/Users/_david/Workspace/Project/ResumeAPI/backend` = this repo root).
Not invented.

## Output check
```
Test Suites: 17 passed, 17 total
Tests:       92 passed, 92 total
Snapshots:   0 total
Time:        5.365 s, estimated 9 s
Ran all test suites.
```
Complete summary block, no `...`/truncation markers. `npm run build`
reported clean separately. Test-count arithmetic in the note
(85 pre-existing + 7 new = 92, with the 4 extra assertions in existing
`it` blocks correctly NOT counted as new tests) is internally consistent
and matches the last recorded pre-existing count (`add-vanity-slug-
public-profile`'s "85/85").

## Acceptance criteria — walked one at a time
| # | Criterion | Cited evidence | Verdict |
|---|---|---|---|
| 1 | `cookie-parser` added, wired before routes | `package.json`/`package-lock.json` diff (real `npm install`) + `src/server.ts` `app.use(cookieParser())` placed before body-parser/session/CORS/router | Met |
| 2 | Login/refresh set `token`/`refreshToken` httpOnly cookies | `authLogin`/`authRefreshToken` diff calling `setAuthCookies` (literal `{ httpOnly: true, secure: true, sameSite: 'strict', path: '/' }` per issue) + `auth.controller.test.ts` assertions on both, dual with existing response-body tokens (transitional, per issue) | Met |
| 3 | CORS allows credentials from an explicit allow-list, never `'*'` | `cors.config.ts` diff (`CORS_ORIGIN` allow-list, `credentials: true`, fail-closed in prod / reflect in dev when unset) + dedicated `cors.config.test.ts` asserting `origin !== '*'` across all 4 env combinations, all green in the 92/92 run | Met |
| 4 | CSRF protection ("consider") | Explicitly deferred with reasoning in `## Noticed, not done`: issue text frames it as advisory, not a hard requirement; `sameSite: 'strict'` taken literally from the issue gives partial same-site CSRF mitigation; a `none`/cross-eTLD+1 deployment caveat is flagged for the operator, own-node suggestion given (`add-csrf-protection-auth-cookies`) | Correctly scoped out, not silently skipped |
| 5 | Logout clears the cookie | `authLogout`/`authLogoutAll` diff calling `clearAuthCookies` + `auth.controller.test.ts` assertions on both (logout-all extension reasoned, not required verbatim by the issue but consistent with "log out everywhere" intent) | Met |

4/5 criteria met with direct evidence; the 5th (CSRF) was correctly scoped
as deferred-with-reason in the plan note itself (`Deferred — see
"## Noticed, not done"`), not silently dropped — issue text itself says
"cân nhắc" (consider), not a hard requirement. No missing evidence for
any in-scope criterion.

## Forbidden-state scan
| State | Hit? | Reasoning |
|---|---|---|
| `ADHOC_WORK` | No | Node exists on `dev-loop.prime-mermaid.md` (row already present as `IN_PROGRESS` before this verdict, created diagram-first per the note's own header: "no existing node matched this task") |
| `NO_EVIDENCE` | No | Both a plan note and a diff note were written under `evidence/implementer/2026-09-17/` |
| `EDIT_UNVERIFIED` | No | Real `npm test` run, output read back verbatim, matches doctrine's exact command |
| `CODE_IN_HAVEN` | No | All touched files are under `src/`, `package.json`, `.env.example`, or `src/__tests__/` — nothing under `haven/` |
| `DIAGRAM_DRIFT` | No | PM status row exists and accurately reflected `IN_PROGRESS` pending this verdict; now moved forward to `SEALED` (ratchet-forward, per LAI-13) |

## Seal gate
Not applicable to this pass — no commit/push/publish/delete/external API
call occurred (confirmed in the diff note's own "Seal gate: None"
section). Nothing to show/approve.

## Proportion (SmallestDiff)
Diff stays scoped to the issue's own bullets: dependency add, cookie
util, controller wiring, CORS config + env var, tests. The one
above-the-letter addition (`authLogoutAll` also clearing the caller's own
cookie) is reasoned inline, not scope creep. No unrelated refactors.

## Missing
(none)

## PM status
Updated `add-httponly-cookie-jwt-auth` row on
`haven/diagrams/dev-loop.prime-mermaid.md` from `IN_PROGRESS` to
`SEALED`, in place (row position unchanged, per AppendOnly).
