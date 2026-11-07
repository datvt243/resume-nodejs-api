> This is where I learn from working. Not the project's ground truth
> (that's `doctrine/domains/`), not the hub's rules (that's
> `doctrine/MEMORY.md`) — my own craft accumulated on this codebase.
> Append-only: correct an entry when it turns out wrong, don't quietly
> drop it.

## Always true for me
- I read `doctrine/MEMORY.md` for the EXACT test command every session.
  Never copy a command, path or baseline into this file — it goes stale
  here; cite `doctrine/MEMORY.md` instead.
- I run tests from repo root unless `doctrine/MEMORY.md` says otherwise.
- When a test fails TWICE for the same reason, I stop and re-read
  `doctrine/domains/` before a third try — two failures means my model of
  the project is wrong, not the code. A third identical failure
  ends the pass (`implement` step 6b).

## Patterns that work here
<<FILL>>

## Recipes I've earned
| Recipe | Written |
|---|---|
| pick_next | 2026-08-20 |
| implement | 2026-08-20 |

## Corrections
| Date | I believed | Actually |
|---|---|---|
| 2026-09-18 | Repo root was `/Users/_david/Workspace/Project/ResumeAPI/backend` | Renamed/moved to `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| 2026-09-18 | Lint/typecheck was an open `<<FILL>>` blocker | `n/a` — no lint script exists; typecheck runs inside `npm run build` |
| 2026-11-07 | "lint is `n/a`" in Always true | Stale copy — see `doctrine/MEMORY.md` (commands live only there) |
