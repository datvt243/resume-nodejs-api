# 2026-10-16 — add-refresh-token-reuse-detection (implementer plan)

Worker: implementer · Version 0.1.0
Node: `add-refresh-token-reuse-detection` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended row, PENDING)
Task (verbatim): `#165 Refresh-token rotation family tracking (detect stolen/reused refresh tokens)` (via `/todo #165`; issue body is the full task)
Branch: `165-refresh-token-rotation` off `staging` @ `3b274ab`

## Hub bytes before: 233211
(measured with `/hub-tokens` per-session formula BEFORE adding the diagram row and this note)

## Node selection
No existing node for #165 → new node appended at the END of the PM status table (AppendOnly). Slug names the behavior (reuse detection) rather than "family", since the operator chose candidate-wide revocation with no family claim.

## Operator decisions (AskUserQuestion, 2026-10-16) — the issue's open questions
1. Scope = **revoke all of the candidate's sessions** (`invalidateAllSessions`, same as logout-all) — matches the issue's acceptance text "every token issued before that moment". No `fam` JWT claim; storage = extend the existing blacklist entry (issue's preferred "reuse the Redis-backed approach, no Mongo schema change").
2. **10s grace, reject only**: reuse within 10s of the rotation → 403, no revocation (concurrent refresh from 2 tabs); later → revoke all.

## Interactions reviewed (issue asks)
- #134 CSRF: `/auth/refresh` is behind `csrf.middleware.ts`; this change sits after it inside the controller — unaffected.
- #155 expiry: rotation keeps signing with `TOKEN_EXP_IN`/`TOKEN_REFRESH_EXP_IN` unchanged.
- #74 logout-all: reused `invalidateAllSessions`/`getSessionsInvalidatedAt`/`isSessionRevoked` as-is.

## Acceptance
1. Rotation records a "rotated at" marker on the old refresh token (same blacklist entry/TTL; `isBlacklisted` still true for it).
2. Presenting a rotated token > 10s after its rotation → `invalidateAllSessions(candidateId)` + 403; every token issued before is then rejected (incl. the legit client's newest pair).
3. Within 10s → 403, no revocation; the newest pair keeps working.
4. A reused token never mints new tokens; response identical to the existing revoked 403 (no detection oracle).
5. A reused token whose `iat` already predates the candidate's invalidated-at marker → 403, no re-revocation (no repeated forced logout by an old stolen token).
6. Signature-invalid/expired reused token → 403, no revocation (candidate id not trusted).
7. Normal single-hop rotation unaffected (still 200, rotates, old token blacklisted); logged-out (plain blacklisted) refresh token still 403 without revocation.
8. End-to-end regression test: real `jwtSign`/`jwtVerify` + real in-memory `tokenBlacklist`/`sessionRevocation`, fake clock.
9. `npm test`, `npm run build`, lint delta 0; docs (CLAUDE.md Auth Flow/Security, README if it describes refresh); comments per code-comments.md.

## Code anchors
- `src/auth/auth.controller.ts:94-152` (`authRefreshToken`)
- `src/utils/tokenBlacklist.ts` (`addToBlacklist`, `isBlacklisted`, mem `Entry`)
- `src/utils/sessionRevocation.ts` (reused unchanged)
- tests: `src/__tests__/auth/refreshToken.test.ts`

## Blockers
none — commands in `doctrine/MEMORY.md` have no `<<FILL>>`.
