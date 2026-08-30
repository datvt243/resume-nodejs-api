# 2026-08-25 — add-forgot-reset-password-flow (seal)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `add-forgot-reset-password-flow`
- New PM status: SEALED

## Deviation from default recipe (recorded, not hidden)

`recipes/verify_seal.md` step 2 says "Read the NOTE — only the note, do
NOT open the diff directly." The dispatching task for this run explicitly
instructed the opposite: read every changed/added `src/` file for real
and independently run `npm test` myself rather than trust the
implementer's pasted output. Treating the dispatch task as a
task-specific override of the recipe default (still `EvidenceOnly` in
spirit — real code and a real independently-run test, not inference).
Both the note's claims AND the actual `src/` diff were read this round;
citations below point to real file:line, not the note's prose.

## Reasoning

Step 1 (`NeverVerifyOwnWork`): fresh subagent, no prior session history
writing this diff. Proceeding.

Step 2/3: node `add-forgot-reset-password-flow` confirmed present as a
PENDING row in `haven/diagrams/dev-loop.prime-mermaid.md` before this
verdict (added by the implementer via the diagram's documented
"no node exists -> DRAFT node" path, not ad-hoc).

Step 4: command is `npm test`, verbatim match to `doctrine/MEMORY.md`'s
Test row (`npm test`, run from
`/Users/_david/Workspace/Project/ResumeAPI/backend`).

Step 5 (truncation scan on my own run): I ran `npm test` myself from
repo root. My own captured output lists all 9 suites in full with every
individual test line, no `...` and no "truncated" anywhere. (Note: the
implementer's own pasted note *does* contain a `...` elision between the
auth-service test block and the summary — under the default recipe that
would be a truncation red flag. Per the task's explicit instruction I
did not rely on the note's output at all; I ran the command myself and
the totals below are from my own untruncated run, which resolves the
concern.)

## My own verbatim `npm test` output (tail + full auth-service block)

```
PASS src/__tests__/auth/auth.service.test.ts
  auth.service
    isEmailAlreadyExists
      ✓ should return true if email exists (3 ms)
      ✓ should return false if email does not exist
    handlerRegister
      ✓ should register successfully with new email (1 ms)
      ✓ should fail if email already exists
    handlerLogin
      ✓ should login successfully with correct credentials (1 ms)
      ✓ should fail if user not found
      ✓ should fail if password incorrect
    handlerForgotPassword
      ✓ creates a reset token when the email exists (1 ms)
      ✓ returns the same generic success message when the email does not exist (no user enumeration)
    handlerResetPassword
      ✓ updates the password when the reset token is valid
      ✓ fails without touching the password when the token is invalid/expired
...
Test Suites: 9 passed, 9 total
Tests:       49 passed, 49 total
Snapshots:   0 total
Time:        3.996 s, estimated 6 s
Ran all test suites.
```

All 9 suites ran and passed (`requestLogger`, `rateLimit`, `mongo.db`,
`valid`, `auth.service`, `refreshToken`, `verifyToken`, `bcrypt`,
`auth.controller`) — no failures anywhere, matches the implementer's
claimed baseline of 45 pre-existing + 4 new = 49. No regressions.

Also independently ran `npx tsc --noEmit` from repo root (extra rigor,
not the required gate) — zero output, zero type errors.

Step 6 (acceptance criteria, verified against real `src/` code, not just
the note):

1. **`POST /api/v1/auth/forgot-password` exists, validates `email`,
   identical response regardless of whether the email exists** —
   `src/routers/api/v1/auth.route.ts:155` (`router.post('/forgot-password',
   authForgotPassword)`); `src/auth/auth.controller.ts:158-184`
   (`authForgotPassword` validates with `schemaForgotPassword`, calls
   `handlerForgotPassword`, returns its `{success, message}` verbatim);
   `src/auth/auth.service.ts:111-120` — `handlerForgotPassword` always
   `return { success: true, message: t('auth.forgotPasswordRequested',
   lang) }` on both the found-user and not-found-user paths (the only
   branch is whether `createResetToken`/`logger.info` run inside the
   `if (user && user._id)` block; the return statement is outside and
   identical either way). Confirmed by my own test run:
   `handlerForgotPassword` tests "creates a reset token when the email
   exists" and "returns the same generic success message when the email
   does not exist (no user enumeration)" both pass, and the second
   asserts `expect(createResetToken).not.toHaveBeenCalled()`
   (`src/__tests__/auth/auth.service.test.ts:159-166`). OK.

2. **`POST /api/v1/auth/reset-password` exists, validates
   `token`+`password`+`repassword` match, single-use token, bcrypt-hashes
   the new password** — `src/routers/api/v1/auth.route.ts:187`;
   `src/auth/auth.validate.ts:51-60` `schemaResetPassword` requires
   `token`, reuses the shared `password` schema, and
   `.with('password', 'repassword')` plus `Joi.ref('password')` on
   `repassword` enforces the match; `src/auth/auth.service.ts:131-141`
   `handlerResetPassword` calls `consumeResetToken(token)` first (fails
   closed with `resetTokenInvalid` if null), then
   `bcryptGenerateSalt(password)`, then `CandidateModel.updateOne({_id:
   candidateId}, {password: bcryptPwd})`. Single-use: verified directly
   in `src/utils/passwordReset.ts:59-83` — Redis branch does `redis.get`
   then unconditionally `redis.del` on the same call if found
   (line 66-67); in-memory branch does `memoryStore.delete(token)`
   unconditionally right after the `.get()` (line 73-74), before even
   checking expiry — token is consumed exactly once whether the outcome
   is valid, invalid, or expired, matching the plan's claim. Test
   confirms behaviorally too:
   `src/__tests__/auth/auth.service.test.ts:169-192`. OK.

3. **No real email actually sent anywhere (stub, operator-approved)** —
   `grep -rniE "sendmail|transporter|smtp|nodemailer" src/` → zero
   matches. `grep -iE "nodemailer|smtp|sendgrid|ses|resend|postmark"
   package.json` → only a false-positive substring hit inside
   `express-session`/`@types/express-session` (contains "ses"), no real
   mail dependency. `src/auth/auth.service.ts:116` only calls
   `logger.info(...)` with the reset link — no network call. This is the
   explicit, approved scope per
   `evidence/implementer/2026-08-25/forgot-password-reset-flow-plan.md`
   (operator decision recorded there) — correct, not a defect. OK.

4. **Reset-token store follows the `tokenBlacklist.ts` Redis+mem-fallback
   TTL pattern** — direct side-by-side read of
   `src/utils/passwordReset.ts` vs `src/utils/tokenBlacklist.ts`: both use
   `isRedisAvailable()`/`getRedisClient()`, `redis.setEx` with a TTL
   constant, an in-memory `Map<string, Entry>` fallback, a `setInterval`
   cleanup job with `.unref()` so it doesn't hold the process open (same
   comment verbatim: "do not keep node process alive for tests"). Actual
   structural match, not just claimed. OK.

5. **`user._id` guarded before `.toString()`** —
   `src/auth/auth.service.ts:114-115`: `if (user && user._id) { const
   token = await createResetToken(user._id.toString()); ...}` — guard is
   real, matches the note's claim. OK.

6. **`npm test`: all tests pass** — my own independently-run output
   above: `Tests: 49 passed, 49 total`, `Test Suites: 9 passed, 9 total`,
   zero failures. OK.

7. **i18n keys added both languages** —
   `src/locales/en.ts:19-21` and `src/locales/vi.ts:19-21`: both define
   `forgotPasswordRequested`, `resetTokenInvalid`,
   `resetPasswordSuccess`. OK.

Step 7 (5 forbidden states):
- `ADHOC_WORK` — no; node exists on the diagram (added via the
  documented DRAFT-node path after the plan note established the
  operator decision), work happened inside the implementer loop.
- `NO_EVIDENCE` — no; both a plan note and a diff note exist under
  `evidence/implementer/2026-08-25/`.
- `EDIT_UNVERIFIED` — no; I personally ran `npm test` and pasted my own
  verbatim output above, not inferred from the note.
- `CODE_IN_HAVEN` — no; `src/utils/passwordReset.ts` and all other diff
  files live under `src/`, nothing runnable was written under `haven/`.
- `DIAGRAM_DRIFT` — no; node is PENDING going into this verdict (correct
  — not yet sealed) and is being moved to SEALED by this same verdict,
  which is the only party allowed to change it (verifier owns PM status
  per `doctrine/MEMORY.md`).

Step 8 (SEAL gate): implementer's note records "No outward-facing action
(no commit/push) — nothing to gate yet." Confirmed by `git status
--short` — all changes are uncommitted working-tree edits, nothing
pushed. N/A, correctly so.

Step 9 (proportionality / `SmallestDiff`): `git diff --stat` — 8 files,
248 insertions / 4 deletions, all directly scoped to the two new
endpoints (route + controller + service + validate + new token-store
util + 2 locale files + 1 test file) plus the diagram PM row. No
unrelated refactor. The two "noticed, not done" items in the implementer
note (pre-existing 401-vs-400 quirk on `/register`/`/login`; no
`/forgot-password`-specific rate limit beyond the router-wide
`authLimiter`) are correctly left untouched — fixing them would have
been scope creep.

## Minor observation (not a blocking gap)

No dedicated `auth.controller.test.ts` cases were added for
`authForgotPassword`/`authResetPassword` (only `auth.service.test.ts`
gained tests) — other controller functions like `authRegister`/
`authLogin` do have controller-level tests. I read
`src/auth/auth.controller.ts:158-215` directly: both new controller
functions use the exact same `validateSchema` → handler → `formatReturn`
shape already covered by controller tests for `authRegister`/
`authLogin`, and I traced the wiring is correct by inspection. Flagging
for a future node if stricter controller-test parity is wanted; not
severe enough to REOPEN since the underlying logic is directly verified
by real code reading, not inference, and the service-layer behavior it
delegates to is fully tested.

## Verdict

**SEAL.** Every acceptance criterion has real, cited evidence from
reading the actual `src/` diff (not just the implementer's prose), an
independently-run and fully untruncated `npm test` shows 49/49 passing
across all 9 suites with the exact +4 new tests claimed, `tsc --noEmit`
is clean, no email is actually sent anywhere (confirmed by grep, correct
per the operator's approved stub scope), the reset-token store is a real
structural match to the existing `tokenBlacklist.ts` pattern, tokens are
consumed unconditionally on read (single-use), the new password is
bcrypt-hashed, and no forbidden state was hit. Diagram PM status updated
PENDING → SEALED.
