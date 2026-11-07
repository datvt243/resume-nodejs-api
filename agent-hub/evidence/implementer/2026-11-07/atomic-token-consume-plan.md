# 2026-11-07 - atomic-token-consume (plan)

- Worker: implementer · Version: 0.1.0
- Node: `atomic-token-consume` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #385` — "Password-reset and email-verify tokens are not single-use under concurrency"

## Hub bytes before: 93048

## Feature doc: doctrine/features/auth-password-reset.md (Behavior #2 "single-use reset token"); also doctrine/features/auth-register-login.md (Behavior #4 "single-use email-verification token"). Operator answer: "Bug — #385". Fix restores the documented behavior — no doc edit.

## Anchors
- `src/utils/passwordReset.ts` `consumeResetToken` (Redis branch GET + DEL)
- `src/utils/emailVerification.ts` `consumeVerificationToken` (same)
- `redis@^4.6.0` client exposes `getDel` (`node_modules/@redis/client/dist/lib/cluster/commands.d.ts:321`)
- In-memory fallback: `get` + `delete` in one synchronous block — already atomic in single-threaded Node, untouched.
