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

## Steps
1. REFUSE SELF-GRADING FIRST — did I write this diff in this session? (No,
   by construction — subagent has a fresh context.)
2. Read the NOTE — only the note, do NOT open the diff directly.
   (`EvidenceOnly`)
3. Read the NODE — pull acceptance criteria from `haven/diagrams/`,
   forbidden states from `CLAUDE.md`.
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
