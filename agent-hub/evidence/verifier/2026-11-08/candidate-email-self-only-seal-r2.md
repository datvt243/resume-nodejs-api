# 2026-11-08 - candidate-email-self-only (verdict, round 2)
- Worker: verifier · Version: 0.1.0
- Node: `candidate-email-self-only` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #394)
- Notes audited: `evidence/implementer/2026-11-08/candidate-email-self-only-diff-r2.md` (re-read from disk), plus round 1 `candidate-email-self-only-plan.md` / `candidate-email-self-only-diff.md` for the unchanged parts
- Prior verdict: `evidence/verifier/2026-11-08/candidate-email-self-only-reopen.md`
- New PM status: SEALED. The row is collapsed into `haven/diagrams/dev-loop-archive.md`. Step 11c: 28 → 20 pointer rows. I pruned the 8 oldest (`add-graceful-shutdown`, `enforce-https`, `fix-create-returns-created-doc`, `fix-visit-accepts-slug`, `fix-ats-summary-html`, `fix-lastname-min-length`, `delete-all-visits`, `add-main-skills`; for the 2026-11-01 tie I went by file order). I checked that each one's full row is in the archive first.

## Isolation proof
Round 2 resume message from the coordinator: "Round 2 for node candidate-email-self-only (#394): re-read `agent-hub/evidence/implementer/2026-11-08/candidate-email-self-only-diff-r2.md` from disk ...". My context holds only my own round 1 verdict. It holds none of the implementer's reasoning. Round 1 spawn: "You are the agent-hub **verifier** worker ...". The implementer's task string was `/todo #394`.

## Reasoning
| Criterion | Cited evidence | Result |
|---|---|---|
| Round 1 REOPEN reason: issue ref in the new comment | r2 output: `39:  // Self only: another candidate's email answers the same 404 as an unknown one, so existence isn't confirmed.`; `grep '#[0-9]'` on the controller gives no output. Also checked in `git diff src/candidate/candidate.controller.ts`: the added comment has no issue ref | fixed |
| comments per code-comments.md | 1-line `//` comment that gives the why (a 404 that doesn't reveal the account exists). No issue ref, doesn't restate the code | met |
| (1) other candidate's email → 404, own → 200; Behavior #2 | Logic unchanged from round 1 (`String(doc._id) !== req.user?._id` → same `candidate.userNotFound` 404). The two tests are in `Tests:       14 passed, 14 total` (r2 re-run) | met |
| (2) controller test file passes | r2: `Tests:       14 passed, 14 total` | met |
| (3a) `npm test` no new failures vs staging | Round 1 `Tests: 5 failed, 588 passed, 593 total`, the same 5 env-dependent failures as prior seals. r2 only changes a comment, so the round 1 result still holds | met |
| (3b) build / Typecheck (inside Build) | r2: `npm run build \| grep -c "error TS"` → `0`; round 1 build reached `cp -R ./src/public ./dist/` | met |
| (3c) lint ≤ 274, none new in touched files | round 1 `✖ 274 problems` (= baseline); r2 touched files `✖ 7 problems` = the round 1 count, none on line 39 | met |
| Feature doc (Behavior #2, fix) | Unchanged since round 1. The operator answer "Change: self only — #394" is recorded in Open questions, and the Changelog row is present. This is a fix SEAL, so doc Status stays `verified` (step 11e) | met |
| Doctrine proposal | none | n/a |
| Supersedes / Still open | `none` / `none`; only this row matched `#394` on the active diagram | ok |
| Forbidden states | none hit: node exists, notes exist, commands match the MEMORY.md rows, no code in `haven/`, PM status updated here | ok |
| Seal gate | no outward action (`/ship --merge` runs after SEAL) | ok |
| Proportionality | r2 delta is the one comment line. The overall diff (controller, test, Swagger summary, `.claude/rules/api.md`, feature doc) is what the node needs | ok |

Note (pre-existing, not part of this diff): there is a run of blank lines plus a repeated "Any regression..." paragraph in the middle of the active diagram's PM table (around lines 82-100). I left it as it was.

## Re-run
none (audit-only. The count lines are verbatim, the commands match doctrine, and the change is not outward-facing or a release gate)
