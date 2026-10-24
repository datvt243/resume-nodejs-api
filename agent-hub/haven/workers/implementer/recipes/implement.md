> The recipe that touches the most code — where `EDIT_UNVERIFIED` gets
> caught or slips through.

# Contract
- Input: output of `pick_next`.
- Output: `{status: sealed_pending_verifier | reopened_by_test | failed, node,
  diff summary, command, evidence}`
- NEVER: `status: done` — only the verifier uses a sealed state.

## Steps
1. Re-read the node + acceptance criteria.
2. Read every related file before writing — match existing naming/style/
   idiom in `src/` (e.g. controller/service/validate split per section
   like `src/candidate_profile/*`).
3. Smallest diff — only change what the acceptance criteria require.
   Any comment added/changed follows `doctrine/standards/code-comments.md`
   (incl. its enabled opt-ins).
4. SEAL GATE before any outward-facing action — stop, show the diff, wait
   for approval.
5. Run the EXACT test command from `doctrine/MEMORY.md` (`npm test` from
   repo root) — copy it verbatim. [added 2026-10-07] Plus `npm run build`
   — the `Typecheck` row: `tsc` runs inside it; `npm test` alone does not
   type-check all of `src/`.
6. READ THE OUTPUT BACK verbatim — an uncited claim = `EDIT_UNVERIFIED`.
6b. [synced 2026-10-24] `grep` the active diagram for other not-yet-SEALED
   rows citing the same issue (`#<n>`)/task. Each goes in the note under
   `## Supersedes` (this node finishes its work → `verify_seal` retires it)
   or `## Still open` (1-line reason). None → `## Supersedes: none`.
7. Only report `sealed_pending_verifier` once ALL criteria pass with
   evidence.
8–9. If a new bug/trap is found (similar to the traps already recorded in
   `doctrine/domains/PROJECT.md`), consider adding it there or to
   `MEMORY.md`.
10. Write to `evidence/` following the format in `evidence/README.md`.
11. [added 2026-09-02] ONLY when the result is `blocked` or `failed`
    (never reaches the verifier) — append one line to
    `evidence/worker-runs.log` (create the file if missing):
    `role=implementer outcome=blocked|failed node=<slug>
    hub_bytes_before=<N from pick_next step 7> verifier_rerun=n/a`. When
    the result is `sealed_pending_verifier`, do NOT log here — the
    verifier logs both sides (before/after) in `verify_seal.md` once it
    has a real verdict.

## Hard rules honored
`SmallestDiff` | `TestsBeforeDone` | `EvidencePerAction` | `NoSilentFailure` |
`NodeBeforeCode`

## Failure branches
| Failure | Handling |
|---|---|
| No test command in `doctrine/MEMORY.md` | `blocked`, suggest filling in `<<FILL>>` |
| Setup error (env, deps, Mongo/Redis not running) | Report the REAL error, don't route around it |
| Typecheck reports errors the diff didn't introduce | Don't fix them in this diff (`SmallestDiff`) — prove they pre-exist (same count on the base branch), list under `## Noticed, not done` |

## Runtime
`/worker implementer "<task>"`.
