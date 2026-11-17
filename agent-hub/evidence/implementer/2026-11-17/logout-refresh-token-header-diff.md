# 2026-11-17 - logout-refresh-token-header (diff)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `logout-refresh-token-header`
Task: `/todo #475` — "Logout still leaves the refresh token valid: refreshToken lookup returns the Authorization header"
Branch: `fix/475-logout-refresh-token` (from `staging` @ 7bb612f)
Status: sealed_pending_verifier

## Hub bytes before: 97847
## Feature doc: agent-hub/doctrine/features/auth-session-tokens.md
## Feature doc changed: Behavior #7 "refresh token sent with the request (header/body/query/cookie `refreshToken`, if any)" → "(body/query/cookie `refreshToken`, if any — never the `Authorization` header, which carries the access token on logout)"; Changelog row 2026-11-17 added — operator: "Logout only (Recommended)" (see plan note)

## Diff
| File | Why |
|---|---|
| `src/utils/helper-auth.ts` | `extractTokenWithSource` + `extractTokenFromRequest` gain trailing `allowHeader = true`; false → header ignored. Defaults keep every existing caller identical. |
| `src/auth/auth.controller.ts` | `authLogout`: refresh lookup → `extractTokenFromRequest(req, 'refreshToken', false)` + 1-line why comment. `authRefreshToken` (line 128) untouched. |
| `src/__tests__/auth/auth.controller.test.ts` | "also blacklists the refresh token sent with the request": now runs the REAL helper (`jest.requireActual`) on a request with `Bearer access_token` header + body `refreshToken`; asserts both blacklisted and exactly 2 calls. The old mock returned per-fieldName values, which is why it never caught the bug. |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | PENDING node added |
| `agent-hub/doctrine/features/auth-session-tokens.md` | Behavior #7 + Changelog (operator-approved) |

## Command
- `npx jest src/__tests__/auth/auth.controller.test.ts -t "authLogout"` (fixed, then with the controller line reverted → red check)
- `npm test`
- `npm run build` (Typecheck row: inside Build)
- `npm run lint`; `npx eslint <3 touched files>` on branch and on base via `git stash`

## Output
Fixed:
```
      ✓ also blacklists the refresh token sent with the request
Tests:       13 skipped, 7 passed, 20 total
```
Controller line reverted to `extractTokenFromRequest(req, 'refreshToken')` (red check, then restored):
```
      ✕ also blacklists the refresh token sent with the request (2 ms)
    Expected: "refresh_token"
Tests:       1 failed, 13 skipped, 6 passed, 20 total
```
`npm test`:
```
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 72 passed, 72 total
Tests:       781 passed, 781 total
Snapshots:   0 total
Time:        15.415 s
Ran all test suites.
```
`npm run build`:
```
> resume-nodejs-api@2.8.0 copy
> cp -R ./src/public ./dist/

build exit=0
```
`npm run lint`:
```
✖ 274 problems (274 errors, 0 warnings)
  20 errors and 0 warnings potentially fixable with the `--fix` option.
```
Touched files, branch: `✖ 23 problems (23 errors, 0 warnings)` · base (`git stash`): `✖ 23 problems (23 errors, 0 warnings)`

## Acceptance
| Criterion | Evidence |
|---|---|
| Logout with Bearer access + body refreshToken blacklists both (real helper, red on old code) | "✓ also blacklists the refresh token sent with the request" fixed; "✕ … Expected: \"refresh_token\"" with old line |
| `npm test` green | "Tests: 781 passed, 781 total" |
| Typecheck (inside Build) | `npm run build` → "build exit=0" |
| Lint ≤ baseline, no new in touched files | "274 problems" = baseline 274; touched files 23 on base = 23 on branch (pre-existing, unchanged lines) |
| Matches Behavior #7 (amended); #5 unchanged | `authRefreshToken` line 128 still `extractTokenFromRequest(req, 'refreshToken')`; refreshToken*.test.ts (Bearer refresh) pass inside the 781 |
| comments per code-comments.md | `auth.controller.ts`: `// Header skipped: on logout it carries the access token, not the refresh token.` (1-sentence WHY, `//` in body); `helper-auth.ts`: JSDoc `@param allowHeader` on exported fn; test: `// Real lookup: a mocked one hid that the header shadowed body \`refreshToken\`.` (WHY). No issue refs, no history. |

## Supersedes: none
(`grep "#475"` on the active diagram → only this node)

## Review
`/code-review medium` + `/security-review` done inline (touched files in full + callers):
- `verifyToken.middleware.ts:20` passes 3 args → `allowHeader` default true, unchanged. `csrf.middleware.ts:17` 2 args → unchanged; `/logout` uses `verifyCsrf('token')`, so a Bearer-header logout still skips CSRF (header can't be forged cross-site) and a cookie-only logout is still CSRF-checked.
- Logout with Bearer header + refresh only in cookie: now blacklists the cookie refresh token too (before: access token twice). Intended.
- Query `refreshToken` still read on logout (doc #7 lists query): only enables blacklisting a token the caller already holds — no escalation.
- No correctness/security findings.

## Noticed, not done
- `npm test` prints "A worker process has failed to exit gracefully" (pre-existing open handle, not from this diff).
- Root `.claude/rules/api.md` auth flow step 5 says logout blacklists only "token" — doesn't mention the refresh token at all; left as-is (pre-existing doc gap, not changed by this diff).

## Seal gate
No outward-facing action (no commit/push). Operator approval recorded for the feature-doc edit (plan note).
