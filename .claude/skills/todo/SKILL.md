---
name: todo
description: "Resolve/create a GitHub issue + check out that issue's own branch, then combine /worker analyst (feature, or a bug with no feature doc yet), /worker implementer and /worker verifier into 1 typed command for a task — still runs 2 separate passes inside, looping automatically on REOPEN. Usage: /todo \"[task]\"|#[issue-number] [--ship]"
argument-hint: "<task>|#<issue-number> [--ship]"
disable-model-invocation: true
---

# /todo "<task>"|#<issue-number> [--ship]

> Orchestrates the `worker` skill exactly twice, in 2 separate passes. Do
> NOT re-implement the implement/verify logic yourself — only call
> `/worker` in exactly the order below.

## Step 0 — resolve issue + check out branch (runs BEFORE any worker)
1. **Resolve issue**:
   - Argument matches `^#?\d+$` (issue mode) → `gh issue view <n> --json
     number,title,url`. Not found / `gh` not logged in → stop, report the
     real error, don't guess further.
   - Otherwise (free text) → `gh issue create --title "<first line of the
     task>" --body "<the whole task>"` to open a new issue, taking the real
     `<n>`/`<title>`/`<url>` from the command output. Error (no `gh`, not
     authed, no remote) → stop, report the error, do NOT continue without
     an issue.
   - From here on, `<task>` for the rest of this `/todo` run is the title
     + body of the resolved issue, not just the original CLI string.
2. **Compute the branch name**: [sync 2026-10-07] check `doctrine/domains/PROJECT.md`
   first for a documented branch-naming convention — use it exactly if
   present. Otherwise `<n>-<slug>`, `<slug>` = first 3 words of the issue
   title, lowercased, runs of non-alphanumeric characters collapsed to `-`.
3. **Base branch**: `staging` (per `doctrine/domains/PROJECT.md` — the
   2-tier `staging` → `main` model, every working branch is cut from
   `staging`).
4. **Sync the real base branch**: `git fetch origin`, `git checkout staging`,
   `git pull origin staging` — always before branching, never branch from
   a stale local copy. Pull error/conflict → stop, report the real error,
   never force/stash/discard on your own.
5. **Check out the issue's branch**: `gh issue develop <n> --list` first —
   if a linked branch already exists (resuming work) → check out that
   branch and `git pull` on it, never create a 2nd branch for the same
   issue. None yet
   → `gh issue develop <n> --checkout --base staging --name <branch name from step 2>`.
   Git error (dirty tree, base ref missing...) → stop, report the real
   error, never force/stash/discard on your own.
6. **Report** the issue (`#<n>`, URL) + branch name before moving to pass 1
   — this is a report, NOT a 2nd approval gate (the only real gate in
   the whole `/todo` chain is still `/ship`'s push).

## Procedure
0. **Pass 0 — analyst** (kit 2026-11-06): run `/worker analyst "<task>"`
   (separate subagent) BEFORE pass 1 when:
   - the issue is a feature (label `enhancement`/`feature`, else title
     starts with add/implement/support; unclear → ask) — spec mode; skip when resuming and the issue's doc in
     `agent-hub/doctrine/features/` already exists with no unanswered open
     question;
   - the issue is a bug (label `bug`, else title starts with fix/bug) and
     `agent-hub/doctrine/features/INDEX.md` has no row for the area/issue —
     backfill mode (`"document the feature touched by: <task>"`);
   - anything else → skip.
   `spec_ready`/`no_feature` → continue. `needs_input` → show its
   questions to the operator verbatim, wait, re-run pass 0 with the
   answers — never answer them yourself, never start pass 1 with a
   question open. `blocked` → stop, report.
1. **Pass 1 — implementer**: run the equivalent of `/worker implementer "<task>"`,
   in the main session. Stops at `status: sealed_pending_verifier` (or
   `blocked` / `reopened_by_test` if a local test fails — see
   `recipes/implement.md`).
2. **Pass 2 — verifier**: do NOT play the verifier in the main session.
   Right after the implementer finishes its evidence note, automatically
   use the **Agent tool** to dispatch an independent subagent running
   `verify_seal` (the verifier's full `manifest.yaml`/`SOUL.md`/`recipes/verify_seal.md`
   bundle in the prompt, plus the path of the evidence note just written
   + the related node). `run_in_background: false` — wait for the verdict
   before continuing. This is a genuinely separate reasoning pass (the
   subagent never sees pass 1's conversation), not roleplay in the same
   context — `NeverVerifyOwnWork` is guaranteed by mechanism, not by
   promise. The subagent writes its own verdict into
   `evidence/verifier/`. (kit 2026-11-07) Keep the verifier's agent id
   from the Agent tool result — step 3 reuses it.
3. **Verdict = REOPEN** → automatically go back to pass 1 with the exact
   REOPEN reason quoted from the verifier subagent's evidence note. Loop at
   most **3 times**. Limit hit → stop, let the operator decide, never loop
   further on your own.
   (kit 2026-11-07) Pass 2 of a REOPEN round: resume the SAME verifier with
   `SendMessage` to its agent id — "round <N>: re-read `<note path>` from
   disk, re-run `verify_seal` steps 2-12, write a new verdict note + log
   line" — instead of a fresh spawn. It never saw the implementer's
   reasoning, so isolation holds; it skips the bundle reload. Resume fails
   (no id, agent gone, error) → fresh spawn as in step 2 — never verify
   inline. Implementer `failed` with `## Loop guard` → stop, no REOPEN retry.
4. **Verdict = SEAL** → (kit 2026-11-09) print exactly this report,
   nothing else (no diff, no recap of the work — the evidence note has it):
   ```
   ✅ SEALED <slug> — <task>
   issue #<n> <url> · branch <branch>
   evidence: <note path>[, <note path>…]
   spawns: verifier <N> (<F> fresh, <R> resumed), REOPEN <k>
   next: /ship "<task>"
   ```
   `spawns:` is read back from
   `grep "role=verifier.*node=<slug> " evidence/worker-runs.log`, never
   counted from memory. A REOPEN round logged `fresh` means step 3's
   resume fell back — append ` (fresh: <why>)` to that line. With
   `--ship`, `next:` becomes `next: running /ship "<task>"`.
   Every non-SEAL stop (Step 0 failure, `blocked`, `failed`, retry limit)
   uses the same shape:
   ```
   ⛔ STOPPED <slug|-> — <task> (<blocked|failed|retry-limit|issue/branch>)
   issue #<n> <url> · branch <branch>   (omit if Step 0 failed)
   reason: <blocker | latest REOPEN reason | real error, verbatim>
   spawns: verifier <N> (<F> fresh, <R> resumed), REOPEN <k>   (omit if no verifier ran)
   next: <the one decision the user must make>
   ```
   - **No `--ship`** (default): stop here. Do NOT `commit`/`push` on your
     own — the seal gate in `CLAUDE.md` still applies to every
     outward-facing action on `src/`, even when called through `/todo`.
   - **With `--ship`**: immediately call `/ship "<task>"` exactly as that
     skill defines it — do NOT re-implement `/ship`'s logic here. `/ship`
     still runs its ENTIRE own contract (guard blocking main/staging, shows
     the real git commands then runs them at once — `AutoCommitNoGate`,
     passing `--ship` is the approval — its own evidence note) — `--ship`
     only skips typing `/ship` as a 2nd command. For `--merge` (open a PR
     into staging) type `/ship --merge` separately afterwards, or
     `/todo "<task>" --ship` then add `--merge` yourself — the `--ship`
     flag here never implies `--merge`.

## agent-hub visibility in the session
`agent-hub/` (both passes' evidence notes, PM status, MEMORY.md) is
documentation for the AI to read — applies to EVERY change, whether
editing an existing file or creating a new one (including the 2nd/3rd
note when REOPEN loops several rounds). Do NOT paste a git diff, do NOT
paste/quote the content of a file just written, do NOT describe its
content, in any pass. After each write print exactly 1 line
`agent-hub content updated`. Only report the final result: verdict
(SEAL/REOPEN/blocked) + a short reason if REOPEN. The `src/` diff is still
shown in full when the implementer touches real code.

## Hard constraints
- This is NOT a single self-written, self-graded pass — always implementer
  (main session) → verifier (independent subagent), in the spirit of
  calling `/worker` twice but with the verifier pass running as a real
  subagent instead of roleplay.
- Each pass must leave its own evidence note
  (`evidence/implementer/...`, `evidence/verifier/...`) — never merge
  notes, even when the verifier runs as a subagent.
- If `doctrine/MEMORY.md` still has a `<<FILL>>` that makes the implementer
  `blocked` from pass 1, stop and report the blocker — don't try to "guess
  past it" to keep the loop going, and don't dispatch a verifier subagent
  when there is nothing to grade.
- `--ship` NEVER runs when the loop stops at `blocked`/a test failure/the
  3-REOPEN limit — no SEAL means nothing to ship.

## Example
```
/todo "fix CORS origin '*' per the trap in doctrine/domains/PROJECT.md"
# Pass 1 (implementer, main session): pick_next → implement → evidence → sealed_pending_verifier
# Pass 2 (verifier, independent subagent via the Agent tool): read evidence → SEAL (or REOPEN with a specific reason)
# REOPEN → loop pass 1 with that reason, at most 3 times → if still REOPEN, stop
# SEAL → stop, report the result, never commit on your own
```
