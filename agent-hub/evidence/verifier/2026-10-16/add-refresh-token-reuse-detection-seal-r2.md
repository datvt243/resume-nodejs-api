# 2026-10-16 — add-refresh-token-reuse-detection (verifier verdict, round 2)

Worker: verifier (independent subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-refresh-token-reuse-detection` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row), GitHub issue #165
New PM status: **SEALED** (after 1 REOPEN)

## Isolation proof
This was a fresh Agent spawn, briefed as "Re-verify refresh-token reuse node (round 2)" (the round-2 verifier pass of `/todo #165`, after a REOPEN). The main session dispatched it. I have neither the implementer's context nor the first verifier's. I wrote nothing lasting under `src/`.

Before any run I took two snapshots: `git status --short` (`status0`) and a `shasum -a 256` of every file under `src/` (202 files, `src0.sha`). My only `src/` edits were temporary `jti` mutations of `src/auth/auth.controller.ts` and `src/auth/auth.service.ts`, made from scratchpad backups. After every probe `shasum -a 256 -c` printed `OK` for both files, and the backups were then deleted.

After the lint stash/pop and again after all probes:
- `git status --short` diffed against `status0`: `STATUS_IDENTICAL`
- the full `src/` checksum list diffed against `src0.sha`: `SRC_IDENTICAL`

## Reasoning
I read all four notes: the plan, diff round 1, the REOPEN, and diff-r2. I checked them against `git diff`.
- **Code.** Round 2 changed only tests: `refreshTokenReuse.test.ts` test 4, plus one assertion and one `//` in `auth.service.test.ts`. Production code is unchanged from round 1.
- **Files.** The `src/` file set matches round 1's table: 6 modified, 2 new tests. The other changes are `CLAUDE.md`, `README.md` and the diagram row.
- **Commands.** They match `doctrine/MEMORY.md`: `npm test`, `npm run build`, and the lint before/after delta via `git stash`.
- **Output.** Not truncated.
- **Controller.** I re-read it adversarially. `getRotatedAt` runs before `isBlacklisted`, `jwtVerify` and the logout-all check, so a rotated token always gets 403 and never mints. Within the grace window (`<= 10`) there is no verify and no revoke. An unverifiable token is not revoked. A token whose `iat` predates the last revocation is not re-revoked. The 403 body is the same `t('auth.refreshTokenRevoked')` as the logout branch.

### REOPEN items
| REOPEN item | Evidence |
|---|---|
| 1. The e2e same-second test must actually exercise the collision and FAIL without the controller `jti` | Test 4 now chains login → refresh → refresh in the same fake-clock second, then refreshes the newest token at +30s and expects 200 with a null marker. I mutated **only the controller** (`jti: (crypto.randomUUID(), undefined)`, which compiles under `noUnusedLocals`): `Tests: 2 failed, 45 passed, 47 total`. The 2 failures were the rewritten e2e test and the "returns 200 and rotates" unit test. The e2e test fails at line 94, `expect(second.data!.tokenRefresh).not.toBe(first.data!.tokenRefresh)`: the received token is byte-identical (`{"_id":"cand-fast","iat":1792141200,"exp":…}`, no `jti`). |
| 2. Cover the `handlerLogin` `jti` | `auth.service.test.ts` asserts that the 2nd `jwtSign` call has `data: { _id: 'user_id', jti: any String }`. I mutated **only the service**: `Tests: 1 failed, 46 passed, 47 total`, and the failure was "should login successfully with correct credentials". With both sites mutated: 3 failed. After restore (checksums `OK`): `Tests: 47 passed, 47 total`. |
| 3. Correct the note's overclaim | diff-r2 has a "Correction to round 1's note" section and cites the mutation output. My independent probe agrees with that output, with finer granularity (per-site). |

### Acceptance criteria (plan + issue), spot-checked rather than taken from round 1
| Criterion | Evidence |
|---|---|
| 1. Rotation writes a rotated-at marker; `isBlacklisted` still true | `tokenBlacklist.ts` diff: same key and TTL, value `rotated:<s>` / mem `rotatedAt`. `tokenBlacklist.test.ts` (`describe.each` redis/in-memory) asserts read-back plus `isBlacklisted` true. PASS in my full run. |
| 2. Reuse > 10s → revoke all + 403, and the owner's newest pair is rejected (issue AC 1) | Unit test "revokes every session … past the grace window" (`invalidateAllSessions('user1')`, nothing minted). e2e test 1: the owner's access token is `isSessionRevoked` and the owner's refresh gets 403. PASS. |
| 3. Within 10s → 403 only; the newest pair works | Unit test "only rejects inside the grace window" (no `jwtVerify`, no revoke). e2e test 3 (marker null, newest refresh 200). PASS. |
| 4. Never mints; same response as the logout 403 | `expectRejectedWithoutMinting`. Unit test "answers a reused token exactly like a logged-out one" compares the `status`/`json` call arrays. PASS. |
| 5. Token predating the marker → no re-revoke | Unit test "already predates" (iat 1000 < 2000). e2e test 2 (marker unchanged, re-login refresh 200). PASS. |
| 6. Unverifiable reused token → 403, no revoke | Unit test "does not revoke when the reused token fails verification" (`next` not called). PASS. |
| 7. Normal rotation unaffected, including same-second rotations and the logged-out 403 (issue AC 2) | Rotate unit test, the existing blacklisted-403 test, and the rewritten e2e test 4. The `jti` mutation probe above proves test 4 now guards the owner against false-positive revocation. The happy path costs one extra marker read. |
| 8. End-to-end regression (issue AC 3) | `refreshTokenReuse.test.ts`: 4 tests on real `jwtSign`/`jwtVerify` and the real in-memory blacklist and session stores, with a fake clock. PASS. |
| 9. test / build / lint / docs | My re-run: `Test Suites: 42 passed, 42 total`, `Tests: 361 passed, 361 total`, TEST_EXIT=0, 0 `✕`. `npm run build` BUILD_EXIT=0, 0 `error TS`, ending in `cp -R ./src/views ./src/public ./dist/`. Lint: eslint JSON on the tree vs a `git stash push -u -- src` baseline, aggregated per file+ruleId: `lint before 276 after 276`, `delta lines 0`. Docs in `git diff`: CLAUDE.md (structure row, `/refresh` row, Auth Flow 4, 2 Security bullets, 3 test-table rows), the README `/refresh` row, and swagger (description + 403). |
| comments per code-comments.md | Round 2 added one `//` in `auth.service.test.ts`: a single-sentence WHY. The round-1 comments I re-read are fine. `tokenBlacklist.ts` has JSDoc on 2 exported functions. `auth.controller.ts` has a `/** */` WHY on `revokeOnRefreshTokenReuse` and two single-sentence `//` WHYs. `auth.service.ts` has one `//` WHY. The test overview JSDocs are fine. The diff adds no `(#N)` refs and no stacked `//`. The `issue #N` comments I grepped in auth tests are pre-existing lines, not part of this diff. No violation. |

Forbidden states: none hit.
- ADHOC_WORK: the node row is on the diagram.
- NO_EVIDENCE: plan, diff, diff-r2 and REOPEN notes exist.
- EDIT_UNVERIFIED: test, build and lint were re-run and match the notes, and the mutation claim was reproduced.
- CODE_IN_HAVEN: `find agent-hub/haven` for `.ts/.js/.py/.sh` returned 0.
- DIAGRAM_DRIFT: the row is now SEALED, updated in place at line 147 with no reorder (line count unchanged at 150).

Seal gate: nothing was committed or pushed. `HEAD` == `origin/165-refresh-token-rotation` == `3b274ab`, and `origin/staging..HEAD` is empty. My only external call was the read-only `gh issue view 165`.

Proportion (SmallestDiff): the change consists of one marker field on the existing blacklist entry, one helper, one early branch in the controller, `jti` at the 2 refresh sign sites (proven necessary), swagger, tests and docs. There is no new dependency and no Mongo change. Round 2 touched tests only.

Noted, not blocking:
- **CLAUDE.md Auth Flow step 2** still describes the payload as `{ _id: candidateId }`, but the refresh token now also carries `jti`. Step 4 does mention `jti`. This is a cosmetic doc nit.
- **Carried from round 1** (already recorded as Noticed by the implementer):
  - A logout with an already-rotated refresh token overwrites the `rotated:` marker with `revoked`.
  - There is a check-then-blacklist TOCTOU.
  - A client that retries more than 10s after a lost response revokes its own sessions. This is an accepted policy trade-off.

## Re-run
partial. I re-ran `npm test` (full), `npm run build`, and the eslint per-file/rule before/after delta via `git stash push -u -- src` (status and `src/` checksums identical after pop). I also reproduced the round-2 mutation claim independently and per site: controller only, service only, then both, with `jti: (crypto.randomUUID(), undefined)`, which still compiles under `noUnusedLocals`. I captured the e2e failure line and restored the files, proven by `shasum -c` OK, the full `src/` checksum diff and the `git status` diff. This was justified because the node changes the security-sensitive auth refresh path, and the previous round found a test that didn't test what it claimed.
