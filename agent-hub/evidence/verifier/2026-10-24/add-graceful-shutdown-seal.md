# 2026-10-24 - add-graceful-shutdown (verdict)

- Worker: verifier (subagent, dispatched via Agent tool) · Node: `add-graceful-shutdown` in `haven/diagrams/dev-loop.prime-mermaid.md` (GitHub #293) · New PM status: SEALED

## Isolation proof
Spawned as a fresh subagent with description "agent-hub VERIFIER: add-graceful-shutdown" and a task prompt (run `verify_seal` for this one node, make an explicit judgment on the 5 `npm test` failures) that the implementer pass did not have. This subagent wrote none of the code under review.

## Verdict
SEAL

## Criteria
| # | Criterion | Evidence cited (from `evidence/implementer/2026-10-24/add-graceful-shutdown-diff.md`) | Verified |
|---|---|---|---|
| 1 | SIGTERM/SIGINT → `server.close` → `closeRedis()` → Mongo disconnect → exit 0; second signal doesn't re-run it | `✓ closes HTTP, then Redis, then Mongo, then exits 0`, `✓ runs only once when a second signal arrives`; Diff table: `server.ts` registers `SIGTERM`/`SIGINT` → `void shutdown(signal)`; live smoke `[Shutdown] SIGTERM received, draining` … `[MongoDB] Disconnected!` … `[Shutdown] Done` … `EXIT_CODE=0` | yes |
| 2 | Hard timeout force-exits 1; timer doesn't keep process alive | `✓ force-exits 1 when draining hangs past the timeout`; Diff table: 10s `.unref()`'d force-exit(1) timer, cleared before exit(0) | yes |
| 3 | Failing close step logged, remaining steps still run | `✓ still closes Redis and Mongo when the HTTP close errors`; `server.close` error logged not thrown; `closeRedis`/`disconnect` catch+log internally (`redis.ts:64-72`, `mongo.db.ts:62-70`) | yes |
| 4 | Unit test covers order + idempotency + timeout | `Tests: 4 passed, 4 total` in `src/__tests__/utils/gracefulShutdown.test.ts` (order, once-only, close-error, timeout) | yes |
| 5 | `npm test` + `npm run build` green, `npm run lint` 0 new | Build: `BUILD_RC=0`. Lint: `275 problems` with diff = `275 problems` stashed baseline; new files lint-clean. Test: `Tests: 5 failed, 458 passed, 463 total`, failures only in `tokenExpiry` + `atsPdfIntegration`; same 2 suites on stashed baseline `5 failed, 2 passed, 7 total`; arithmetic 463 = 459 + 4 new, 458 = 454 + 4 new. Judgment below. | yes (with judgment) |
| 6 | Stale TODO removed; comments per code-comments.md | Diff table: `// TODO: close the MongoDB connection on process exit (coming soon)` removed from `server.ts`. Comments row: file JSDoc (why drain + order rationale), one-sentence why on `SHUTDOWN_TIMEOUT_MS` (Render SIGKILL window), JSDoc contract on `createShutdown`, `// never calls back` in test; no `(#N)` refs, no narrated history. Judged from the note's description alone — sufficient; did NOT open `src/utils/gracefulShutdown.ts`. | yes |

### Criterion 5 judgment
The 5 failures are not "green", but the note proves they're pre-existing and independent of this diff: identical failure count on the stashed baseline for the same 2 suites, and the pass-count arithmetic leaves 0 failures attributable to the diff. Causes corroborated read-only (no re-run): repo `.env` line 27 is `TOKEN_EXP_IN=3h` (matches `Expected: 3600 Received: 10800`), and repo-local `.cache/puppeteer` does not exist (matches the `Could not find Chrome ... .cache/puppeteer` error). Neither suite touches shutdown code. Accepted; env-caused failures already logged under "Noticed, not done".

## Checks
- Command match: `npm test`, `npx jest <file>`, `npm run build`, `npm run lint` from repo root — match `doctrine/MEMORY.md` exactly. Build output present (`BUILD_RC=0`).
- Truncation: outputs are excerpted summary lines (PASS/FAIL lines, `Tests:` / `Test Suites:` totals, RC codes), not redacted; every acceptance row points at a concrete line. OK.
- 6b: `grep 293|graceful` on active diagram → only this row (line 96). Note has `## Supersedes: none`. OK.
- Forbidden states: ADHOC_WORK no (node exists, worker identity in note); NO_EVIDENCE no (plan + diff notes); EDIT_UNVERIFIED no (test/build/lint/smoke output cited); CODE_IN_HAVEN no (`git status` shows only `src/` + evidence + diagram .md changes; nothing runnable in `haven/`); DIAGRAM_DRIFT no (row PENDING → SEALED here).
- Seal gate: nothing outward-facing yet (uncommitted, unpushed; `git status` confirms). None needed.
- Proportion: 1 new util, wiring in `server.ts`, 1 test file, stale TODO removed — exactly what the node asks; reuses existing `closeRedis`/`disconnect`. OK.

## Re-run: none
No `npm test`/build/lint re-run. Only read-only corroboration of the env causes (`grep TOKEN_EXP_IN .env`, `ls .cache/puppeteer`) and `git status`; no stash.
