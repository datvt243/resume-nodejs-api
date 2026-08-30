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
4. SEAL GATE before any outward-facing action — stop, show the diff, wait
   for approval.
5. Run the EXACT test command from `doctrine/MEMORY.md` (`npm test` from
   repo root) — copy it verbatim.
6. READ THE OUTPUT BACK verbatim — an uncited claim = `EDIT_UNVERIFIED`.
7. Only report `sealed_pending_verifier` once ALL criteria pass with
   evidence.
8–9. If a new bug/trap is found (similar to the traps already recorded in
   `doctrine/domains/PROJECT.md`), consider adding it there or to
   `MEMORY.md`.
10. Write to `evidence/` following the format in `evidence/README.md`.

## Hard rules honored
`SmallestDiff` | `TestsBeforeDone` | `EvidencePerAction` | `NoSilentFailure` |
`NodeBeforeCode`

## Failure branches
| Failure | Handling |
|---|---|
| No test command in `doctrine/MEMORY.md` | `blocked`, suggest filling in `<<FILL>>` |
| Setup error (env, deps, Mongo/Redis not running) | Report the REAL error, don't route around it |

## Runtime
`/worker implementer "<task>"`.
