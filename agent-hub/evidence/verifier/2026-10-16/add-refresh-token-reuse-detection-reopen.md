# 2026-10-16 — add-refresh-token-reuse-detection (verifier verdict)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-refresh-token-reuse-detection` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row), GitHub issue #165
New PM status: **unchanged (PENDING)** — REOPEN

## Isolation proof
This was a fresh Agent spawn, briefed as "Verify add-refresh-token-reuse-detection seal" (round 2 of `/todo #165`). The main session dispatched it after the implementer pass. I have none of that pass's context. I wrote nothing lasting under `src/`. Temporary mutation probes on `src/auth/auth.controller.ts` / `auth.service.ts` were made from scratchpad backups and restored: `shasum -a 256` matched the pre-probe hashes (`RESTORED_IDENTICAL`, after every probe). A temporary probe test `src/__tests__/auth/zzVerifierProbe.test.ts` was deleted (`ls` → "No such file"). `git status --short` was diffed against the snapshot taken before my first run at four points: after the lint stash/pop and after each of the 3 probes. All four were `STATUS_IDENTICAL`.

## Reasoning
I read both implementer notes and checked them against `git diff`. The diff table matches disk: 6 `src/` files plus 2 new test files, `CLAUDE.md`, `README.md`, and the diagram row (2 lines: the row plus a blank separator, the table's existing convention since line 118). The commands match `doctrine/MEMORY.md`. The output is not truncated, and the lint first pass (276→279) and its fix are recorded honestly.

Adversarial review of the controller:
- **Ordering.** `getRotatedAt` runs before `isBlacklisted` / `jwtVerify` / the logout-all check. Every rotated token returns 403 before anything is minted.
- **Grace.** `now - rotatedAt <= 10` → no verify, no revoke.
- **Repeat forced logouts.** These are blocked by `isSessionRevoked(iat, invalidatedAt)`. A stolen token was issued at least 10s before the revocation, so the strict `<` holds.
- **Unverifiable tokens.** No revocation.
- **Logout.** It still writes `revoked`, unchanged.
- **Payload shape.** The only consumer of refresh-token payloads is `authRefreshToken` (grep: `jwtVerify(…TOKEN_REFRESH)` appears only in `auth.controller.ts:109,154`), and it reads only `_id`/`iat`. Adding `jti` breaks nothing. `jwtSign` passes no `jwtid` option, so there is no jsonwebtoken conflict.

| Criterion | Evidence |
|---|---|
| 1. Rotation writes a rotated-at marker; `isBlacklisted` still true | `tokenBlacklist.ts` diff: same key/TTL, value `rotated:<s>` / mem `rotatedAt`. `tokenBlacklist.test.ts` (Redis fake + mem) PASS. Rotate unit test asserts `addToBlacklist('oldRefresh', Number)`. |
| 2. Reuse > 10s → revoke all + 403; owner's newest pair rejected (issue AC 1) | Unit "past the grace window" and e2e test 1 PASS in my re-run. |
| 3. Within 10s → 403 only; newest pair works | Unit "inside the grace window" and e2e test 3 PASS. |
| 4. Never mints; same response as logout 403 | `expectRejectedWithoutMinting` + "exactly like a logged-out one" (status + json calls equal) PASS. Code returns the same `t('auth.refreshTokenRevoked')`. |
| 5. Old token predating the marker → no re-revoke | Unit "already predates" + e2e test 2 PASS. |
| 6. Unverifiable token → no revoke | Unit "fails verification" PASS. |
| 7. Normal rotation unaffected (issue AC 2) — **incl. no false-positive revocation of the legit owner** | **NOT PROVEN for the `jti` part — see REOPEN reason.** Single-hop rotation and the logged-out 403 PASS. |
| 8. End-to-end regression (issue AC 3) | `refreshTokenReuse.test.ts` exists and PASSES. Its 4th test does not test what the note claims (below). |
| 9. test / build / lint / docs | Re-run: `Test Suites: 42 passed, 42 total`, `Tests: 361 passed, 361 total`, TEST_EXIT=0. `npm run build` BUILD_EXIT=0, 0 `error TS`, ends in `cp -R ./src/views ./src/public ./dist/`. eslint JSON on tree vs `git stash push -u -- src` baseline: `lint before 276 after 276`, `delta lines 0`. Docs: CLAUDE.md (structure, `/refresh` row, Auth Flow 4, 2 Security bullets, test table) and README `/refresh` row, plus swagger description/403, all in `git diff`. |
| comments per code-comments.md | `tokenBlacklist.ts`: JSDoc WHY on 2 exported functions. `auth.controller.ts`: `/** */` WHY on `revokeOnRefreshTokenReuse` and single-sentence `//` WHYs (no-oracle, `jti`). `auth.service.ts`: one `//` WHY. Tests: overview JSDoc + one `//`. No `(#N)`, no stacked `//`. No violation. |

## REOPEN reason (EvidenceOnly — a claimed proof is contradicted by real output)
The note's "Found while implementing" section justifies `jti` and states it is "covered by the e2e test 'issues a distinct refresh token even within the same second'". **That test does not cover it.**

**Mutation probe.** I neutralised `jti` at both sign sites (`jti: (crypto.randomUUID(), undefined)`, which leaves the payload byte-equal to `{ _id }` and keeps `crypto` used). I then ran `npx jest src/__tests__/auth`: `Tests: 1 failed, 46 passed, 47 total`. The only failure was the mocked unit assertion "returns 200 and rotates tokens on valid refresh" (`jwtSign` called with `jti`). The cited e2e test still **passes**. Its login helper signs `jti: login-<ms>`, so the first rotation can never collide with it. The `handlerLogin` `jti` site has **no test at all**: the grep for `jti` in `__tests__` shows only that one mocked assertion.

**The justification itself holds** (so `jti` is necessary, not a drive-by — SmallestDiff is fine). A temporary probe chained two refreshes in the same second, then refreshed again 30s later:
- REAL: `{"a":200,"b":200,"bEqualsA":false,"c":200,"invalidated":null}`
- MUTATED (controller `jti` removed): `{"a":200,"b":200,"bEqualsA":true,"c":403,"invalidated":1792141230}`

Without `jti`, the legitimate owner is logged out of every device. That is exactly the regression this node most needs to guard against, and nothing in the suite would catch it.

**Required to SEAL:**
1. Make the e2e same-second test actually exercise the collision. For example, chain two refreshes inside the same second (`refresh(original)` → `first`, `refresh(first)` → `second`, then `+30s` `refresh(second)` → 200 with `getSessionsInvalidatedAt` null), and show it FAILS with the controller `jti` removed.
2. Add coverage for the `handlerLogin` `jti`. Either assert that the refresh `jwtSign` call carries a `jti` in `auth.service.test.ts`, or show that two same-second logins give distinct refresh tokens.
3. Correct the note's claim and cite the mutation result.

Forbidden states: none hit.
- ADHOC_WORK: the node row is on the diagram.
- NO_EVIDENCE: both notes exist.
- EDIT_UNVERIFIED: commands were re-run and match. The gap is a mis-cited test, which is handled as the REOPEN reason.
- CODE_IN_HAVEN: `find agent-hub/haven` for `.ts/.js/.py/.sh` found nothing.
- DIAGRAM_DRIFT: the row is PENDING, correctly, while the work is unsealed.

Seal gate: nothing was committed or pushed. `HEAD` == `origin/165-refresh-token-rotation` == `3b274ab` (base), and `origin/staging..HEAD` is empty. My only external call was the read-only `gh issue view 165`.

Noted, not blocking (no action needed for this node):
- **Accepted policy trade-off.** A client that retries a refresh more than 10s after a lost response will revoke all its own sessions.
- **Logout overwrite.** `/auth/logout` called with an already-rotated refresh token overwrites `rotated:` with `revoked` and so turns off detection for that token. The attacker still can't mint with it.
- **Implementer's noted TOCTOU.** Also recorded by the implementer; it stands.

## Re-run
partial. I re-ran `npm test`, `npm run build`, and the eslint before/after comparison via `git stash push -u -- src` (status identical). I added `jti` mutation probes and a same-second chained-refresh probe, all restored or deleted with checksum and status proof. This was justified because the node changes the security-sensitive auth refresh path, which can force a logout of all sessions.
