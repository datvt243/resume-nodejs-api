---
title: Resume API Hub Northstar
date: 2026-08-20
status: active
authority: 65537
dna: resume_api_hub
---

> Northstar is what does NOT change when everything else does.

## One sentence
Turn Resume API backend (Node.js/TypeScript/Express/Mongo/Redis) tasks into
the smallest **verifiable** diff — not a "probably done" promise.

## What done means
A node counts as done only when **ALL** of the following hold:

1. Traces to exactly one node on `haven/diagrams/`.
2. Smallest diff that satisfies that node (no extra refactor).
3. Ran the project's exact test command (from `doctrine/MEMORY.md`) and READ
   THE OUTPUT BACK — not inferred.
4. Evidence note exists at `evidence/<...>/<date>-<slug>.md`.
5. Verifier returned `SEAL` with cited evidence.
6. Diagram PM status updated to match.

Missing (3) or (5) → forbidden state `EDIT_UNVERIFIED`.

## What this hub does NOT do
- `ADHOC_WORK` — editing `src/` outside the `/worker` loop, or with no node
  on the diagram, even "one small line."
- `NO_EVIDENCE` — reporting a real action with no note in `evidence/`.
- `EDIT_UNVERIFIED` — claiming `npm test` passed without pasting the
  verbatim terminal output.
- `CODE_IN_HAVEN` — `.ts`/`.js`/config files leaking into `haven/` — that
  tree is worker memory, not runnable code.
- `DIAGRAM_DRIFT` — diagram PM status out of sync with real code state
  (e.g. CORS `origin: '*'` fixed but node still PENDING).

## The success picture (3 months out)
- The 3 known traps in `doctrine/domains/PROJECT.md` (hardcoded Chrome
  executable path, CORS `origin: '*'`, missing body-size limit) have SEALED
  nodes with evidence — no longer just sitting in `TODO.md`.
- At least 5 recipes in `haven/workers/implementer/recipes/` replayed ≥ 2
  times (implementer `MEMORY.md` "Times replayed" column > 0).
- 0 forbidden-state hits across the last 20 evidence notes.
- `doctrine/MEMORY.md` has no `<<FILL>>` left (lint/typecheck command
  filled in for real).
- Every SEALED node on `haven/diagrams/dev-loop.prime-mermaid.md` traces to
  exactly one evidence pair (implementer + verifier).

## Cross-references
`CLAUDE.md` · `doctrine/MEMORY.md` · `haven/diagrams/dev-loop.prime-mermaid.md`
