# 2026-10-21 - fix-status-codes (SEAL)

- Worker: verifier (independent subagent via Agent tool)
- Node: `fix-status-codes` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row, updated in place)
- New PM status: SEALED

## Isolation proof
Spawned fresh via the Agent tool, task "Verify seal fix-status-codes", with a dispatch prompt carrying the verifier bundle (manifest, SOUL, verify_seal recipe). No implementation-session history. I graded only the implementer plan + diff notes, the node row, issue #276 and `API-STANDARD.md`. I did not open the diff.

## Reasoning
| Criterion (node row / issue #276) | Evidence in note | Verdict |
|---|---|---|
| (1) failed `/create` never 2xx (BaseController + generalInformation) | `BaseController.test.ts` "fnCreate answers a failed create with 400, never 201" + success-still-201; new `generalInformation.controller.test.ts` "a failed create answers 400, never 201" | OK |
| (2) validation → 400 (auth register/login, candidate update/patch, generalInformation update/patch) | `auth.controller.test.ts` both "should fail on validation error" assert 400; `candidate.controller.test.ts` PUT/PATCH "answers 400, not 401"; `generalInformation.controller.test.ts` PUT/PATCH | OK |
| (3) register 201 / duplicate 409 `EMAIL_EXISTS` | "should register successfully" asserts CREATED; new duplicate test via errorsMiddleware; `ErrorCode.EMAIL_EXISTS` added | OK |
| (4) one login-failure message, 401 `INVALID_CREDENTIALS` | `auth.service.test.ts` both cases expect the same vi message; controller test 401 `INVALID_CREDENTIALS`, no cookies, en fallback | OK |
| (5) refresh revoked/rotated/raced/predating logout-all → 401 `TOKEN_REVOKED` | `refreshToken.test.ts` `expectRevoked` on all sites + reuse==logout comparison; `refreshTokenReuse.test.ts` end-to-end, race `[200, 401]` | OK |
| (6) bulk all-fail → 400 `success:false`, `data.results`/`summary` kept | `BaseController.test.ts` asserts exact keys `data, errors, message, success` and summary `{2,0,2}`; partial success unchanged | OK |
| Envelope keys unchanged | Only the 3 rows that must carry an `errorCode` go through `errorsMiddleware`, the only existing writer of `errorCode`. `API-STANDARD.md` handler rule 1 says the middleware is the only place that writes errors, and its "Current deviations" table already lists that body. No new keys were introduced. The phase-5 `error: {…}` envelope is untouched. The loss of `data:null` on those 3 rows is in the release note | OK |
| Release note lists status changes | `## Release note` section, names both client issues | OK |
| `npm test` / `npm run build` (MEMORY.md cmds) | 47/47 suites, 426/426; build `tsc && npm run copy`, no `error TS`; intermediate 19-fail run disclosed and explained | OK |
| Lint ≤ baseline | `eslint .` json per-file vs staging: 276 = 276 after removing the 1 new finding (re-checked file, 0 problems) | OK |
| comments per `doctrine/standards/code-comments.md` | 2 blocks quoted: auth.service `//` one sentence, WHY (anti-enumeration); BaseController `/** */` multi-sentence, WHY (formatResponse nulls `data`). No `(#N)` refs, no stacked `//` | OK |

Forbidden states: ADHOC_WORK no (node on diagram, `/todo #276`); NO_EVIDENCE no (plan + diff notes); EDIT_UNVERIFIED no (verbatim test/build output); CODE_IN_HAVEN no (`find haven` for code files: none); DIAGRAM_DRIFT no (row set to SEALED in place).
Seal gate: nothing outward-facing (no commit/push).
Proportion: 8 production files, each mapped to a row. The i18n key swap is required by (4). Out-of-scope items (login timing, bulk partial 207, dead `auth.loginFailed`) are listed under "Noticed, not done" and were not changed.

## Re-run
none. The note is complete and cites every criterion, the commands match MEMORY.md, the output is not truncated, and the node is not a release gate.
