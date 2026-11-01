# 2026-10-31 - fix-lastname-min-length (diff, round 2 after REOPEN)

- Worker: implementer · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-lastname-min-length`
- Task: `#333 Given name (lastName) requires 3+ characters, rejects names like An, Vy, Hà — src/config/joi.config.ts:52 lastName min(3) → min(1) like firstName; optionally align max (35 vs frontend 30).`
- Branch: `333-given-name-lastname`
- Previous note: `evidence/implementer/2026-10-31/fix-lastname-min-length-diff.md` (all its criteria 1–4 evidence still stands; `src/config/joi.config.ts` unchanged since)
- REOPEN addressed: `evidence/verifier/2026-10-31/fix-lastname-min-length-reopen.md` — test header carried `(issue #333)`, banned by `doctrine/standards/code-comments.md` Delete list.
- Status: sealed_pending_verifier

## Hub bytes before: 81374
Measured from `agent-hub/` with:
`{ find . -maxdepth 1 -type f; find doctrine -type f; echo haven/diagrams/dev-loop.prime-mermaid.md; find haven/workers -type f; } | xargs cat | wc -c`

## Diff
| File | Why |
|---|---|
| `src/config/joi.config.ts:52` | unchanged from round 1: `.min(3)` → `.min(1)`, `max(35)` kept |
| `src/__tests__/config/joi.config.test.ts` | 4-line docblock citing `(issue #333)` → 1-line why-only comment: `` // `lastName` is the given name (Tên), which can be 1–2 characters (An, Vy). `` |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api`:
- `npx jest src/__tests__/config/joi.config.test.ts` (Test one file, `doctrine/MEMORY.md`)
- `npm run lint`
- `npx eslint src/__tests__/config/joi.config.test.ts`
- `grep -n "#[0-9]" src/__tests__/config/joi.config.test.ts`
- `npm test` / `npm run build`: see round-1 note; the only change since is a comment in a test file (no type or runtime effect).

## Output
```
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.971 s, estimated 1 s
Ran all test suites matching /src\/__tests__\/config\/joi.config.test.ts/i.
✖ 274 problems (274 errors, 0 warnings)
eslint test-file exit=0
issue-ref grep exit=1
```
(grep exit=1 = no `#<n>` issue refs left in the file.)

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. `lastName` `min(1)`, `max(35)` kept | round-1 note diff; file untouched since |
| 2. Test: short names accepted, `''` rejected | `Tests: 6 passed, 6 total` |
| 3. `npm test` + `npm run build` green | round-1 note: build exit=0, `Tests: 5 failed, 478 passed, 483 total` with the 5 identical to base (local env); round 2 changes only a comment |
| 4. Lint adds zero new problems | `✖ 274 problems` (base 274); new test file `eslint exit=0` |
| Comments per code-comments.md | Only comment: 1-line why (given names can be 1–2 chars), no issue ref (`grep` exit=1), no what-narration |

## Supersedes: none
## Still open: none

## Noticed, not done
Same as round-1 note.

## Seal gate
none — no commit/push/outward action taken.
