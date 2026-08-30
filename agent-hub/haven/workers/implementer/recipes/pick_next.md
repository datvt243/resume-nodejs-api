# Contract
- Input: `{task: string}`
- Output: `{node, diagram, current_state, acceptance: string[],
  files: string[], blocked_by: string|null}`

> [GUARD, added 2026-08-31] If `/boot` already ran in THIS SAME session,
> `NORTHSTAR.md` / `doctrine/MEMORY.md` / `doctrine/domains/PROJECT.md` /
> `haven/diagrams/` are already in context from that pass — steps 1-2 below
> REUSE that content, don't `Read` it again (a second full read of the same
> 4 files is pure duplication, same class of token waste as the
> `agent-hub/CLAUDE.md` case already fixed in `boot/SKILL.md`). Only `Read`
> for real when: (a) `/worker implementer` is invoked without a prior
> `/boot` this session, or (b) the content might have changed since it was
> last read.

## Steps
1. Get `NORTHSTAR.md` + `doctrine/MEMORY.md` + `doctrine/domains/PROJECT.md`
   — reuse from `/boot` if available (see GUARD above), else `Read` fresh.
2. Get every diagram in `haven/diagrams/`, list every node + PM status —
   reuse from `/boot` if available (see GUARD above), else `Read` fresh.
3. Find the earliest PENDING node on the critical path (e.g. the seed node
   `fix-chrome-executable-path` in `dev-loop.prime-mermaid.md`).
4. No match → don't invent work; report "no PENDING node" clearly, stop.
5. Locate code anchors by grep — real paths in `src/`, never invented
   (e.g. `src/services/createPDF.ts:14-25`,
   `src/config/cors.config.ts:8`).
6. Declare blockers: if a needed command is still `<<FILL>>` in
   `doctrine/MEMORY.md` (currently: lint/typecheck), report blocked
   instead of guessing.
7. Evidence: write `evidence/implementer/<date>/<slug>-plan.md`.

## Hard rules honored
`NodeBeforeCode` | `EvidencePerAction` | `NoSilentFailure`

## Failure branches
| Failure | Handling |
|---|---|
| No diagram exists yet | Create `haven/diagrams/<slug>.prime-mermaid.md` matching the `dev-loop` format |
| Task is ambiguous | Stop and ask, don't guess |

## Runtime
`/worker implementer "<task>"`. No API key, no network call — Claude Code
IS the runtime.
