# agent-hub — Resume API Backend

One-person dev hub for `nodejs-resume-api-ts`. NOT code doctrine mixed with
code — the repo is where you build; `agent-hub/` is pure markdown: doctrine,
worker memory, diagram, and audit trail.

## Philosophy
Intelligence doesn't live in the model — the model resets every session. It
lives in `doctrine/`, `haven/workers/*/recipes/`, and accumulated evidence.
The agent is hired help for a session; the hub is the body that remains.

## Where to start
1. `NORTHSTAR.md` — what "done" means.
2. `CLAUDE.md` — agent contract, forbidden states.
3. `doctrine/MEMORY.md` ★ — real test/build commands (`npm test`, `npm run build`).
4. `doctrine/domains/PROJECT.md` ★ — this project's real invariants/traps/
   decisions (CORS `origin: '*'`, hardcoded Chrome executable path, etc.).
5. `haven/diagrams/dev-loop.prime-mermaid.md` ★ — state of every task.

## Daily loop
```
/boot                                   # read only, no edits
/worker implementer "<task>"            # pick_next → implement → evidence
/worker verifier "<task or note>"       # SEAL or REOPEN (runs as a subagent)
# or combine both:
/todo "<task>"
```

Mechanism detail: see `CLAUDE.md` (forbidden states, seal gate) and
`doctrine/standards/` (edit-verification, recipes).

## Current status (2026-08-22)
0 nodes SEALED out of 11 on `dev-loop.prime-mermaid.md`. `doctrine/MEMORY.md`
still has 1 `<<FILL>>` (lint/typecheck command — no `lint` script in
`package.json`). Latest evidence: `fix-redis-init-blocks-dev-startup`
REOPENED by verifier (2026-08-22) — implementer's manual-verification log
had a truncated line.
