# 2026-10-16 — add-refresh-token-reuse-detection (implementer diff)

Worker: implementer · Version 0.1.0
Node: `add-refresh-token-reuse-detection` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING — status left to verifier)
Task (verbatim): `#165 Refresh-token rotation family tracking (detect stolen/reused refresh tokens)` via `/todo #165`
Branch: `165-refresh-token-rotation` off `staging` @ `3b274ab`
Plan note: `evidence/implementer/2026-10-16/add-refresh-token-reuse-detection-plan.md`

## Hub bytes before
233211

## Diff
| File | Why |
|---|---|
| `src/utils/tokenBlacklist.ts` | `addToBlacklist(token, rotatedAt?)` — Redis value `rotated:<unix s>` instead of `revoked` when given, mem `Entry.rotatedAt`; same key/TTL, so `isBlacklisted` is unchanged (still true). New `getRotatedAt(token)` → number or null (logout entry, unknown, expired, or Redis error → null, logged). JSDoc on both. |
| `src/auth/auth.controller.ts` | `authRefreshToken`: before the existing blacklist check, `getRotatedAt` → if non-null, `revokeOnRefreshTokenReuse` then the SAME 403 `auth.refreshTokenRevoked` as the logout branch (never mints). Rotation now `addToBlacklist(old, now)`. The new refresh token carries `jti: crypto.randomUUID()`. `revokeOnRefreshTokenReuse` (module-local): within `REFRESH_REUSE_GRACE_SECONDS = 10` → no-op; `jwtVerify` throws → no-op; no `_id` or `isSessionRevoked(iat, getSessionsInvalidatedAt(_id))` → no-op; else `invalidateAllSessions(_id)` + `logger.warn`. Imports `crypto`, `logger`, `getRotatedAt`. |
| `src/auth/auth.service.ts` | `handlerLogin` refresh token gets `jti: crypto.randomUUID()` (see "Found while implementing"). |
| `src/routers/api/v1/auth.route.ts` | swagger `/auth/refresh`: description of single-use + reuse/grace behavior, `403` response documented. |
| `src/__tests__/auth/refreshToken.test.ts` | default `getRotatedAt → null`; rotate test now asserts `addToBlacklist('oldRefresh', any Number)`, refresh `jti`, no revocation; +5 reuse tests: past grace → `invalidateAllSessions('user1')` + 403 + nothing minted/blacklisted; within grace → no verify, no revoke; verify throws → no revoke, `next` not called; iat predates marker → no re-revoke; reused vs logged-out → identical `status`/`json` calls. |
| `src/__tests__/auth/refreshTokenReuse.test.ts` (new) | 4 end-to-end tests, real `jwtSign`/`jwtVerify`, real in-memory `tokenBlacklist` + `sessionRevocation`, fake clock: theft after 30s revokes owner's new access + refresh token; owner re-login then a later replay → 403 and marker unchanged, new session still 200; replay at +5s → 403, no marker, newest pair 200; same-second rotation then refresh +30s → 200, no revocation. |
| `src/__tests__/utils/tokenBlacklist.test.ts` (new) | `describe.each` Redis (Map-backed fake client) / in-memory: rotated marker read back + still blacklisted; logout entry and unknown token → null. |
| `src/__tests__/auth/auth.controller.test.ts` | `beforeEach` in `authRefreshToken` block: `getRotatedAt → null` (automock resolves `undefined`, which the controller would read as "rotated"). |
| `CLAUDE.md`, `README.md` | Auth Flow step 4, Security bullets (blacklist values + reuse detection), refresh API rows, structure row, test table (+2 files, refreshToken row) |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | appended PENDING node row |

## Found while implementing (why `jti` is in this diff)
Two JWTs signed in the same second with the same payload are byte-identical (`{ _id, iat, exp }`). So a refresh in the same second as login (or as the previous refresh) returned exactly the token it had just blacklisted — pre-existing, the next refresh already failed 403. With reuse detection that next refresh would instead read as reuse and, after 10s, log the owner out of everything. A random `jti` on both refresh-token sign sites (`handlerLogin`, `authRefreshToken`) makes every refresh token unique; covered by the e2e test "issues a distinct refresh token even within the same second". Access tokens have the same same-second collision (logout + re-login in one second) but do not feed reuse detection — left alone (see Noticed).

## Command
Repo root, per `doctrine/MEMORY.md`: `npm test`; `npm run build` (Typecheck). Lint: `npx eslint . --format json` on the diff tree vs a `git stash push -u -- src` baseline (`status identical after stash/pop`), diffed per file+rule.

## Output
Final tree:
```
Test Suites: 42 passed, 42 total
Tests:       361 passed, 361 total
TEST_EXIT=0
```
(staging baseline 348; +13 new = 5 + 4 + 4.)
```
> cp -R ./src/views ./src/public ./dist/

BUILD_EXIT=0
```
```
lint before 276 after 276
delta lines 0
```
History, recorded honestly:
- First auth-suite run: 2 failures — e2e asserted `data` undefined but `formatReturn` sends `null` (test fixed to `toBeNull()`); `auth.controller.test.ts` "should refresh token successfully" took the reuse branch because the automocked `getRotatedAt` resolves `undefined` (fixed in the test with a `beforeEach` → `null`, matching the real function's contract). Then `Test Suites: 6 passed, 6 total`, `Tests: 47 passed, 47 total`.
- First full run: `42 passed / 361 passed`, `TEST_EXIT=0`, build 0, but lint `276 → 279`: `DELTA src/__tests__/utils/tokenBlacklist.test.ts @typescript-eslint/require-await 0 -> 2`, `DELTA src/auth/auth.controller.ts @typescript-eslint/no-unnecessary-type-assertion 0 -> 1`. Fixed (fake client returns `Promise.resolve`, dropped the `as` cast) → the final output above.

## Acceptance
| # | Criterion | Evidence |
|---|---|---|
| 1 | Rotation records a rotated-at marker; `isBlacklisted` still true | `tokenBlacklist.test.ts` (Redis + mem); rotate unit test asserts `addToBlacklist('oldRefresh', Number)` |
| 2 | Reuse > 10s after rotation → revoke all + 403; owner's newest pair rejected | unit "past the grace window"; e2e test 1 (owner's access token `isSessionRevoked` true, owner's refresh → 403) |
| 3 | Within 10s → 403, no revocation, newest pair works | unit "inside the grace window"; e2e test 3 |
| 4 | Never mints; same response as logout 403 | unit `expectRejectedWithoutMinting`; unit "exactly like a logged-out one" (status + json calls equal) |
| 5 | Token predating marker → no re-revocation | unit "already predates"; e2e test 2 (marker unchanged, re-login session 200) |
| 6 | Unverifiable reused token → 403, no revocation | unit "fails verification" (`next` not called) |
| 7 | Normal rotation + logged-out 403 unchanged | existing tests pass unchanged except the rotate assertion's extra arg; `returns 403 when refresh token is blacklisted` PASS; e2e test 4 |
| 8 | End-to-end regression test | `refreshTokenReuse.test.ts` |
| 9 | npm test / build / lint delta 0 / docs | Output above; CLAUDE.md, README.md, swagger |
| 10 | comments per code-comments.md | `tokenBlacklist.ts`: JSDoc on exported `addToBlacklist` (WHY of `rotatedAt`) and `getRotatedAt`. `auth.controller.ts`: `/** */` WHY on `revokeOnRefreshTokenReuse` (theft reasoning + the 3 skip cases); one `//` WHY above the reuse check (no detection oracle); one `//` WHY on `jti`. `auth.service.ts`: one `//` WHY on `jti`. Tests: file-overview JSDoc on the 2 new files, one `//` WHY in the auth.controller.test `beforeEach`. No `(#N)` refs, no stacked `//`. |

## Noticed, not done
- Check-then-blacklist in `authRefreshToken` is not atomic: two requests with the same token arriving in the same instant can both pass before either marks it (pre-existing TOCTOU; Redis `SET NX` would close it). Not required by #165's criteria; own node if wanted.
- Access tokens can still collide within one second (logout then re-login in the same second → the new access token is already blacklisted). Pre-existing, unrelated to reuse detection.
- `iat` second granularity: a token issued in the same second as an `invalidateAllSessions` survives it (`iat < invalidatedAt` is strict) — pre-existing in `sessionRevocation.ts`.

## Status
`sealed_pending_verifier`
