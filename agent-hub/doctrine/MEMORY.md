> If any other doc contradicts this file on a path or command, THIS FILE
> WINS. One home per fact — a command living in two files will be wrong in
> one of them.

## What this is
- Hub path (absolute): `/Users/_david/Workspace/Project/resume/resume-nodejs-api/agent-hub`
- Code repo path (absolute): `/Users/_david/Workspace/Project/resume/resume-nodejs-api`
- Hub ↔ repo relationship: only touch the repo through a worker, with an
  actual test run and an evidence note — never ad-hoc.

## The exact commands
> COPY these — never type from memory. A command remembered drifts, and a
> drifted command proves the wrong thing.

| Purpose | Command | Run from |
|---|---|---|
| Test | `npm test` | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Test one file | `npx jest <path/to/file.test.ts>` | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Build | `npm run build` | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Lint | `npm run lint` (= `eslint .`) | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Typecheck | `n/a` as a standalone script — happens implicitly inside `npm run build` (`tsc && npm run copy`) | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |
| Run locally | `npm run dev` | `/Users/_david/Workspace/Project/resume/resume-nodejs-api` |

`npm test` = `jest --passWithNoTests` (see `package.json`).

[corrected 2026-10-06, found while implementing `add-cv-export-themes`/#162]
The row above previously said `n/a` — no `lint` script in `package.json`,
"re-checked 2026-09-18". That's stale: `package.json` has a real `"lint":
"eslint ."` script (confirmed present, root `CLAUDE.md`'s own Commands
table already lists it — the staleness was only in this file). Current
baseline on `staging`: 360 ESLint problems, all pre-existing (tracked by
`fix-remaining-any-unsafe-missed-files`/#204 and the still-open
`chore(lint): fix no-misused-promises false positives`/#205) — running
`npm run lint` is real, fast, and worth doing on any diff touching
`src/` to confirm a change adds zero NEW problems on top of that
baseline (compare before/after counts with `git stash`, don't just read
the raw number), same discipline as `npm test`/`npm run build`.

**`npx tsc --noEmit` does NOT cover everything `npm test` type-checks.**
[added 2026-10-02, `enable-no-property-access-index-signature`/#187] `tsc`
only checks files matched by `tsconfig.json`'s `include` (`src/**/*.ts`) —
but `jest.config.ts`'s `setupFiles: ['<rootDir>/jest.setup.ts']` means
`ts-jest` also type-checks `jest.setup.ts`, a root-level file OUTSIDE
`src/`, under the same compiler options. A new strict flag can pass a
clean `tsc --noEmit` and then fail every single test suite at once
(`jest.setup.ts` errors abort the whole run) because that one file was
never in `tsc`'s own scope. When adding/changing a compiler flag, always
run the real `npm test` too — don't stop at a clean `tsc --noEmit` and
assume test files (or their setup files) are covered.

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

## Multi-phase / multi-branch sessions — branch isolation
[added 2026-10-01, after a real `ADHOC_WORK` REOPEN caused by this exact
mistake on node `remove-req-as-any-casts`, GitHub issue #179]

When a single session runs several `/todo`-style phases back-to-back
(e.g. a tracking issue with N sub-issue phases), each phase gets its own
branch, but they all share ONE working directory — there is no isolated
worktree available (see the sandbox gotcha below), so switching branches
mid-session is a real hazard:

- **`git checkout <other-branch>` with uncommitted changes silently
  carries those changes along** if the target branch's tracked files
  don't conflict. This is the normal, correct git behavior — but it means
  a diagram-node addition (or anything else) made while on `staging`
  BEFORE branching into phase N's branch will ride along onto whichever
  branch happens to be checked out next, not necessarily phase N's.
- **`git stash` before switching branches is the fix** — but the same
  hazard reappears if a stash is popped/left implicitly: always
  `git stash push -u -m "<phase>-sealed-pending-ship"` (with a message
  naming the phase) right after a phase is SEALED, before checking out
  the next phase's branch fresh from `staging`. Never pop a stash "to
  save time" onto a different branch than the one it was made on.
- **Add each phase's own diagram PENDING node ON that phase's own
  branch, immediately before implementing it — never batch-add several
  phases' nodes while sitting on `staging`/a shared checkout.** A batch
  addition done once, before branching per-phase, WILL get stashed away
  with whichever phase happens to be isolated first, silently stranding
  the node off every other phase's branch — exactly what happened here:
  12 backlog nodes were added on `staging`, carried onto phase 1's branch
  by the first `gh issue develop --checkout`, then `git stash`ed together
  with phase 1's other changes when isolating phase 2 — phase 2's branch
  was checked out fresh from `staging` and never saw any of the 12 rows,
  including its own. The verifier caught it as `ADHOC_WORK` (correctly —
  the mechanism worked as designed), but re-verification cost a full
  extra round-trip. Adding the node fresh, per-phase, right before that
  phase's own implementation work, makes this class of mistake
  structurally impossible instead of relying on remembering to check.

## Sandbox/tooling gotchas (this machine)
[added 2026-10-01]

- **`git worktree add <path>` OUTSIDE the primary working directory
  fails silently on writes** — the Bash tool's sandbox scopes file writes
  to the primary working directory tree; a worktree created as a sibling
  directory (e.g. `../wt/<branch>`) will let `git worktree add` itself
  succeed, but every subsequent `sed -i`/file-write into that worktree
  fails with a confusing generic error (looked like a `sed` quoting bug,
  wasn't). If real isolation between concurrent branches is needed within
  one session, use `git stash` + branch switching in the primary working
  directory instead (see above) — don't reach for `git worktree add` to a
  sibling path.
- **BSD/macOS `sed` (Darwin, this machine) does NOT support `\b` word
  boundaries** — a pattern like `s/(req as any)\.t\b/req.t/g` silently
  matches nothing (no error, just a no-op) instead of erroring or
  matching. Use an explicit trailing character/space instead of `\b`
  (e.g. `s/(req as any)\.t /req.t /g`), and always re-grep after a sed
  pass to confirm zero remaining matches rather than trusting exit code 0
  (BSD `sed` exits 0 even when a pattern matched nothing).
- **A shell `for f in $files; do sed -i '' ... "$f"; done` loop failed**
  in this Bash tool with a garbled "No such file" error naming the WHOLE
  space-joined file list as one filename, even though `$files` was a
  normal space-separated string and single-file `sed` calls worked fine
  in isolation. Root cause not fully diagnosed (didn't reproduce outside
  the loop) — the reliable workaround is one `sed` invocation per file as
  a separate tool call, not a shell loop, when doing a mechanical
  multi-file find/replace in this environment.

## Scoping a lint/type-safety remediation initiative
Moved 2026-10-24: duplicate of `standards/initiative-scoping.md` (same #177 → #204
case + fix). Rule lives there only.
