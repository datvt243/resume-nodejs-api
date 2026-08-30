> If any other doc contradicts this file on a path or command, THIS FILE
> WINS. One home per fact — a command living in two files will be wrong in
> one of them.

## What this is
- Hub path (absolute): `/Users/_david/Workspace/Project/ResumeAPI/backend/agent-hub`
- Code repo path (absolute): `/Users/_david/Workspace/Project/ResumeAPI/backend`
- Hub ↔ repo relationship: only touch the repo through a worker, with an
  actual test run and an evidence note — never ad-hoc.

## The exact commands
> COPY these — never type from memory. A command remembered drifts, and a
> drifted command proves the wrong thing.

| Purpose | Command | Run from |
|---|---|---|
| Test | `npm test` | `/Users/_david/Workspace/Project/ResumeAPI/backend` |
| Test one file | `npx jest <path/to/file.test.ts>` | `/Users/_david/Workspace/Project/ResumeAPI/backend` |
| Build | `npm run build` | `/Users/_david/Workspace/Project/ResumeAPI/backend` |
| Lint/typecheck | `<<FILL>>` | `<<FILL>>` |
| Run locally | `npm run dev` | `/Users/_david/Workspace/Project/ResumeAPI/backend` |

`npm test` = `jest --passWithNoTests` (see `package.json`). No `lint`
script in `package.json` despite `.eslintrc.cjs` existing — don't assume
`npm run lint` is real, it isn't as of 2026-08-20.

Until Lint/typecheck is filled in: implementer reports `blocked` instead of
guessing. That's CORRECT behavior, not a bug.

## Stack
| Thing | Value |
|---|---|
| Language/runtime | Node.js `>=20.19.0 <23.0.0` + TypeScript 5.5.4 (strict, CommonJS) |
| Package manager | npm (`package-lock.json` present) |
| Test runner | Jest 29.7 + ts-jest (`jest.config.ts`: roots `src/`, testRegex `__tests__` or `.test./.spec.`) |

## The default way to work
`/boot` → `/worker implementer "<task>"` → `/worker verifier "<task>"`.
Never skip step 1 on a cold session, never skip step 3.

## Workers
| wid | Role | Actions | Seal actions |
|---|---|---|---|
| implementer | Implementer | pick_next, implement | — |
| verifier | Verifier | verify_seal | SEAL, REOPEN |

## Forbidden states
5 states — see `CLAUDE.md` for detail. These OVERRIDE all other skill text.

## Facts that are always true
- No LLM API key anywhere in the hub — Claude Code IS the runtime.
- `haven/` is memory, not code.
- `evidence/` is committed; "bad" notes are kept, not deleted.
- Monotonic ratchet: PENDING → IN_PROGRESS → SEALED, never demoted.
- Verifier owns PM status; implementer never sets it.
- `dist/` is build output, always gitignored, never hand-edited.

## Open <<FILL>> values
1. Lint/typecheck command + run-from path — no confirmed real script yet
   (no `npm run lint` in `package.json` as of 2026-08-20). `/boot` reports
   this as a blocker until filled.
