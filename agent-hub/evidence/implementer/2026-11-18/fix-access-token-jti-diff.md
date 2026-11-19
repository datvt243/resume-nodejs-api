# 2026-11-18 - fix-access-token-jti (diff)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-access-token-jti` · Task: `/todo "add jti to access tokens"` → issue #490 (label `bug`) · Branch: `fix/490-access-token-jti` (cut from `staging` @ de5fd4f)
Plan: `evidence/implementer/2026-11-18/fix-access-token-jti-plan.md`

## Hub bytes before: 98675

## Feature doc: doctrine/features/auth-session-tokens.md (Behavior #7, #2), doctrine/features/auth-register-login.md (Behavior #6)
Fix restores session Behavior #7 (logout blacklists *the token sent*, not another same-second session's token). register-login #6 ("each refresh token carries a unique `jti`") still holds — now every token does; additive, no contradiction → doc not edited.

## Acceptance criteria clarified
(2) before: "unit tests assert the access payload carries a `jti` at both sign sites (`auth.service.test.ts`, `refreshToken.test.ts`)" → after: "`jwtSign` unit test: same payload, same second → different tokens with distinct `jti` (`npx jest src/__tests__/utils/jwt.test.ts`), and the auth unit tests still pass (`npx jest src/__tests__/auth`)". Reason: `/code-review` finding #1 — the fix belongs once in the shared signer, so callers no longer build a `jti` and the per-site assertion no longer exists. Node row updated in place.

## Diff
| File | Why |
|---|---|
| `src/utils/jwt.ts` | `jwt.sign(data, secretKey, { expiresIn, jwtid: crypto.randomUUID() })` — every token gets a fresh `jti` claim; WHY comment moved here. |
| `src/auth/auth.service.ts` | `handlerLogin`: refresh payload back to `{ _id }` (jsonwebtoken throws if payload `jti` and `jwtid` are both set); old refresh-only comment + now-unused `crypto` import removed. |
| `src/auth/auth.controller.ts` | `authRefreshToken`: same as above for the rotated pair. |
| `src/__tests__/utils/jwt.test.ts` (new) | Same payload signed twice with `Date.now` pinned → tokens differ, same `iat`, distinct string `jti`, `_id` kept. |
| `src/__tests__/integration/auth.http.test.ts` | New: two `erin` logins with `Date.now` pinned only for the logins → tokens differ; logout phone → phone 401, laptop 200. 5th user registered; setup comment no longer claims tokens lack `jti`. |
| `src/__tests__/auth/auth.service.test.ts`, `refreshToken.test.ts` | Caller-side expectations now `data: { _id }` (jti asserted in `jwt.test.ts` instead). |
| `src/__tests__/auth/refreshTokenReuse.test.ts` | Helper stops passing its own `jti` to the real `jwtSign` (would now throw "payload already has a jti"). |
| `.claude/rules/api.md` | Auth flow steps 2 and 4: payload `{ _id: candidateId, jti }`, both tokens carry a fresh `jti`. |

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (copied from `doctrine/MEMORY.md`):
- `npx jest src/__tests__/integration/auth.http.test.ts src/__tests__/utils/jwt.test.ts src/__tests__/auth`
- `npm test`
- `npm run build` (Typecheck = `inside Build`); also `npx tsc --noEmit`
- `npm run lint`; per touched file `npx eslint <f>` vs `git show staging:<f> | npx eslint --stdin --stdin-filename <f>`
- Red-before check: `git stash push -- src/utils/jwt.ts` → `npx jest src/__tests__/integration/auth.http.test.ts src/__tests__/utils/jwt.test.ts` → `git stash pop`

## Output
Red-before (fix stashed, old `jwtSign`):
```
    ✕ gives every token its own jti, so the same payload signed in the same second never repeats (7 ms)
  ✕ logging out one session leaves another session signed in the same second working (459 ms)
Tests:       2 failed, 6 passed, 8 total
```
(earlier, pre-review shape, same red: `Expected: not "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YWZkNzMxYzk1YmQ2NTc1NmEyMjcyYzEiLCJpYXQiOjE3OTQ5OTQ5NzIsImV4cCI6MTc5NTU5OTc3Mn0.hc4v…"` — identical tokens, payload `{_id, iat, exp}` only)

Targeted (fix applied):
```
PASS src/__tests__/utils/jwt.test.ts
PASS src/__tests__/auth/v2AuthRoute.test.ts (5.136 s)
PASS src/__tests__/auth/auth.validate.test.ts
PASS src/__tests__/auth/tokenExpiry.test.ts
PASS src/__tests__/auth/auth.service.test.ts
PASS src/__tests__/auth/v1AuthRoute.test.ts (6.694 s)
PASS src/__tests__/auth/refreshToken.test.ts (6.869 s)
PASS src/__tests__/auth/refreshTokenReuse.test.ts (6.852 s)
PASS src/__tests__/auth/auth.controller.test.ts (6.983 s)
PASS src/__tests__/integration/auth.http.test.ts (11.081 s)
Test Suites: 10 passed, 10 total
Tests:       77 passed, 77 total
```
`npm test`:
```
Test Suites: 75 passed, 75 total
Tests:       792 passed, 792 total
```
Build / typecheck:
```
build exit 0
tsc exit 0
```
Lint:
```
✖ 273 problems (273 errors, 0 warnings)
src/utils/jwt.ts before=0 after=0
src/auth/auth.service.ts before=0 after=0
src/auth/auth.controller.ts before=19 after=19
src/__tests__/auth/auth.service.test.ts before=10 after=10
src/__tests__/auth/refreshToken.test.ts before=1 after=1
src/__tests__/auth/refreshTokenReuse.test.ts before=0 after=0
src/__tests__/integration/auth.http.test.ts before=0 after=0
src/__tests__/utils/jwt.test.ts new=0
```
(the error line ranges in the two touched files with errors are pre-existing — counts identical to `staging`; none on changed lines)

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) same-second logins → distinct tokens; logout one → other still 200 | `PASS src/__tests__/integration/auth.http.test.ts`; red-before `✕ logging out one session leaves another session signed in the same second working` |
| (2) `jwtSign` same payload/same second → distinct `jti`; auth unit tests pass | `PASS src/__tests__/utils/jwt.test.ts` (red-before `✕ gives every token its own jti…`); 9 `src/__tests__/auth` suites PASS, `Tests: 77 passed, 77 total` |
| (3) `npm test` + build green | `Tests: 792 passed, 792 total`; `build exit 0`, `tsc exit 0` |
| (3) lint ≤ 274, none new in changed files | `✖ 273 problems`; per-file before = after for every touched file, new test 0 |
| Feature doc session #7 restored | criterion (1) — logout revokes only the sent token |
| comments per code-comments.md | Added `//` WHY on `jwt.sign` (`src/utils/jwt.ts`); removed two caller comments that would be stale; test `//` comments explain the clock pin and one-user-per-flow; no `(#N)` refs. |

## Supersedes: none
`grep "#490"` on the active diagram → only this node. (`fix-refresh-token-expiry-unused` PENDING row is a different issue — `TOKEN_EXP_IN` usage — untouched.)

## Still open: none

## Review
`/code-review medium` (background fork), first pass on the per-call-site version — 0 correctness bugs, 4 findings:
1. `jti` added by hand at 4 call sites instead of once in `jwtSign` → **fixed** (moved into `jwtSign` via `jwtid`; callers, comments and tests adjusted; criterion 2 clarified above). Re-ran step 5 afterwards — Output above is the post-fix run.
2. `isSessionRevoked` uses `iat < invalidatedAt` (whole seconds) → a token minted in the same second as logout-all / theft revocation survives it → real, pre-existing, separate → `## Noticed, not done` #1.
3. Blacklist keyed on full JWT instead of `jti` → efficiency, out of scope → `## Noticed, not done` #2.
4. New integration test froze `Date.now` for the whole flow → **fixed** (`clock.mockRestore()` right after the two logins).
Not `security`-labeled → no `/security-review`. Second review pass not run on the moved version (diff is the same logic, one site; covered by the red-before/green-after tests).

## Noticed, not done
1. **Same-second revocation gap** — `src/utils/sessionRevocation.ts` `isSessionRevoked`: `iat < invalidatedAt` at second precision, so a token issued in the same second as logout-all (or a theft-triggered `invalidateAllSessions`) stays valid. Candidate fix: `iat <= invalidatedAt` (then decide how a login in that same second after logout-all is treated). Own issue/node suggested.
2. Blacklist key is the whole JWT (`blacklist:{token}`, Redis and in-memory Map); with a `jti` on every token it could key on `jti` (36 chars). Efficiency only.
3. Tokens issued before deploy have no `jti`; they still verify (nothing reads `jti`) and age out by `exp` — no migration needed.

## Seal gate
No outward-facing action (no commit/push). `gh issue create` (#490), `gh issue edit --add-label bug`, `gh issue develop` (branch) ran as `/todo` Step 0.
