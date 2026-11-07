> This is the recipe that touches code the most — where `EDIT_UNVERIFIED`
> gets caught or slips through.

# Contract
- Input: the output of `pick_next`.
- Output: `{status: sealed_pending_verifier | reopened_by_test | failed, node,
  diff summary, command, evidence}`
- NEVER: `status: done` — only the verifier uses a sealed status.

## Steps
1. Re-read the node + acceptance criteria.
2. Read every related file before writing — match the existing
   naming/style/idiom.
3. Smallest diff — only change what the acceptance criteria require.
   Any comment added/changed follows `doctrine/standards/code-comments.md`
   (incl. its enabled opt-ins).
4. SEAL GATE before any outward-facing action — stop, show the diff,
   wait for approval.
5. Run the EXACT test command from `doctrine/MEMORY.md` — copied
   verbatim. Plus its `Typecheck` row: a standalone
   command → run it too; `inside Build` → the build run must be in the
   note; `n/a — no TypeScript` → skip.
6. READ THE OUTPUT BACK verbatim — a claim that can't be cited =
   `EDIT_UNVERIFIED`.
6b. LOOP GUARD — same command, same first error line, 3 times in this
   pass → stop: `failed`, cite the 3 outputs in the note under
   `## Loop guard`, log per step 11. Never a 4th attempt — a stuck pass
   burns tokens without new information; the operator re-plans.
7. Only report `sealed_pending_verifier` once ALL criteria pass with
   evidence.
7b. `grep` the active diagram for other
   not-yet-SEALED rows citing the same issue (`#<n>`) or task. Each one
   goes in the note under `## Supersedes` (this node finishes its work →
   `verify_seal` retires it) or `## Still open` (with a 1-line reason,
   e.g. a later phase). None found → `## Supersedes: none`.
8–9. If a new bug/trap is found, consider recording it in
   `doctrine/domains/` or `MEMORY.md`. A `doctrine/MEMORY.md` command
   failed and a variant passed (e.g. `pytest` missing, `python -m pytest`
   works) → add `## Doctrine proposal: <row>: <old> → <new>` to the note,
   both outputs cited. Don't edit that row yourself — the verifier
   confirms and applies it on SEAL (`verify_seal` step 11f).
10. Write to `evidence/` per the format in `evidence/README.md`.
10b. Pre-handoff check, before reporting `sealed_pending_verifier`: walk
   `verify_seal.md` steps 4-6b against the note you just wrote, as a
   checklist — command + `Typecheck` row match `doctrine/MEMORY.md`, no
   cut output, every criterion + the "comments per code-comments.md" row
   has cited evidence, `## Supersedes`/`## Still open`, `## Feature doc`
   — plus any definition of done the project's `CLAUDE.md` or
   `doctrine/standards/` sets for this kind of change. A gap → fix it,
   update the note, re-check. No verdict here (`NeverVerifyOwnWork`
   unchanged) — this only stops the verifier from finding the gaps one
   REOPEN round at a time.
11. ONLY when the result is `blocked` or `failed`
    (never reaches the verifier) — append 1 line to
    `evidence/worker-runs.log`:
    `<ISO timestamp> role=implementer outcome=blocked|failed node=<slug>
    hub_bytes_before=<N from pick_next's measure step> verifier_rerun=n/a`. When
    the result is `sealed_pending_verifier`, do NOT log here — the
    verifier will log both sides (before/after) in
    `recipes/verify_seal.md` once it has a real verdict. This logging
    runs identically whether called via `/todo` or by typing
    `/worker implementer` by hand — independent of how it's invoked.

## Hard rules honored
`SmallestDiff` | `TestsBeforeDone` | `EvidencePerAction` | `NoSilentFailure` |
`NodeBeforeCode`

## Failure branches
| Failure | Handling |
|---|---|
| Missing test command in `doctrine/MEMORY.md` | `blocked`, suggest filling in `<<FILL>>`, log per step 11 |
| Project has `tsconfig.json` but `Typecheck` is `<<FILL>>` | `blocked` — except the node whose task IS adding that command |
| Lint/typecheck reports errors the diff didn't introduce | Don't fix them in this diff (`SmallestDiff`) — prove they pre-exist (same count on the base branch, or ≤ the row's `baseline:` in `doctrine/MEMORY.md`, none in touched files), list under `## Noticed, not done`; no baseline recorded yet → propose one to the operator, don't write it into `MEMORY.md` yourself |
| A failure from missing setup (env, deps) | Report the REAL error, don't work around it, log per step 11 |
| Same failure 3 times in one pass (step 6b) | `failed`, `## Loop guard` in the note, log per step 11 — `/todo` stops, no REOPEN retry |

## Runtime
`/worker implementer "<task>"`.

## Project extensions
- Idiom: controller/service/validate split per section, like
  `src/candidate_profile/*`.
- `npm test` alone doesn't type-check `src/` — the `Typecheck` row is
  `npm run build` (`tsc` inside).
- Setup error (env, deps, Mongo/Redis not running) → report the real
  error, don't route around it.
