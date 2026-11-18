# 2026-11-18 - hide-password-select-false
Worker: implementer · Version: 0.1.0 · Node: `hide-password-select-false` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING, row added this pass on branch `refactor/459-hide-password-select`) · Issue: #459
Task: `#459 Candidate model: hide password at schema level (select: false) — password in src/models/candidate.model.ts:25 returned by default; set select:false and opt in with .select('+password') only where compared/updated (login, change/reset password). Acceptance: every query path needing the hash uses +password; login/reset still work; test: plain CandidateModel.findById() result has no password.`

## Hub bytes before: 97857

## Feature doc: doctrine/features/auth-register-login.md
Behavior #5/#6 (login: wrong password and unknown email → same 401; success → 200 with tokens) — unchanged by this diff; the 4 `handlerLogin` tests that encode it stay green. Password reset (`auth-password-reset.md`) writes via `updateOne` and never reads the hash — no code change there.

## Acceptance criteria clarified
Issue: "every query path that needs the hash uses `+password`" → grep of every `password` read in `src/` (non-test): the only reader of the hash is `handlerLogin` (`src/auth/auth.service.ts:99-100`, `bcryptCompareHash`). Reset (`auth.service.ts:162`) is `updateOne` (write, needs no select). No change-password endpoint exists. Node criteria rewritten with exact test commands (see diagram row).

## Diff
| File | Why |
|---|---|
| `src/models/candidate.model.ts` | `password` gets `select: false` + 1-line `//` WHY comment |
| `src/auth/auth.service.ts` | `handlerLogin`: `CandidateModel.findOne({ email }).select('+password')` — the only hash reader |
| `src/__tests__/auth/auth.service.test.ts` | `handlerLogin` mocks now chain `.select` (`mockLoginFind` helper, 4 call sites) + asserts `select('+password')` on the success test |
| `src/__tests__/models/candidatePassword.test.ts` | New: spies `CandidateModel.collection.findOne`, runs the real Mongoose query pipeline: plain `findById()` sends `projection: { password: 0 }`; `.select('+password')` does not exclude it |

Left as-is on purpose (`SmallestDiff`, now redundant but harmless defense in depth): `candidate.service.ts:60,68` `.select('-password')`, `candidate_me/index.ts:171` `delete dataResult.password`.

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (per `doctrine/MEMORY.md`):
- `npx jest src/__tests__/auth/auth.service.test.ts src/__tests__/models/candidatePassword.test.ts`
- `npm test`
- `npm run build` (Typecheck row = `inside Build`)
- `npm run lint`, plus `npx eslint <touched files> -f json` on this branch vs `git stash` (staging)
- Negative check: `select: false` temporarily removed via `sed`, `npx jest src/__tests__/models/candidatePassword.test.ts`, then restored (`grep -n "select: false"` confirms line 26)

## Output
Targeted:
```
    ✓ is excluded from a plain findById() unless selected with +password (5 ms)

PASS src/__tests__/auth/auth.service.test.ts
  auth.service
    isEmailAlreadyExists
      ✓ should return true if email exists (3 ms)
      ✓ should return false if email does not exist
    handlerRegister
      ✓ should register successfully with new email (1 ms)
      ✓ should fail if email already exists (1 ms)
    handlerLogin
      ✓ should login successfully with correct credentials (1 ms)
      ✓ should fail if user not found
      ✓ should fail if password incorrect
      ✓ localizes the invalid-credentials message to the request lang
    handlerForgotPassword
      ✓ creates a reset token when the email exists
      ✓ returns the same generic success message when the email does not exist (no user enumeration)
    handlerResetPassword
      ✓ updates the password when the reset token is valid
      ✓ fails without touching the password when the token is invalid/expired (1 ms)
    handlerVerifyEmail
      ✓ marks emailVerified true when the verification token is valid
      ✓ fails without touching the candidate when the token is invalid/expired

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        2.841 s
```
Negative check (fix removed):
```
    ✕ is excluded from a plain findById() unless selected with +password (5 ms)
Tests:       1 failed, 1 total
```
After restore: `26:    password: { type: String, default: '', select: false, required: [false, 'Password is required'] },`

`npm test` (tail):
```
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 73 passed, 73 total
Tests:       784 passed, 784 total
Snapshots:   0 total
Time:        20.274 s
Ran all test suites.
```
`npm run build` (tail):
```
> resume-nodejs-api@2.9.0 copy
> cp -R ./src/public ./dist/

build exit 0
```
`npm run lint` (tail):
```
✖ 274 problems (274 errors, 0 warnings)
  20 errors and 0 warnings potentially fixable with the `--fix` option.
```
Touched files, this branch (`file line rule`):
```
src/__tests__/auth/auth.service.test.ts 47 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 84 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 86 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 92 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 136 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 206 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 232 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 247 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 260 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 273 @typescript-eslint/unbound-method
```
Same files on staging (stash):
```
src/__tests__/auth/auth.service.test.ts 47 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 84 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 86 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 92 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 129 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 198 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 224 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 239 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 252 @typescript-eslint/unbound-method
src/__tests__/auth/auth.service.test.ts 265 @typescript-eslint/unbound-method
```
Same 10 pre-existing errors, lines after 108 shifted by +7/+8 (the added helper/assert); 0 in `candidate.model.ts`, `auth.service.ts`, `candidatePassword.test.ts`.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) login reads the hash via `+password`; login still works | `auth.service.ts:95` diff; `handlerLogin` 4/4 ✓ incl. `expect(select).toHaveBeenCalledWith('+password')`; "Tests: 15 passed, 15 total" |
| reset still works | `handlerResetPassword` 2/2 ✓ (same run); writes via `updateOne`, no read |
| (2) plain `findById()` has no `password` | `candidatePassword.test.ts` ✓; red without the fix ("Tests: 1 failed, 1 total") |
| (3) full suite + typecheck | "Tests: 784 passed, 784 total"; build exit 0 |
| lint ≤ baseline, none new in changed files | 274 = baseline 274; touched-file errors identical set to staging (above) |
| comments per code-comments.md | 1 `//` WHY in `candidate.model.ts:25` (why hidden + how to opt in, no issue ref); 1 `//` WHY in test helper (why the mock chains). Nothing else touched |

## Review
`/code-review medium` + `/security-review` (label `security`) done inline — touched files in full + callers:
- Every Candidate write is `create`/`updateOne` with `$set` semantics (grep: no `replaceOne`/`findOneAndReplace`/`overwrite`/candidate `.save()`), so a doc loaded without `password` can never wipe the hash.
- `candidateQuerySafe` select allow-list (`utils/querySafe.ts:40-54`) has no `password`, so `handlerUpdate`'s `whitelistSelect(Object.keys(value))` cannot opt it back in from client input.
- v2 `/login` routes to the same `authLogin` → `handlerLogin`.
- Other `findOne` callers (`auth.service.ts:25,69,136`, `candidate_me` ats-check/index/search, `slug.ts`) never read `password` — they now just stop receiving it (strict improvement).
- No correctness/security findings.

## Supersedes: none
Only this row cites #459.

## Noticed, not done
- `haven/diagrams/dev-loop.prime-mermaid.md:63` still shows `fix-candidate-password-leak` (#152) as PENDING, while `dev-loop-archive.md:59` has it SEALED — stale active row; PM status is the verifier's call.
- Redundant `.select('-password')` (`candidate.service.ts:60,68`) and `delete dataResult.password` (`candidate_me/index.ts:171`) can be dropped in a later cleanup; kept here for SmallestDiff.
- Jest "worker process has failed to exit gracefully" warning — pre-existing, not from this diff.
