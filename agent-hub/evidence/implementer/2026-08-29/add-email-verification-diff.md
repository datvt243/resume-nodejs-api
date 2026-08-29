# 2026-08-29 — add-email-verification (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-email-verification` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): "#71" (GitHub issue #71 — Email verification on
  registration)

## Scope resolved (operator, via `AskUserQuestion`)
Issue #71 explicitly flags one open question as "needs a product
decision, not just implementation": should login be blocked until
verified? Given the project has no real email-sending infra (same gap as
#70 — verification link can only be logged, not delivered), blocking
login would lock out every real user in practice. Asked directly:
**Do NOT block login** — `emailVerified` is only exposed in the login
response for the frontend to act on (e.g. a banner), not enforced
server-side.

## Diff
| File | Why |
|---|---|
| `src/models/candidate.model.ts` | Added `emailVerified: { type: Boolean, default: false, required: false }`. |
| `src/utils/emailVerification.ts` (new) | `createVerificationToken`/`consumeVerificationToken` — single-use, 24h TTL, same Redis-with-in-memory-fallback pattern as `utils/passwordReset.ts` (24h chosen over password-reset's 15min: verifying an email is lower-stakes and users need more realistic time to check their inbox). |
| `src/auth/auth.service.ts` | `handlerRegister` — after creating the candidate, creates a verification token and logs the link (STUB, same as #70's `handlerForgotPassword` — no real mailer exists yet). `handlerVerifyEmail(token, lang)` (new) — consumes the token, sets `emailVerified: true`. `handlerLogin` — added `email_verified` to the returned `user` object (not blocking, per the operator decision above). |
| `src/auth/auth.controller.ts` | `authVerifyEmail` (new) — reads `req.query.token`, calls `handlerVerifyEmail`, same `formatReturn` shape as the other auth controllers. |
| `src/routers/api/v1/auth.route.ts` | `GET /verify-email` route + Swagger doc, matching the issue's exact proposed path. |
| `src/config/swagger.config.ts` | `emailVerified` added to the `Candidate` schema doc. |
| `src/locales/{vi,en}.ts` | `auth.verificationTokenInvalid`, `auth.emailVerifiedSuccess` — both languages. |
| `src/__tests__/auth/auth.service.test.ts` | Updated the existing `handlerLogin`/`handlerRegister` assertions for the new fields/re-fetch (see bug note below), added a `handlerVerifyEmail` describe block (valid token → `emailVerified: true`; invalid/expired token → no DB write). |

## Bug found and fixed while implementing (not pre-existing scope, but
blocking this feature)

`CandidateModel.create({ _id: null, email, password })` — the SAME
pattern `handlerRegister` already used before this task — keeps `_id:
null` on the **in-memory returned document**, instead of the real
ObjectId MongoDB actually assigns on insert. Confirmed **live**, not by
inspection: added temporary debug logging
(`document._id`, `.get('_id')`, `._doc._id`, full `JSON.stringify`) —
all four read `null` immediately after `.create()` resolved, on every
registration, while a `findOne({email})` for the exact same email
immediately afterward (or via a later login) reliably returned a real
ObjectId. This is the SAME root cause already documented in a comment in
`services/index.ts`'s `baseCreateDocument`:
> "Mongoose giữ `_id: null` như đã truyền, thay vì id thật mà MongoDB
> gán khi lưu" (Mongoose keeps `_id: null` as passed, instead of the
> real id MongoDB assigns on save)

— and already tracked by the PENDING `fix-create-response-null-id` node
on this diagram (that node's scope is specifically `BaseService.ts`'s
`hookAfterSave`; this is a second, independent occurrence of the same
Mongoose quirk in `auth.service.ts`, not something that node's fix would
have covered). **Fix**: `handlerRegister` now re-fetches by email
(`CandidateModel.findOne({email})`) right after `.create()` to get the
real `_id` before creating the verification token — same pattern
`isEmailAlreadyExists`/`handlerLogin` already use for lookups. Added a
matching `mockResolvedValueOnce` chain to the existing
`handlerRegister` test to cover the two-`findOne`-calls shape.

## Command
```
npm run build
```
Output: clean, `tsc && npm run copy` completed with no errors.

```
npm test
```
(run from `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied
verbatim from `doctrine/MEMORY.md`)

### Output (verbatim, tail)
```
Test Suites: 10 passed, 10 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        5.739 s, estimated 6 s
Ran all test suites.
```
Baseline before this task's tests: 52 (prior sealed
`add-public-profile-visibility-toggle-seal.md`). This run: 54 — the +2
are exactly the new `handlerVerifyEmail` describe block's two cases. The
existing `handlerRegister`/`handlerLogin` tests were UPDATED (not just
added-to) to match the new re-fetch call and the new `email_verified`
field — both changes are direct, expected consequences of this feature,
not scope creep (`SmallestDiff` still holds: no unrelated test touched).

## Manual live verification (`npm run dev`, real Mongo/Atlas, Redis falls
back to in-memory)

This is where the `_id: null` bug above was actually discovered — first
attempt showed register succeeding but NO `[emailVerification]` log line
at all (compared side-by-side against a real `[passwordReset]` log line
from the same running server, proving the logger itself wasn't the
issue). Debug logging pinned the exact cause; fixed; re-verified clean:

```
POST /api/v1/auth/register → success:true

# Fixed: verification link now actually logs
[emailVerification] Verification link for <email>: /verify-email?token=<token>

# Login works BEFORE verification (not blocked, per operator decision)
GET /api/v1/auth/login → success:true, data.user.email_verified: false

# Verify with the real logged token
GET /api/v1/auth/verify-email?token=<token> → {"success":true,"message":"Xác thực email thành công",...}

# Same token reused (single-use check)
GET /api/v1/auth/verify-email?token=<token> (again) → {"success":false,"message":"Token xác thực email không hợp lệ hoặc đã hết hạn",...}

# Login after verification — flag flipped, still not blocking
GET /api/v1/auth/login → success:true, data.user.email_verified: true
```

Cleaned up ALL throwaway test accounts created during this debugging
session (5 accounts with recoverable emails via self-delete, plus 1
account from an early debug attempt whose exact timestamp-suffixed email
wasn't captured in a shell variable — recovered it by trying a small
range of `date +%s` values around the log timestamp and logging in with
each until one succeeded, then self-deleted it too). Dev server stopped
afterward (`pkill -f "ts-node ./src/server.ts"`, confirmed port 3001
free). `git status --short src/public/` clean — no leftover generated
PDF files (this task's live tests didn't touch PDF export).

## Acceptance
| Criterion | Evidence |
|---|---|
| `Candidate.emailVerified` defaults to `false` | Model diff; live curl above — fresh account's login shows `email_verified: false` |
| Register creates a single-use verification token, logs the link (stub) | Live curl above — real `[emailVerification]` log line with a real token |
| `GET /api/v1/auth/verify-email?token=...` verifies and flips the flag, single-use | Live curl above — first call succeeds, second (reused) call fails with the invalid-token message |
| Login NOT blocked by `emailVerified=false` (operator decision) | Live curl above — login succeeds both before and after verification |
| `emailVerified` exposed to the frontend for its own decision | `handlerLogin`'s response now includes `email_verified` in `user` |
| `npm test` all pass, `npm run build` clean | Verbatim above — `Tests: 54 passed, 54 total` |

## Noticed, not done (out of scope)
- The `_id: null` Mongoose quirk is worked around locally in
  `handlerRegister` (this task needed a real `_id` to function at all)
  but NOT fixed at its root (`services/index.ts`'s `baseCreateDocument`,
  or the broader pattern of explicitly passing `_id: null` to `.create()`
  across the codebase) — that's the existing `fix-create-response-null-id`
  node's scope, still PENDING, untouched here.
- No dedicated `auth.controller.test.ts` case added for `authVerifyEmail`
  (only `auth.service.test.ts` gained tests) — same gap pattern already
  flagged for `authForgotPassword`/`authResetPassword` in the sealed
  `add-forgot-reset-password-flow` node; the underlying service-layer
  logic is fully tested, the controller is a thin, directly-inspectable
  pass-through.
- Real email delivery — same explicitly-deferred scope as #70, shared
  dependency the issue itself calls out.

## Seal gate
No outward-facing action yet (no commit/push) — `src/` diff shown above
(8 files modified + 1 new file `src/utils/emailVerification.ts`) for
operator review, per seal gate.

## Status
`sealed_pending_verifier`
