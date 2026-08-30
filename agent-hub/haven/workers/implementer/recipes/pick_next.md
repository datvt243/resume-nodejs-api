# Contract
- Input: `{task: string}`
- Output: `{node, diagram, current_state, acceptance: string[],
  files: string[], blocked_by: string|null}`

## Steps
1. Read `NORTHSTAR.md` + `doctrine/MEMORY.md` +
   `doctrine/domains/PROJECT.md`.
2. Read EVERY diagram in `haven/diagrams/`, list every node + PM status.
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
