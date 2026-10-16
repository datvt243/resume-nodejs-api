# 2026-10-16 — add-refresh-token-reuse-detection (implementer diff, round 2 after REOPEN)

Worker: implementer · Version 0.1.0
Node: `add-refresh-token-reuse-detection` (PENDING — status left to verifier)
Task (verbatim): `#165 Refresh-token rotation family tracking (detect stolen/reused refresh tokens)` via `/todo #165`
Branch: `165-refresh-token-rotation` (uncommitted)
Previous notes: `...-plan.md`, `...-diff.md` (round 1, kept as-is); REOPEN: `evidence/verifier/2026-10-16/add-refresh-token-reuse-detection-reopen.md`

## Hub bytes before
233211 (unchanged from round 1's plan note)

## REOPEN reason addressed (verbatim gist)
Criterion 7 / the `jti` justification had no test that fails without `jti`: the e2e test "issues a distinct refresh token even within the same second" still passed with `jti` removed (its login helper signs its own `jti`, so no collision happened), and `handlerLogin`'s `jti` had no test. Also: the round-1 note overclaimed that test's coverage.

## Correction to round 1's note
Round 1's "Found while implementing" said the same-second case is "covered by the e2e test 'issues a distinct refresh token even within the same second'". That was wrong — that test did not exercise a collision. Replaced below.

## Diff (this round only — production code unchanged)
| File | Change |
|---|---|
| `src/__tests__/auth/refreshTokenReuse.test.ts` | test 4 rewritten: login → refresh → refresh again in the SAME second (asserts 200 and a different refresh token), then +30s refresh of the newest token → 200 and no session-invalidated marker. Without `jti` the 2nd rotation returns a byte-identical copy of the token it just marked rotated, so the +30s refresh reads as reuse. |
| `src/__tests__/auth/auth.service.test.ts` | login success test also asserts the 2nd `jwtSign` call (refresh) has `data: { _id: 'user_id', jti: any String }`, with a one-line WHY comment. |

## Mutation proof (the tests fail without `jti`)
`shasum` of `src/auth/auth.controller.ts` + `src/auth/auth.service.ts` saved and both copied to the session scratchpad; both `jti: crypto.randomUUID()` replaced with `jti: void crypto.randomUUID` (→ `jti: undefined`, which JSON-serialises to no claim — identical tokens to the pre-`jti` code, while keeping the `crypto` import used so ts-jest's `noUnusedLocals` still compiles; a first attempt that deleted `jti` outright made both suites fail to compile, `Tests: 0 total`, so it proved nothing and was discarded). Output:
```
mutated: 1 1
      ✕ should login successfully with correct credentials (2 ms)
    ✕ issues a distinct refresh token on every rotation within the same second, so a later refresh is not taken for reuse (1 ms)
Tests:       2 failed, 15 passed, 17 total
src/auth/auth.controller.ts: OK
src/auth/auth.service.ts: OK
Tests:       17 passed, 17 total
```
(`OK` = `shasum -c` after restoring the originals; last line = the same 2 suites re-run on the restored tree. Backups + checksum file deleted.)

## Command
Repo root, per `doctrine/MEMORY.md`: `npm test`; `npm run build` (Typecheck); lint per-file/rule delta vs the round-1 stash baseline (276).

## Output
```
Test Suites: 42 passed, 42 total
Tests:       361 passed, 361 total
TEST_EXIT=0
> cp -R ./src/views ./src/public ./dist/

BUILD_EXIT=0
lint before 276 after 276
delta lines 0
```
(Test count unchanged at 361: one test rewritten, one assertion added to an existing test.)

## Acceptance — delta vs round 1
| # | Criterion | Evidence now |
|---|---|---|
| 7 | Normal rotation unaffected, incl. same-second rotations (the `jti` justification) | rewritten e2e test 4 + login `jti` assertion; both FAIL under the `jti` mutation above, PASS on the real code |
| 10 | comments per code-comments.md | added one `//` WHY in `auth.service.test.ts` (fresh `jti` → same-second logins never collide); no other comments touched this round |
All other rows: unchanged from round 1 (verifier cited them as covered).

## Noticed, not done (added this round, from the verifier's note)
- `POST /auth/logout` with an already-rotated refresh token overwrites its `rotated:` marker with `revoked`, so a later replay of that token is no longer detected as reuse (it is still rejected, never mints). Not in #165's criteria; fixing it means `addToBlacklist` must not downgrade a rotated entry — own small node if wanted.

## Status
`sealed_pending_verifier`
