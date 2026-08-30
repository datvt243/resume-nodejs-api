> Recipe = SAVED REASONING — good steps meant to replace deriving from
> scratch. Next time, just replay.

## Why they matter (accumulated intelligence)
"Recipes are capital. Models are fuel." Accumulated intelligence doesn't
live in the model — it lives in the recipes written down.

## When to write one
Write a recipe when: (1) this task recurs ≥ 2 times, (2) it has an
easy-to-forget/mistake-prone step, (3) it cost real debugging effort to
figure out, (4) the procedure is long enough to be worth saving.

## What they are NOT
Not a fixed action/command in `manifest.yaml` — that's a different
authority. Recipes live at `haven/workers/<wid>/recipes/*.md`.

## Format (5 required sections)
1. **Contract** — Input, Output, when to use.
2. **Steps** — numbered, deterministic.
3. **Hard rules honored** — list the related hard rule names.
4. **Failure branches** — table | Failure | Handling |.
5. **Runtime** — how to invoke (`/worker <wid> "<task>"`).

## Maintaining them
When a recipe turns out wrong, fix it, and record it in the Corrections
table in that worker's `MEMORY.md`. Don't delete and walk away — fix and
keep the lesson.
