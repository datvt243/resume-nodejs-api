# 2026-11-07 - logout-revokes-refresh (plan)

- Worker: implementer · Version: 0.1.0
- Node: `logout-revokes-refresh` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #391` — "Logout leaves the refresh token valid"

## Hub bytes before: 93048
(staging base, identical to the earlier nodes this session; measured after this node's diagram row was added: 93827 — the row itself is the difference)

## Feature doc: doctrine/features/auth-session-tokens.md

Behavior #7 changes per the operator's recorded answer ("Bug: revoke the refresh token too — #391").

## Anchors
- `src/auth/auth.controller.ts` `authLogout` (blacklists only `extractTokenFromRequest(req)`)
- `src/utils/helper-auth.ts` `extractTokenFromRequest(req, 'refreshToken')` — same lookup `authRefreshToken` uses
- `src/utils/tokenBlacklist.ts` `addToBlacklist` (TTL from the token's own `exp`; value `revoked`, so `getRotatedAt` → null and the refresh hits `isBlacklisted` → 401 `TOKEN_REVOKED`)
- `src/__tests__/auth/auth.controller.test.ts` `authLogout`
