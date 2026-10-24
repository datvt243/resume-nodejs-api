# 2026-10-24 - remove-unused-files (verdict: SEAL, round 3)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `remove-unused-files` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub issue #294, branch `294-chore-remove-unused`)
- New PM status: SEALED (row updated in place)
- Notes audited: `evidence/implementer/2026-10-24/remove-unused-files-{plan,diff,diff-r2,diff-r3}.md`. Prior verdicts: `evidence/verifier/2026-10-24/remove-unused-files-reopen.md` and `remove-unused-files-reopen-r2.md`

## Isolation proof
Spawned as a fresh subagent with the Agent-tool description "Re-verify remove-unused-files round 3". The dispatch prompt names this "ROUND 3 (the last allowed by `/todo`), after two verifier REOPENs". This context holds no implementation history. The earlier verifier passes were separate spawns: "Verify node remove-unused-files" and "Re-verify remove-unused-files round 2". `NeverVerifyOwnWork` holds.

## Reasoning
Commands (step 4): round 1 ran `npm test`, `npm run build` and `npm run lint`, which match `doctrine/MEMORY.md`. Rounds 2 and 3 changed no `src/`, so those results still apply. Round 3 adds only read-only `git grep … staging` commands. The output is verbatim and includes exit codes. Nothing is truncated (step 5).

REOPEN r2 missing items:

| Item | Round-3 evidence | Judgment |
|---|---|---|
| 1. Asset grep was a placeholder | The real command is `git grep -nE "styles\.css\|script_module\|js/index\.js\|code_flow\|BarlowMedium\|constant/constant" staging -- . ":!src/views" ":!TODO.md" ":!agent-hub"` and returns exit 1. A control grep inside `src/views` returns exit 0 and hits `styles.css` / `js/index.js` only in the deleted `.pug` files. The pattern therefore works, and the only references were in deleted files. | Covered |
| 2. `reach.js` walk could not be re-run | Replaced by `git grep -nE "constant/constant\|from ['\"]\./constant['\"]\|from ['\"]@/constant['\"]" staging -- src`, which returns exit 1. A control grep for `constant/atsKeywords` returns exit 0 (`keywordMatcher.ts:12`), so the pattern would have matched an importer. `res\.render\|renderFile\|compileFile` in `src` returns exit 1, so `src/views/**` is unreachable. | Covered |
| Non-blocking: node-row pointer | The row now lists `{plan,diff,diff-r2,diff-r3}` | Done |

All criteria:

| Criterion | Evidence | Judgment |
|---|---|---|
| (1) deleted `src/` files unreachable and unreferenced | Round-3 greps above. Round 1: 49/49 suites, `Tests: 454 passed, 454 total`, and the build exits 0 after `rm -rf dist`. `dist/public/` still contains `pdf/` and `uploads/`, so the export output dir survives deleting the committed PDF. `src/api/.gitkeep` is an empty placeholder. | Covered |
| (2) deps gone; npm generated the lock | Round 2: `npm install --package-lock-only` leaves sha1 `7f7cdde0…` unchanged, `npm ls` returns empty, and the import grep returns 0 | Covered (r2) |
| (3) `copy` and `server.ts` no longer reference `views` | Round 1 build log shows `> cp -R ./src/public ./dist/` with no `views/` in `dist`. Round 2: the `views\|pug` grep returns exit 1. | Covered |
| (4) docs updated; #290–#293 exist | Round 2: `gh issue view` shows #290–#294 OPEN with URLs. Docs are listed in the round-1 diff table. | Covered (r2) |
| (5) `.idea/` untracked and still ignored | `git status` shows 9 staged `D .idea/...` entries; `.gitignore:38` | Covered |
| (6) test and build green; lint at or below baseline | 454/454, build exits 0, lint 275 = 275 | Covered |
| (7) PROJECT.md Traps edits cite code | Round 2: `createPDF.ts:54,100` and `createPDF.ats.ts:408` take the Chrome path from env; `cors.config.ts:23` uses an allow-list; `server.ts:46-47` sets no limit, so #291 stays open | Covered (r2) |
| Comments per code-comments.md | No code comments added. One Dockerfile comment was corrected to match reality. | Covered |

Forbidden states (step 7):
- `ADHOC_WORK`: the work was retro-formalized, as round 1 recorded. The node exists, and the raised evidence bar is now met with re-runnable commands.
- `EDIT_UNVERIFIED`: cleared. Criterion (1) now has verbatim evidence.
- `NO_EVIDENCE`, `CODE_IN_HAVEN`, `DIAGRAM_DRIFT`: not hit.

Seal gate (step 8): round 1 recorded approval for the outward-facing actions (issues #290–#294, remote branch). Rounds 2 and 3 took no new outward action.

Proportion (step 9): round 3 touched only the node row's pointer. The PROJECT.md edits are in scope through (7).

## Re-run
none. This is the audit-only default. No exception case applies: this is not a release gate and not a class PROJECT.md designates. The round-3 greps are verbatim, have exit-coded controls and can be re-run from repo root, so I did not run them again.
