# 2026-10-24 - fix-render-puppeteer-cache-dir (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `fix-render-puppeteer-cache-dir` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub issue #298, branch `298-download-pdf-chrome`)
- New PM status: SEALED (row updated in place)
- Note audited: `evidence/implementer/2026-10-24/render-puppeteer-cache-dir.md`

## Isolation proof
Spawned as a fresh Agent-tool subagent from the resume-vuejs-website session, with a brief stating "You are a fresh, isolated verifier. You did NOT write the diffs under review — a separate implementer session did", asking it to verify this node and the frontend node `issue-291-download-cv` independently, in their own hubs. This context holds no implementation history. The diff was not opened (EvidenceOnly).

## Worktree vs `doctrine/MEMORY.md` repo root
The note ran everything from the worktree `/Users/_david/Workspace/Project/resume/resume-nodejs-api-298`, not the repo root named in `doctrine/MEMORY.md`. Accepted: `git worktree list` shows it is a worktree of the same repository, at `91cfaf2` (`origin/staging`, the same commit the main checkout's `staging` is at), and it holds only this branch's diff. The commands are the same ones, run against the same checkout contents. Using the main checkout would have mixed in 48 uncommitted changes from another task (`294-chore-remove-unused`), which is the hazard `doctrine/MEMORY.md`'s branch-isolation section warns about. That file's sibling-worktree gotcha (silent write failures) did not occur: `git status` in the worktree shows the expected 3 changed files + the note.

## Reasoning
Commands (step 4): `npm test`, `npm run build` (includes `tsc`, the Typecheck row), `npm run lint`, matching `doctrine/MEMORY.md`. Plus `npm ci --include=dev` (the Render build's install step) and a reproduction script. Output is verbatim, nothing truncated (step 5).

| Criterion | Evidence | Judgment |
|---|---|---|
| Root cause identified from real logs | Render app logs quoted: `Could not find Chrome (ver. 127.0.6533.88) … cache path … /opt/render/.cache/puppeteer` from `createCV` and `renderAtsPdfBuffer`, 2026-10-20 → 2026-10-24, still 500 after v2.0.2 | Covered |
| Fix makes Chrome resolvable without the home-dir cache | Same empty-HOME setup: control without `.puppeteerrc.cjs` → `FAIL Could not find Chrome (ver. 127.0.6533.88)` (same error as Render); with it → `OK pdf bytes 7775 header %PDF-`. `npm ci` put Chrome at `.cache/puppeteer/chrome/mac_arm-127.0.6533.88`, the version Render asks for | Covered |
| No regressions | `Tests: 454 passed, 454 total`, build exit 0, lint `✖ 275 problems` = 275 on bare `origin/staging` (stash baseline) | Covered |
| Comments per code-comments.md | One JSDoc on the config giving the WHY (Render ships only the project dir) | Covered |
| PDF export standard | Not triggered: no `createPDF*.ts`/`createDocx.ts` change, output rendering untouched | n/a |

Forbidden states (step 7): `ADHOC_WORK` (node exists), `NO_EVIDENCE`, `EDIT_UNVERIFIED`, `CODE_IN_HAVEN`, `DIAGRAM_DRIFT` (row now SEALED): none hit. The reproduction script lives in a scratchpad, not in `haven/`.

Seal gate (step 8): no commit, push or Render change. Render was read-only (operator-approved workspace).

Proportion (step 9): 1 new config file + 2 ignore lines. The Dockerfile env-var name, stale PROJECT.md trap row and lint baseline are listed under "Noticed, not done", not fixed.

## Scope of this SEAL
This seals the fix as proven locally. It does not prove production. The note says so itself ("Not verified: the Render deploy"). Open after release: the Render build log shows Chrome under `/opt/render/project/src/.cache/puppeteer`, `curl` of the public `download-pdf` returns 200 `application/pdf`, and the slug stays under Render's size limit with the linux Chrome. If any of those fails, that is a new node (RatchetOnly).

Bookkeeping, not blocking: the implementer note has no `## Hub bytes before` line, so the worker-runs.log entry records `hub_bytes_before=n/a`.

## Re-run
none. This is the audit-only default: not a release gate, nothing outward-facing taken, no PROJECT.md re-run class. The note's output is verbatim with a control/fixed pair.
