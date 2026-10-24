# 2026-10-24 - remove-unused-files (verdict: REOPEN, round 2)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `remove-unused-files` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub issue #294, branch `294-chore-remove-unused`)
- New PM status: PENDING (unchanged — REOPEN never moves the ratchet)
- Notes audited: `evidence/implementer/2026-10-24/remove-unused-files-{plan,diff,diff-r2}.md`; prior verdict `evidence/verifier/2026-10-24/remove-unused-files-reopen.md`

## Isolation proof
Spawned as a fresh subagent with Agent-tool description "Re-verify remove-unused-files round 2" and a dispatch prompt naming this "ROUND 2, after a previous verifier REOPEN". No implementation history in this context; the round-1 verifier was a different spawn ("Verify node remove-unused-files"). `NeverVerifyOwnWork` holds.

## Reasoning
Commands (step 4): round-1 `npm test` / `npm run build` / `npm run lint` match `doctrine/MEMORY.md`. Round 2 changed no `src/`, so they still apply. Outputs are not truncated (step 5).

Prior REOPEN items, one at a time:

| Prior missing item | Round-2 evidence | Judgment |
|---|---|---|
| 1. Criterion (1): verbatim command + output of the reachability walk and the asset greps | `res.render\|renderFile\|compileFile` grep is verbatim, exit 1. `views\|pug` grep on the current tree is verbatim, exit 1. The walk shows as `node reach.js` → `src/constant/constant.ts`, but `reach.js` is in neither the note nor the repo (`ls reach.js` → not found). Its entry points and resolution rules (`@/` alias, dynamic `require`, test imports) cannot be checked or re-run. The asset-name grep, which is the check that matters for non-TS files that tests and build cannot catch, is cited as `$ git show staging:<file> refs — grep on STAGING tree for asset names outside src/views: (exit 1)`. That is a placeholder, not a command. The names searched and the excluded paths appear only in the prose "Reading" afterwards. | Still missing: same gap as round 1, now as placeholder output |
| 2. Criterion (2): lock is npm-generated, deps absent | `npm install --package-lock-only` leaves sha1 `7f7cdde0…` unchanged (verbatim). `npm ls …` → `(empty)`. Import grep → `0`. This is the evidence form the prior REOPEN accepted. | Covered |
| 3. Criterion (4): issues #290–#293 | `gh issue view` output with titles, OPEN state and URLs for #290–#294 | Covered |
| 4. PROJECT.md Traps edits | Option taken: criterion (7) added to the node row. The prior REOPEN offered this option explicitly. The row marks it `[added round 2, after verifier REOPEN #1]`, and the PM status was left PENDING, so this is a legitimate scope extension. Evidence: `executablePath` is env-driven in both renderers (`createPDF.ts:54,100`, `createPDF.ats.ts:408`) and spread only when set, so the "Resolved" text in PROJECT.md:45 holds. `cors.config.ts:23` is an allow-list from `CORS_ORIGIN` with no `'*'`, so PROJECT.md:46 holds. `server.ts:46-47` has no `limit`, so that trap stays open under #291. | Covered |

Other criteria (3), (5), (6) and the comments row were covered in round 1 and are unchanged: no `src/` delta in round 2, and `.idea` is re-confirmed staged as deleted.

Forbidden states (step 7): `ADHOC_WORK` stands as in round 1. The work was retro-formalized, which raises the evidence bar, and that is why a non-reproducible walk and a placeholder grep count as gaps. `NO_EVIDENCE`, `CODE_IN_HAVEN` and `DIAGRAM_DRIFT` were not hit. `EDIT_UNVERIFIED` is hit for criterion (1) only.

Seal gate (step 8): no new outward-facing action in round 2 (read-only `gh issue view`). OK.
Proportion (step 9): round 2 touched only the node row. The PROJECT.md edits are now in scope through (7). OK.

## Missing
1. Criterion (1), asset grep: replace the placeholder with the actual command line(s) run against the `staging` tree and their verbatim output. For example: `git grep -nE "styles\.css|script_module|js/index\.js|code_flow|BarlowMedium|constant/constant" staging -- . ':!src/views' ':!TODO.md' ':!agent-hub'` → exit 1.
2. Criterion (1), reachability walk: give the `reach.js` source inline in the note, or the exact one-liner used, so the walk can be re-run. Otherwise replace it with a re-runnable command whose output shows `src/constant/constant.ts` has no importer, e.g. `git grep -nE "constant/constant" staging -- src` → exit 1.

Non-blocking: the node row's `Implementer:` pointer lists `{plan,diff}` only. Add `diff-r2` when next touching the row.

## Re-run
none — audit-only default. No exception case applies: not a release gate, not a PROJECT.md-designated class. Per "Re-run scope", a missing or placeholder citation goes back as a REOPEN; the verifier does not fill it in.
