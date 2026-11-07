# 2026-11-08 - candidate-email-self-only (verdict)
- Worker: verifier · Version: 0.1.0
- Node: `candidate-email-self-only` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #394)
- Notes audited: `evidence/implementer/2026-11-08/candidate-email-self-only-plan.md`, `evidence/implementer/2026-11-08/candidate-email-self-only-diff.md`
- Verdict: REOPEN
- New PM status: IN_PROGRESS (unchanged; REOPEN is a verdict, not a state)

## Isolation proof
Fresh Agent-tool subagent spawned with the task "You are the agent-hub **verifier** worker ... Node: `candidate-email-self-only` ... issue #394", which says "you did NOT write this diff and have no history of the implementer's pass". That is not the implementer's task string (`/todo #394`). No memory of the implement pass. Read the two notes, the node row, the cited feature doc, `doctrine/MEMORY.md`, `standards/code-comments.md`. The caller asked me to review the real diff, so I also ran `git diff --stat` and `git diff src/candidate/candidate.controller.ts` to quote the one comment line below exactly.

## Reasoning
| Criterion | Cited evidence | Result |
|---|---|---|
| (1) other candidate's email → 404, own → 200; matches Behavior #2 (updated) | Diff row: `404 unless String(doc._id) === req.user?._id`, same `candidate.userNotFound`. Tests "answers 404 for another candidate's email" / "answers 200 for the caller's own email" inside `Tests: 14 passed, 14 total` | met |
| (2) controller test file passes | `Tests:       14 passed, 14 total` | met |
| (3a) `npm test` no new failures vs staging | `Tests: 5 failed, 588 passed, 593 total`. Same 2 suites (tokenExpiry, atsPdfIntegration) and the same 5 failures as the prior seals (env: local `.env` TOKEN_EXP_IN, local Chrome). The diff touches neither | met |
| (3b) build / Typecheck (inside Build) | `npm run build` reaches `cp -R ./src/public ./dist/`, so `tsc` passed | met |
| (3c) lint ≤ 274, none in touched files | `✖ 274 problems` = baseline. Touched files 7 → 7, none on the changed line | met |
| Feature doc changed | Operator answer "Change: self only — #394" is recorded in the doc's Open questions. Behavior #2 and the Changelog row are present. This is a fix, so doc Status stays as is | met |
| comments per code-comments.md | The note's own row says "one 1-line why comment citing #394". The line is `// Self only (#394): another candidate's email answers the same 404 as an unknown one.` (`src/candidate/candidate.controller.ts:39`). `standards/code-comments.md` § Delete: "Issue/PR refs like `(#121)`, `(issue #N)` ... that lives in git log/PR, not the source." Enforcement: "citing a rule violation → REOPEN" | **violation** |
| Supersedes / Still open | `none`; grep `#394` on the active diagram finds only this row | met |
| Forbidden states | none hit: node exists, notes exist, commands match the MEMORY.md Test / Test one file / Build / Lint / Typecheck rows, no code in `haven/` | ok |
| Seal gate | no outward action yet (`/ship` runs after SEAL) | ok |
| Proportionality | controller (1 line + comment), test, Swagger summary, `.claude/rules/api.md` row, feature doc. All follow from the behavior change | ok |

## Missing / to fix
1. Drop the `(#394)` issue ref from the comment on `src/candidate/candidate.controller.ts:39`. Keep the why, for example `// Self only: another candidate's email answers the same 404 as an unknown one, so existence isn't confirmed.` Then re-run `npx jest src/__tests__/candidate/candidate.controller.test.ts` and lint on the touched files, and write a new diff note whose comments row cites the new line.

The logic, tests, build, lint and doc work are otherwise acceptable. Only the comment row blocks the SEAL.

## Re-run
none (audit-only. The count lines are verbatim and the commands match doctrine. The REOPEN reason is a documented rule violation that needs no re-run)
