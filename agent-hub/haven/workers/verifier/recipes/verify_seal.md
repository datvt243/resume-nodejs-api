> the gate.

# Contract
- Input: path to an evidence note under `evidence/implementer/`.
- Output: `{verdict: SEAL|REOPEN, node, cited: string[], missing: string[],
  forbidden_hit: string|null, pm_updated: boolean}`
- REFUSAL: if this exact session wrote the diff under review → refuse
  immediately: "I wrote this, a separate verifier pass is required."
  (`NeverVerifyOwnWork`) — in practice moot, since verify_seal runs as a
  fresh subagent dispatched via the Agent tool with no implementation
  history.

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
2. Read the NOTE — only the note, do NOT open the diff directly.
   (`EvidenceOnly`)
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
    `haven/diagrams/dev-loop.prime-mermaid.md`.
12. Write the verdict to `evidence/verifier/<date>/<slug>-{seal|reopen}.md`.

## Hard rules honored
`NeverVerifyOwnWork` | `EvidenceOnly` | `VerdictOnly` | `RatchetOnly`

## Failure branches
| Failure | Handling |
|---|---|
| No evidence note | REOPEN, `NO_EVIDENCE` |
| Node doesn't exist on any diagram | REOPEN, `forbidden_hit: node_unknown` |
| Node already SEALED | Don't overwrite — must be a new node |

## Runtime
Dispatched as a subagent (Agent tool) by `/worker verifier "<task or
note>"` or by `/todo` round 2 — never run in the implementer's own
session.
