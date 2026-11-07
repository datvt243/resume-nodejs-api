# 2026-11-08 - candidate-email-self-only (diff, round 2)
- Worker: implementer · Version: 0.1.0
- Node: `candidate-email-self-only` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #394` — REOPEN round 1 (`evidence/verifier/2026-11-08/candidate-email-self-only-reopen.md`): new comment at `src/candidate/candidate.controller.ts:39` carried an issue ref `(#394)`, which `doctrine/standards/code-comments.md` keeps out of source.
- Round 1 note (everything else unchanged): `evidence/implementer/2026-11-08/candidate-email-self-only-diff.md`

## Hub bytes before
97638

## Feature doc
`doctrine/features/candidate-account.md` — unchanged since round 1 (Behavior #2 + Changelog row, operator answer "Change: self only — #394").

## Diff (round 2 delta)
| file | why |
|---|---|
| `src/candidate/candidate.controller.ts:39` | comment `// Self only (#394): another candidate's email answers the same 404 as an unknown one.` → `// Self only: another candidate's email answers the same 404 as an unknown one, so existence isn't confirmed.` — issue ref removed, the why kept |

## Command
- `npx jest src/__tests__/candidate/candidate.controller.test.ts`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npx eslint src/candidate/candidate.controller.ts src/__tests__/candidate/candidate.controller.test.ts src/routers/api/v1/candidate.route.ts`
- `grep -n '#[0-9]' src/candidate/candidate.controller.ts`

## Output
```
Tests:       14 passed, 14 total
0                                      (npm run build | grep -c "error TS")
✖ 7 problems (7 errors, 0 warnings)    (touched files — same 7 as round 1, none on line 39)
                                       (grep '#[0-9]' controller → no output)
39:  // Self only: another candidate's email answers the same 404 as an unknown one, so existence isn't confirmed.
```
Comment-only change: `npm test` result from round 1 (`Tests: 5 failed, 588 passed, 593 total`, 5 pre-existing env failures) still applies; behavior unchanged, controller test file re-run above.

## Acceptance
| Criterion | Evidence |
|---|---|
| REOPEN reason fixed: no issue ref in the new comment | `grep -n '#[0-9]'` on the controller → no output; line 39 quoted above |
| (1)/(2) self-only behavior + controller tests | `Tests:       14 passed, 14 total` |
| (3) build clean | `0` `error TS` lines |
| (3) lint none new in touched files | `✖ 7 problems` (= round 1 baseline for those files) |
| comments per code-comments.md | 1-line why comment, no issue ref, no restating the code |

## Supersedes: none
## Still open: none
## Noticed, not done
- (from round 1) `tokenExpiry.test.ts` depends on the local `.env`.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge`.
