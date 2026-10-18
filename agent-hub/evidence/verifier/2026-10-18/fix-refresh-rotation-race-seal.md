# 2026-10-18 — fix-refresh-rotation-race (verifier seal)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `fix-refresh-rotation-race` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row)
New PM status: **SEALED** (was PENDING)

## Isolation proof
Fresh Agent-tool spawn ("Verify fix-refresh-rotation-race seal") with no memory of the implementer pass. This spawn was given things the implementer pass did not have: an explicit adversarial checklist (node-redis v4 `set(..., { EX, NX })` typing/return value, no `await` between in-memory check and set, 403 indistinguishability, no other caller of the removed `addToBlacklist(refreshToken, now)`), and the instruction to audit the note against `git diff`. Independent mutations below were designed and run in this spawn only.

## Reasoning
Note-vs-disk: `git diff --stat` = 6 `src/` files (+102/-11) + 1 diagram line; matches the note's Diff table file-for-file and the content matches each "Why" cell.

| Criterion | Evidence (verified here) |
|---|---|
| 1. atomic `claimRotation` | `src/utils/tokenBlacklist.ts`: Redis `redis.set('blacklist:<t>', 'rotated:<s>', { EX: max(ttl,1), NX: true })` → `result === 'OK'`. Checked against installed `@redis/client` 1.6.1 (`redis` 4.7.1): `SET.d.ts` `SetOptions = SetTTL & SetGuards` accepts `{EX, NX: true}`; `SET.js` emits `SET key val EX n NX`; `transformReply(): RedisCommandArgument \| null` → 'OK' on set, null on NX miss. In-memory path: `memoryStore.get` → expiry check → `memoryStore.set` → `return true`, no `await` in between (sync within one tick). `catch` → `logger.error` + `false` (fail closed). Same key/value format as `addToBlacklist`, so `getRotatedAt`/`isBlacklisted` read it unchanged. Mutation A (insert `await Promise.resolve()` between check and set): util race test + e2e race test FAIL (2 failed/23). Mutation B (drop `NX: true`): util race + "refuses to claim already rotated/logged out" FAIL (redis variant). |
| 2. claim before signing; loser → same 403, no tokens | `auth.controller.ts:174-181`: claim precedes both `jwtSign` calls; loser returns `formatReturn({ statusCode: FORBIDDEN, success: false, message: t('auth.refreshTokenRevoked') })` — byte-identical shape/message to the rotated-reuse, blacklisted and logout-all 403s above it, so indistinguishable. Unit "returns 403 without minting…" asserts no `jwtSign`, no `res.cookie`, no `invalidateAllSessions`. Mutation D (controller ignores a lost claim): that unit + e2e race test FAIL (2 failed/32). |
| 3. concurrent same-token refresh → one 200, one 403 | e2e `refreshTokenReuse.test.ts` "mints exactly one new pair…" on real jwt + in-memory stores: statuses `[200,403]`, no session revocation, winner's token still refreshes. PASS on disk; fails under mutations A and D (and pre-fix per note). |
| 4. existing reuse/logout/logout-all unchanged | `grep addToBlacklist\|claimRotation src` (non-test): only remaining `addToBlacklist` caller is logout (`auth.controller.ts:305`, unchanged); the removed rotate call had no other dependants (`getRotatedAt` reads the same `rotated:<s>` value `claimRotation` writes). Pre-existing reuse tests only had `addToBlacklist` → `claimRotation` renamed in their not-called/called assertions. Full suite passes (below). |
| 5. npm test / build / lint delta 0 | Re-run here: `Tests: 384 passed, 384 total`, `Test Suites: 43 passed, 43 total`, TEST_EXIT=0; `npm run build` BUILD_EXIT=0 (tsc typecheck incl. the `set` options); `npx eslint . -f json` total 276 = documented baseline. Lint hits in touched files are all on unchanged lines (`tokenBlacklist.ts:51` pre-existing `catch (err)` in `addToBlacklist`; `refreshToken.test.ts:54` pre-existing `as any`; controller hits at 25-72/232-278, outside the 171-181 hunk). |
| comments per code-comments.md | JSDoc on exported `claimRotation` (WHY: single winner, fail closed); `//` one-sentence WHY lines (Redis rejects EX 0; no await → atomic; controller "claimed atomically before signing…" replacing a WHAT comment). No `(#N)` refs added. Compliant. |
| pdf-export-standard | n/a — no export code touched. |

Forbidden states: ADHOC_WORK no (node on diagram, own branch); NO_EVIDENCE no (plan + diff notes); EDIT_UNVERIFIED no (test/build/lint cited verbatim and reproduced); CODE_IN_HAVEN no (only `.md` touched under haven/); DIAGRAM_DRIFT no (row updated in this verdict).
Seal gate: no commit/push; issue #262 + branch created by `/todo` step 0 on operator's "fix all" — recorded in note. OK.
Proportion: smallest diff for the node — one new util, one call-site swap, tests. Note's "Noticed, not done" (fail-closed on Redis error, per-process in-memory atomicity) are accurate and acceptable.

## Re-run
partial — auth/security node (sibling-seal practice): full `npm test`, `npm run build`, full-repo lint count, plus 4 adversarial mutations (A non-atomic in-memory, B no NX, C attempted always-true claim → TS compile error under `noUnusedLocals`, not counted, D controller ignores lost claim). Every mutation restored; `shasum -c` OK for `src/utils/tokenBlacklist.ts` (c2270e77…) and `src/auth/auth.controller.ts` (a0d9cd76…).
