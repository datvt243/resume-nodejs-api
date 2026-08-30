> Evidence is who did what and why (`NO_EVIDENCE` if missing). Every worker
> action ends with a note.

## Layout
```
evidence/implementer/<date>/<slug>-plan.md
evidence/implementer/<date>/<slug>-diff.md
evidence/verifier/<date>/<slug>-{seal|reopen}.md
```
Date as `YYYY-mm-dd`, slug kebab-case from the task name.

## Format — implementer note
- Title (date - node) · Worker · Version · Node (points to diagram) · Task
  (verbatim prompt)
- `## Diff` — files | file | why |
- `## Command` — exact command from `doctrine/MEMORY.md`
- `## Output` — verbatim, no paraphrasing
- `## Acceptance` — table | Criterion | Evidence | (evidence points to a
  specific output line — not "tests pass," but "Tests: 42 passed, 42
  total")
- `## Noticed, not done` — out-of-scope findings, not fixed
- `## Seal gate` — record approval if an outward-facing action happened,
  or "none"

## Format — verifier verdict
- Worker (subagent, dispatched via Agent tool) · Node · New PM status
  (PENDING/SEALED/REOPEN)
- `## Reasoning` — cite evidence for each criterion
- `## Missing` — only present on REOPEN

## The three rules of this directory
1. **VERBATIM, ALWAYS** — no claim without real cited evidence.
2. **NEVER DELETE** — fix a wrong note by adding a correction, don't
   delete it.
3. **BAD NOTES STAY** — a "task failed" note stays; a clean trail matters
   less than preserving doctrine's value.
