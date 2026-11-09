---
name: ship
description: "Commit + push a SEALED node via the bundled ship.sh — the outward-facing gate at the end of the loop. Usage: /ship \"[note]\" or /ship \"[note]\" --merge[=branch] to also merge into a target branch (directly, or through a GitHub PR + required CI when ship.env sets SHIP_MERGE_VIA=pr). Always shows the exact git commands and waits for approval before any commit/push/merge. Never --force/--no-verify."
argument-hint: "[note] [--merge[=<branch>]]"
---

# /ship — commit + push a SEALED node

`/ship` is NOT a third worker — it only runs after a verifier has already
SEALED a node. Every git action lives in `${CLAUDE_SKILL_DIR}/ship.sh`
(the operator can run it by hand:
`.claude/skills/ship/ship.sh <node-slug> "<msg>" [--merge[=<branch>]]`).
Never run the commit/push/merge chain yourself, never pass `--yes` before
the operator approved.

## Steps
1. Read `haven/diagrams/` to find the node matching the working-tree
   changes → `<node-slug>`. Not SEALED → stop, point to `/worker verifier`
   (`SealedOnly`; the script refuses too).
2. Stage ONLY this node's files: `git add <files>` — never `git add -A`/
   `git add .`. Include its `agent-hub/` changes; never print their
   diff/content — one line `📝 agent-hub: updated`.
3. Write a Conventional Commits message (`type(scope): summary`) from the
   real evidence note — don't invent detail. `$ARGUMENTS` note = hint.
4. **SEAL GATE**: run `bash "${CLAUDE_SKILL_DIR}/ship.sh" <node-slug> "<msg>" [--merge[=<branch>]]`
   WITHOUT `--yes`. It checks SEALED + both evidence notes (`NO_EVIDENCE`)
   + staged diff, changes nothing, prints the full command chain (auto
   `fix/<node-slug>` branch when on the main branch, commit, push,
   merge — `git merge --no-ff`, or with `SHIP_MERGE_VIA=pr` a PR + wait
   for required checks + `gh pr merge --merge`, never `--admin` —
   cleanup, return to main branch) and exits 3. Show that output
   verbatim, wait for explicit operator approval. No approval = no run.
5. After approval: rerun the exact same command + `--yes`. Print its
   output verbatim (`ReadBackBeforeClaim`) — it runs the chain, writes
   `evidence/ship/<date>/<slug>-ship.md`, and ends on the main branch.
6. Exit 1 → report the real error verbatim. Never retry with `--force`,
   `--no-verify`, amend, `-D`, stash or discard.

## Hard rules honored
`SealedOnly` | `NoForce` | `ReadBackBeforeClaim` | `MergeOnRequest`
(only with `--merge`) | `BranchBeforeCommit` | `CleanupFixBranch` (only
with `--merge` AND a branch this run created) | `ReturnToWorkingBranch` —
all enforced inside `ship.sh`.

## Runtime
`/ship "[note]"` or `/ship "[note]" --merge[=<branch>]`. Opens a PR only
for `--merge` with `SHIP_MERGE_VIA=pr`. Main working branch + merge mode:
`ship.env` next to the script.

## Project extensions
- **Guard, before step 1**: `git branch --show-current` is `main` or
  `staging` → stop, run nothing: both are GitHub-protected. Work goes on a
  feature/fix branch off `staging`; `staging → main` is `/release`, never
  `/ship`. (So `BranchBeforeCommit` never fires here.)
- **Before staging files**: `git status --short` — delete obvious
  live-test junk (`src/public/pdf/`, `src/public/uploads/`, temp logs);
  unsure whether a file is junk → ask. Unrelated changes from outside this
  session → stop and ask, never fold them in.
- **Commit message**: title `type(scope): summary`; body = changes per
  file group + `npm test`/`npm run build` results copied from the SEAL
  evidence note + the sealed node + its evidence path; last line exactly
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- `--merge` targets `staging` only (`SHIP_MERGE_VIA=pr` in `ship.env`):
  PR → wait `build (20.x)`/`build (22.x)` → `gh pr merge --merge`. Never
  `--admin`; a blocked merge leaves the PR open — report its URL. Never
  add `--merge` unless the operator typed it this turn.
- `Closes #N` in a staging PR doesn't close the issue (not the default
  branch) — `/release` closes it when the code reaches `main`.
