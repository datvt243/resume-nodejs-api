# 2026-08-29 — add-email-verification — verdict: SEAL

- Worker: verifier (subagent, dispatched via Agent tool, fresh session)
- Node: `add-email-verification` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED (was PENDING)
- GitHub issue: #71

## Reasoning (cited per criterion)

**Read the real diff directly, not just the note.** `git status --short`:
8 modified `src/` files + 1 new untracked file
(`src/utils/emailVerification.ts`) — matches the note's claimed file
list exactly, no undisclosed files. `git diff -- src/` (311 lines) read
in full.

**`handlerRegister` no longer trusts `CandidateModel.create()`'s return
value for `_id`.** Read `src/auth/auth.service.ts` end-to-end.
`await CandidateModel.create({...})` — return value is discarded (not
assigned). Immediately after: `const savedDocument = await
CandidateModel.findOne({ email });` then
`createVerificationToken(savedDocument._id.toString())`. Confirmed two
separate `CandidateModel.findOne({email})` calls now happen in
`handlerRegister` (1st inside `isEmailAlreadyExists`, 2nd the new
re-fetch).

**The `_id: null` bug claim is real, independently corroborated —
not just asserted in the note.**
1. `src/services/index.ts:208-215` — read the actual comment at
   `baseCreateDocument`: *"MODEL.create() (Mongoose giữ `_id: null` như
   đã truyền, thay vì id thật mà MongoDB gán khi lưu)"* — exists
   verbatim, matches what the implementer note quotes.
2. `git show HEAD:src/auth/auth.service.ts` (pre-diff) — the ORIGINAL
   `handlerRegister` had `const document = await CandidateModel.create(...)`
   where `document` was assigned but **never read again** anywhere in
   the function. This independently proves the bug was real but latent
   before this task (nothing previously consumed `document._id`) — this
   feature is what first needed a real `_id` out of `.create()`, which is
   exactly why it surfaced now. This is stronger evidence than the note's
   prose alone.
3. Confirmed this is a genuine SECOND, separate occurrence — not a
   duplicate/conflicting claim about the existing PENDING
   `fix-create-response-null-id` node. That node's scope is
   `src/candidate_profile/BaseService.ts`'s `handlerCreate` →
   `hookAfterSave` (confirmed by reading `BaseService.ts:22-30`, which
   calls `baseCreateDocument` from `services/index.ts` with a
   `hookAfterSave` callback whose reassignment bug is what that node
   tracks). `auth.service.ts`'s `handlerRegister` calls
   `CandidateModel.create()` directly — it never goes through
   `BaseService.ts` or `baseCreateDocument` at all. Same root-cause
   Mongoose quirk (passing `_id: null` explicitly), two genuinely
   different code paths. Not a conflict.
4. Live reproduction: NOT independently re-run (optional per task
   instructions) — static evidence above (matching pre-existing comment
   + proof the return value was previously unused + correct fix wiring)
   was judged sufficient corroboration for this unusual claim.

**`handlerVerifyEmail` is single-use and correct.** Read
`src/auth/auth.service.ts:84-91`:
`consumeVerificationToken(token)` → if null, fail with
`auth.verificationTokenInvalid`; else `CandidateModel.updateOne({_id:
candidateId}, {emailVerified: true})` → success. `consumeVerificationToken`
(`src/utils/emailVerification.ts:60-83`) deletes the Redis key /
in-memory entry on read regardless of validity — genuinely single-use.

**`handlerLogin` does NOT block on `emailVerified`.** Read
`src/auth/auth.service.ts:93-140` in full — zero early-return or
rejection branch tied to `emailVerified`. Only addition:
`email_verified: _user.emailVerified || false` inside the `user` object
of the existing success response. Matches the note's claimed operator
decision and the issue's own framing ("needs a product decision, not
just implementation").

**Controller + route match the issue's shape.** `src/auth/auth.controller.ts:159-173`
— `authVerifyEmail` reads `req.query.token` (string-only guard), calls
`handlerVerifyEmail`, returns 200/400 via the same `formatReturn` shape
every other auth controller uses. `src/routers/api/v1/auth.route.ts:287-309`
— `router.get('/verify-email', authVerifyEmail)`, Swagger doc block
present, matches issue #71's exact proposed `GET
/api/v1/auth/verify-email?token=...` path.

**`emailVerification.ts` genuinely mirrors `passwordReset.ts`.** Read
both files side by side (both ~86 lines). Identical shape: `crypto`-random
32-byte hex token, Redis-first (`isRedisAvailable()` /
`getRedisClient()`) with `Map`-based in-memory fallback, `setEx`/`get`+`del`
Redis calls, single-use consume-and-delete-on-read in both branches,
60s cleanup interval with `.unref()`, same try/catch/logger.error
shape. Only intentional differences: TTL (24h vs 15min, reasoned in
both the note and the code comment) and key prefix (`email-verify:` vs
`password-reset:`).

**Test file changes match the real code shape, not vacuous.** Read
`src/__tests__/auth/auth.service.test.ts` diff in full.
`handlerRegister` test: `CandidateModel.findOne` mocked with
`mockResolvedValueOnce(null)` then `mockResolvedValueOnce(mockSavedDoc)`
— matches the real two-call shape (existence check, then re-fetch);
asserts `CandidateModel.findOne` called 1st and 2nd with the right args
(`toHaveBeenNthCalledWith`), and asserts `createVerificationToken`
called with `'new_id'` (the re-fetched doc's `_id`) — not the
`_id: null` from the mocked `.create()` return. `handlerVerifyEmail`
tests: valid-token case asserts `consumeVerificationToken` called,
`CandidateModel.updateOne` called with the right filter/update, and the
success message; invalid-token case asserts `CandidateModel.updateOne`
is explicitly `not.toHaveBeenCalled()` — this is a real behavioral
assertion, not vacuous.

**Build.** Ran `npm run build` myself from repo root:
```
> nodejs-resume-api@1.1.0 build
> tsc && npm run copy

> nodejs-resume-api@1.1.0 copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, zero `tsc` errors.

**Tests — exact command from `doctrine/MEMORY.md` (`npm test`, from
`/Users/_david/Workspace/Project/ResumeAPI/backend`), run myself, own
verbatim output (tail):**
```
PASS src/__tests__/auth/auth.service.test.ts
  auth.service
    isEmailAlreadyExists
      ✓ should return true if email exists (2 ms)
      ✓ should return false if email does not exist
    handlerRegister
      ✓ should register successfully with new email (1 ms)
      ✓ should fail if email already exists
    handlerLogin
      ✓ should login successfully with correct credentials (1 ms)
      ✓ should fail if user not found
      ✓ should fail if password incorrect
    handlerForgotPassword
      ✓ creates a reset token when the email exists
      ✓ returns the same generic success message when the email does not exist (no user enumeration) (1 ms)
    handlerResetPassword
      ✓ updates the password when the reset token is valid
      ✓ fails without touching the password when the token is invalid/expired
    handlerVerifyEmail
      ✓ marks emailVerified true when the verification token is valid (1 ms)
      ✓ fails without touching the candidate when the token is invalid/expired

Test Suites: 10 passed, 10 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        4.278 s, estimated 6 s
Ran all test suites.
```
Matches the note's claimed `10 suites / 54 tests` exactly, no
truncation, no discrepancy. Baseline prior sealed node
(`add-public-profile-visibility-toggle`) was 52 — the +2 are exactly
the new `handlerVerifyEmail` cases.

**Matches issue #71 (`gh issue view 71`).** Proposal: `emailVerified:
boolean` (default `false`) on `Candidate` ✓; verification token +
`GET /api/v1/auth/verify-email?token=...` ✓; explicitly flags "should
login be blocked... needs a product decision" — resolved here as
"don't block," consistent with the issue's own framing that this
requires a product call rather than a unilateral implementation choice,
and consistent with the project's stated no-email-infra gap
(shared with #70, already the precedent for logging-instead-of-emailing
stub links).

**Forbidden states — all clear.**
- `ADHOC_WORK`: node exists on the diagram (added by implementer,
  correctly left PENDING for verifier to seal).
- `NO_EVIDENCE`: evidence note exists at the correct path.
- `EDIT_UNVERIFIED`: test/build output independently re-run by me,
  verbatim, matches the note's claims exactly.
- `CODE_IN_HAVEN`: `find agent-hub/haven -name '*.ts' -o -name '*.js'
  -o -name '*.sh' -o -name '*.py'` → empty, no code leaked into
  `haven/`.
- `DIAGRAM_DRIFT`: diagram row was PENDING before this verdict, matching
  the pre-seal code state — updating to SEALED now to match.

**`SmallestDiff` proportionality.** 8 modified files + 1 new file, each
necessary for "email verification token + endpoint + login exposure":
model field, new token-store util (mirrors existing pattern, no new
dependency), service handlers, controller, route + Swagger doc, 2 new
i18n keys (both languages, project already uses this pattern per the
sealed `feat-i18n-full-coverage` node), and the one test file. The
`_id: null` re-fetch workaround in `handlerRegister` is the one
justified exception — required for this feature to produce a real
`candidateId` for the verification token at all, not a drive-by
refactor; the actual root-cause fix stays out of scope and untouched
(`services/index.ts`/`BaseService.ts`, per the still-PENDING
`fix-create-response-null-id` node).

## Missing
None — every acceptance criterion has cited, independently-verified
evidence.
