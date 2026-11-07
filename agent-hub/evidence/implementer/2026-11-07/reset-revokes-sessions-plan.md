# 2026-11-07 - reset-revokes-sessions (plan)

- Worker: implementer · Version: 0.1.0
- Node: `reset-revokes-sessions` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #393` — "Password reset does not revoke existing sessions"

## Hub bytes before: 93048
(staging base, same as the earlier nodes this session — none of their branches is merged yet)

## Feature doc: doctrine/features/auth-password-reset.md

Behavior #4 changes per the operator's recorded answer ("Change: reset revokes all sessions — #393").

## Anchors
- `src/auth/auth.service.ts` `handlerResetPassword` (the issue names `authResetPassword` in the controller; the password write lives in this service, so the fix goes there, next to `updateOne`)
- `src/utils/sessionRevocation.ts` `invalidateAllSessions` (reused, as `authLogoutAll`)
- `src/__tests__/auth/auth.service.test.ts` `handlerResetPassword`
