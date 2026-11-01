# 2026-10-31 - fix-lastname-min-length (diff)

- Worker: implementer · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-lastname-min-length`
- Task: `#333 Given name (lastName) requires 3+ characters, rejects names like An, Vy, Hà — src/config/joi.config.ts:52 lastName min(3) → min(1) like firstName; optionally align max (35 vs frontend 30).`
- Branch: `333-given-name-lastname` · Plan: `evidence/implementer/2026-10-31/fix-lastname-min-length-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 81374

## Diff
| File | Why |
|---|---|
| `src/config/joi.config.ts:52` | `lastName` `.min(3)` → `.min(1)` (same as `firstName`); `max(35)` kept |
| `src/__tests__/config/joi.config.test.ts` (new) | Locks in: `An`/`Vy`/`Hà`/`Tú`/`Nguyễn` accepted, `''` rejected |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (verbatim from `doctrine/MEMORY.md`):
- `npm test`
- `npm run build`
- `npm run lint`
- Base comparison: `git stash -u` → `npm test` → `git stash pop`

## Output
`npm test` (with diff):
```
PASS src/__tests__/config/joi.config.test.ts
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts (5.906 s)
Test Suites: 2 failed, 51 passed, 53 total
Tests:       5 failed, 478 passed, 483 total
```
`npm test` (base `staging`, diff stashed):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts (5.271 s)
Tests:       5 failed, 472 passed, 477 total
```
Pre-existing failure causes (local env, identical on base):
- `tokenExpiry.test.ts` › "falls back to a 1h access token when TOKEN_EXP_IN is unset": `Expected: 3600 Received: 10800` — local `.env` has `TOKEN_EXP_IN=` set (`grep -c "^TOKEN_EXP_IN=" .env` → `1`).
- `atsPdfIntegration.test.ts` (4 tests): `Could not find Chrome (ver. 127.0.6533.88)` — Puppeteer Chrome not installed locally (`CI_NO_CHROME` not set).

`npm run build`:
```
> resume-nodejs-api@2.2.3 copy
> cp -R ./src/public ./dist/
build exit=0
```
`npm run lint`: base `✖ 274 problems (274 errors, 0 warnings)`; with diff `✖ 274 problems (274 errors, 0 warnings)`.
`npx eslint src/config/joi.config.ts src/__tests__/config/joi.config.test.ts`: 6 errors, all in `joi.config.ts` lines 21 and 33 (untouched); 0 in the new test file.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. `lastName` `min(1)`, `max(35)` kept | diff: `-...min(3).max(35)...` / `+...min(1).max(35)...` |
| 2. Test: short names accepted, `''` rejected | `PASS src/__tests__/config/joi.config.test.ts`; total tests 477 → 483 (+6 = 5 `it.each` + 1), failures unchanged at 5 |
| 3. `npm test` + `npm run build` green | build exit=0; test: 5 failures, all pre-existing on base with identical names (local env causes above), 0 new |
| 4. Lint adds zero new problems | 274 → 274 |
| Comments per code-comments.md | Only comment added is the test file's header docblock (cites #333 + the why), matching `cors.config.test.ts`'s header style; no comments changed in `src/` code |

## Supersedes: none
## Still open: none

## Noticed, not done
- `tokenExpiry.test.ts` reads the real `.env` `TOKEN_EXP_IN`, so it fails on any machine whose `.env` sets it — test isolation bug, separate issue.
- Related open issues #331 (school min 10) and #332 (`.trim().strict()` rejects surrounding spaces) — out of scope.
- `max` alignment (35 vs frontend 30) left as-is — optional per issue.

## Seal gate
none — no commit/push/outward action taken.
