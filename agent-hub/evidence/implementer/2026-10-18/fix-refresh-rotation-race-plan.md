# 2026-10-18 — fix-refresh-rotation-race (implementer plan)

Worker: implementer · Version 0.1.0
Node: `fix-refresh-rotation-race` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended row, PENDING)
Task (verbatim, issue #262 title): `fix(auth): make refresh-token rotation atomic so concurrent reuse can't mint two pairs` (via `/todo`, operator said "fix all" after `/code-review` finding 3)
Issue: #262 · Branch: `262-fix-auth-make` off `staging` @ `995cd9c`. Previous node `fix-public-profile-deleted-and-bad-profile-id` (#261) SEALED and stashed (`261-fix-public-profile-sealed-pending-ship`) per doctrine branch-isolation rule; this node added fresh on its own branch.

## Hub bytes before: 236186

## Acceptance
1. New `claimRotation(token, rotatedAt)` in `src/utils/tokenBlacklist.ts`: Redis `SET blacklist:<t> rotated:<s> EX ttl NX` → true only on `OK`; in-memory: check-and-set with no `await` between; false if any live entry (rotated or logout) exists; errors → false (fail closed).
2. `authRefreshToken` uses the claim instead of `addToBlacklist(token, now)`, BEFORE signing; claim lost → same 403 `auth.refreshTokenRevoked`, no tokens signed.
3. Two concurrent refreshes with one token → exactly one 200, one 403 (e2e on real in-memory store); fails pre-fix.
4. Existing reuse-detection / logout / logout-all tests unchanged and passing.
5. `npm test`, `npm run build`, lint delta 0; comments per code-comments.md.

## Code anchors
- `src/auth/auth.controller.ts:136-175` (check → … → `addToBlacklist`)
- `src/utils/tokenBlacklist.ts` (`addToBlacklist` uses `setEx`; same key/value format reused)
- tests: `src/__tests__/utils/tokenBlacklist.test.ts` (Map-backed fake redis), `src/__tests__/auth/refreshToken.test.ts` (automocked blacklist), `src/__tests__/auth/refreshTokenReuse.test.ts` (e2e in-memory)

## Blockers
none
