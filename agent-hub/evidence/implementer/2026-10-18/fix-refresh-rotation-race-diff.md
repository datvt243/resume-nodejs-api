# 2026-10-18 — fix-refresh-rotation-race (implementer diff)

Worker: implementer · Version 0.1.0
Node: `fix-refresh-rotation-race` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row, PENDING)
Task: see `-plan.md` (same folder). Issue #262, branch `262-fix-auth-make`.
Status: **sealed_pending_verifier**

## Hub bytes before: 236186

## Diff
| File | Why |
|---|---|
| `src/utils/tokenBlacklist.ts` | new exported `claimRotation(token, rotatedAt)`: Redis `set(blacklist:<t>, rotated:<s>, { EX: max(ttl,1), NX: true })` → `=== 'OK'`; in-memory sync check (live entry → false) + set; catch → log + false (fail closed). Same key/value format as `addToBlacklist`, so `getRotatedAt`/`isBlacklisted` read it unchanged. Added to default export. |
| `src/auth/auth.controller.ts` | `authRefreshToken`: `addToBlacklist(refreshToken, now)` → `if (!(await claimRotation(...))) return 403 auth.refreshTokenRevoked` before `jwtSign`. Import updated; `addToBlacklist` still used by logout (line 305). |
| `src/__tests__/utils/tokenBlacklist.test.ts` | fake redis client gains `set` honoring `NX`; +2 tests × (redis, in-memory): `Promise.all` of 2 claims → `[false,true]`, marker = winner's; claim refused on already-rotated and logged-out tokens. |
| `src/__tests__/auth/refreshToken.test.ts` | 200 test now mocks/asserts `claimRotation`; +1 test: claim lost → 403, no `jwtSign`, no cookie, no revoke; reuse/#74 tests assert `claimRotation` not called (was `addToBlacklist`); removed now-unused `mockedAddToBlacklist`. |
| `src/__tests__/auth/refreshTokenReuse.test.ts` | +1 e2e (real jwt + real in-memory store): `Promise.all([refresh(t), refresh(t)])` → statuses `[200, 403]`, no session revocation, winner's new refresh token still works. |
| `src/__tests__/auth/auth.controller.test.ts` | 1 line: success-path mock `addToBlacklist` → `claimRotation` resolved true (automocked module returned undefined → 403 otherwise). |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | appended PENDING row (before code) |

## Command
Targeted: `npx jest src/__tests__/utils/tokenBlacklist.test.ts src/__tests__/auth/refreshToken.test.ts src/__tests__/auth/refreshTokenReuse.test.ts` · `npm test` · `npm run build` · `npx eslint . -f json` before (clean branch) / after, compared per file+ruleId.

## Output
Targeted run with fix: `Tests:       23 passed, 23 total`.
E2e race test against PRE-fix controller (`git show HEAD:src/auth/auth.controller.ts` swapped in, then restored; shasum of restored file == fixed copy):
```
    ✕ mints exactly one new pair when two refreshes race with the same token (3 ms)
    - Expected  - 1
    + Received  + 1
Tests:       1 failed, 4 passed, 5 total
```
First full `npm test` run: `Tests: 1 failed, 383 passed, 384 total` — `auth.controller.test.ts › authRefreshToken › should refresh token successfully` (automocked `claimRotation` → undefined → 403). Fixed by the 1-line mock change above. First lint run: 277 (+1 `no-unnecessary-type-assertion` on a copied `as any` in my new unit test) — removed the cast.
Final:
```

Test Suites: 43 passed, 43 total
Tests:       384 passed, 384 total
Snapshots:   0 total
Time:        22.182 s, estimated 23 s
Ran all test suites.
```
TEST_EXIT=0
```
> resume-nodejs-api@1.13.0 copy
> cp -R ./src/views ./src/public ./dist/
```
BUILD_EXIT=0 (typecheck: `tsc` inside build, clean — incl. redis v4 `set(..., { EX, NX })` typing).
Lint: before 276, after 276, diff empty → LINT_DIFF=0.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. atomic `claimRotation` (Redis NX EX; sync in-memory; errors → false) | code in diff table; util tests "only the first of two concurrent claims" + "refuses to claim … rotated or logged out" PASS on both redis and in-memory |
| 2. controller claims before signing; loser → same 403, no tokens | unit "returns 403 without minting when a concurrent refresh already claimed the token" PASS (`jwtSign` not called, `res.cookie` not called) |
| 3. concurrent same-token refresh → one 200, one 403 | e2e "mints exactly one new pair…" PASS; FAILED pre-fix (above) |
| 4. existing reuse/logout/logout-all behavior unchanged | all 5 pre-existing reuse unit tests + 4 pre-existing e2e + logout tests in `auth.controller.test.ts` PASS; full 384/384 |
| 5. npm test / build / lint delta 0 | `Tests: 384 passed, 384 total` (378 staging + 6 new), BUILD_EXIT=0, LINT_DIFF=0 |
| comments per code-comments.md | 1 JSDoc on exported `claimRotation` (WHY: single winner, fail-closed); 2 single-sentence `//` WHY lines (Redis rejects EX 0; no await → atomic); controller `// rotate: blacklist old refresh token` (WHAT) replaced by a WHY line; no issue refs |
| pdf-export-standard | n/a — no export code touched |

## Noticed, not done
- Behavior note: a Redis write ERROR during refresh now fails closed (403, user must log in again) instead of the old behavior (rotation proceeded with the old token silently not blacklisted). Deliberate — the alternative is exactly the double-mint this node closes.
- In-memory fallback is atomic per process only; multi-instance deploys need Redis for cross-instance atomicity (unchanged limitation, same as the rest of the blacklist).
- `addToBlacklist`'s `rotatedAt` param is now only used by tests; left as-is (SmallestDiff).

## Seal gate
none — no commit/push. Issue #262 created + branch pushed by `gh issue develop` as `/todo` step 0 on operator's "fix all".
