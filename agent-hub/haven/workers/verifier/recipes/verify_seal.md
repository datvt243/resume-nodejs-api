> the gate.

# Contract
- Input: path to an evidence note under `evidence/implementer/`, OR
  multiple paths (batch), OR `all-pending` (every node currently
  `sealed_pending_verifier` on the active diagram — see "Batch verify"
  below). [batch added 2026-09-05]
- Output: AN ARRAY, 1 element per node: `{verdict: SEAL|REOPEN, node,
  cited: string[], missing: string[], forbidden_hit: string|null,
  pm_updated: boolean, rerun: none|partial|full, isolation_proof:
  string}` — `isolation_proof` is a real self-declaration (step 1b), not
  inferred from outside.
- REFUSAL: if this exact session wrote the diff under review → refuse
  immediately: "I wrote this, a separate verifier pass is required."
  (`NeverVerifyOwnWork`) — in practice moot, since verify_seal runs as a
  fresh subagent dispatched via the Agent tool with no implementation
  history. In a batch, this check still applies PER NODE: refuse just a
  self-written node, don't cancel the rest of the batch.

## Batch verify [added 2026-09-05]
The heaviest cost of a verify pass isn't the act of verifying — it's
reloading the whole bundle + doctrine on every subagent spawn. Batch
verify pays that cost EXACTLY ONCE for N nodes instead of N times,
without changing anything about the substance of verifying:
- The fresh-subagent-context guarantee + self-refusal check (step 1)
  apply ONCE for the whole batch.
- Steps 2-13 (read note, check criteria, scan forbidden states, verdict,
  write verdict, Re-run declaration) run REPEATEDLY, INDEPENDENTLY, for
  EACH node — using node A's evidence/reasoning to infer node B's verdict
  is forbidden, even if the two notes look similar. Each node still gets
  its own evidence, own verdict, own verdict note.
- Being in a batch is NEVER an excuse to loosen any criterion in steps
  2-13 — batching only folds the SPAWN COST, never the VERDICT.
- `all-pending`: first list every `sealed_pending_verifier` node on
  `dev-loop.prime-mermaid.md`, then run the full procedure below on each.

## Re-run scope [cost-driven, added 2026-09-02]
Default: AUDIT the note, don't independently re-run `npm test`/`npm run
build` from scratch (including a fresh `npm ci` in an isolated worktree).
`EvidenceOnly` means "don't substitute reasoning for real evidence" — it
does NOT mean "always regenerate the evidence yourself." If the note's
output is verbatim, not truncated (step 5), the command matches
`doctrine/MEMORY.md` (step 4), and it covers every acceptance criterion
(step 6) → verdict straight off the note, no re-run.

Only re-run (partial or full) when:
- The note is missing a citation, output looks truncated/hidden, or the
  command doesn't match doctrine → REOPEN per steps 4-5 instead — don't
  spend an `npm ci` confirming a note that's already broken.
- The node is outward-facing or a `/release` gate (this project has shipped
  a real production bug once already, v1.2.0 → v1.2.1 — release nodes are
  exactly where the independent-confirmation cost is worth paying).
- `doctrine/domains/PROJECT.md` names this class of change as needing
  independent re-run (a per-project call, not the kit default).

Observed in practice (usage audit 2026-09-02, this hub included): 2
verifier subagents each re-reading the full doctrine + re-running
build/test cost ~50k tokens apiece with no change to the verdict versus
just auditing the note. Not a bug, but not what `EvidenceOnly` actually
asks for — this section pins the boundary.

## Steps
1. REFUSE SELF-GRADING FIRST — did I write this diff in this session? (No,
   by construction — subagent has a fresh context.)
1b. [added 2026-09-06, fed back from real production use in
   `datvt243.github.io`] Record proof this pass is really a separate
   subagent context, not a self-report: cite whatever this invocation was
   actually spawned with that the implementer pass didn't have (e.g. the
   `description`/task string passed to the Agent tool for this spawn) —
   write it into the note's `## Isolation proof` line (step 12a). No hook
   technically blocks a skipped isolation — this only leaves a citeable
   trail for a later audit.
2. [LOOP STARTS HERE FOR EACH NODE if batch] Read the NOTE — only the
   note, do NOT open the diff directly. (`EvidenceOnly`)
3. Read the NODE — pull acceptance criteria from `haven/diagrams/`,
   forbidden states from `CLAUDE.md`. [GUARD, added 2026-08-31] Don't `Read
   agent-hub/CLAUDE.md` yourself for this — same mechanism as
   `boot/SKILL.md`: the harness auto-injects this file's full content as a
   nested-CLAUDE.md `<system-reminder>` the moment step 2 touches anything
   under `agent-hub/`; reading it again here duplicates that content. Read
   it directly only if it's actually missing from context after step 2.
4. Check the command in the note matches `doctrine/MEMORY.md` (`npm test`
   from repo root — not an invented command).
5. Check output isn't truncated/redacted (`...`, "truncated") → REOPEN if
   so.
6. Walk acceptance criteria ONE AT A TIME — missing evidence for any one =
   REOPEN, name it in "missing".
7. Scan all 5 forbidden states.
8. Check SEAL GATE — approval recorded in the note if the diff was
   outward-facing.
9. Check proportion — diff does more than the node requires → REOPEN
   (`SmallestDiff`).
10. Verdict is exactly one of: SEAL (every criterion has cited evidence)
    or REOPEN (one important gap is enough).
11. Only on SEAL: update the ratchet/PM status on
    `haven/diagrams/dev-loop.prime-mermaid.md`. [added 2026-09-05] Update
    the node's own row IN PLACE (state column → SEALED) — never reorder,
    move, or re-sort rows in the table (`AppendOnly`); this keeps
    `agent-hub/.gitattributes`' `merge=union` able to merge cleanly
    across branches.
12. Write the verdict to `evidence/verifier/<date>/<slug>-{seal|reopen}.md`.
12a. [added 2026-09-06] In that note, include the `## Isolation proof`
   line from step 1b.
12b. [added 2026-09-02] In the verdict note, truthfully declare 1 line
   `## Re-run`: `none` (audit-only, the correct default per "Re-run
   scope" above), `partial` (name exactly which command was re-run), or
   `full` (re-ran the entire build+test, e.g. from an isolated worktree)
   — always with a reason matching one of the 3 exception cases in
   "Re-run scope" if not `none`. Misdeclaring this corrupts the
   duplicate-cost signal step 13 depends on.
13. [added 2026-09-02] Append 1 line to `evidence/worker-runs.log`
   (create the file if it doesn't exist): take `hub_bytes_before` from the
   `## Hub bytes before` line in the implementer's note (already read in
   step 2, reuse it); measure `hub_bytes_after` the same way (this hub's
   `/hub-tokens` per-session total), taken AFTER updating PM status in
   step 11 if SEALed. Format:
   ```
   <ISO timestamp> role=verifier outcome=SEAL|REOPEN node=<slug>
   rerun=none|partial|full hub_bytes_before=<N> hub_bytes_after=<N>
   ```
   NEVER edit/delete an old line here — append-only, same rule as the
   rest of `evidence/`.

## Hard rules honored
`NeverVerifyOwnWork` | `EvidenceOnly` | `VerdictOnly` | `RatchetOnly` |
`AppendOnly`

## Failure branches
| Failure | Handling |
|---|---|
| No evidence note | REOPEN, `NO_EVIDENCE` |
| Node doesn't exist on any diagram | REOPEN, `forbidden_hit: node_unknown` |
| Node already SEALED | Don't overwrite — must be a new node |

## Runtime
Dispatched as a subagent (Agent tool) by `/worker verifier "<task or
note>"` or by `/todo` round 2 — never run in the implementer's own
session. [added 2026-09-05] `/worker verifier "<path1> <path2> ..."`
(multiple evidence note paths) or `/worker verifier all-pending` spawns
ONE subagent that verifies every queued node independently — use this
after several small implementer passes have piled up, instead of one
`/worker verifier` call per node.
