# 2026-10-24 - set-request-body-limit (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `set-request-body-limit` in `haven/diagrams/dev-loop.prime-mermaid.md` (GitHub #291, branch `291-fix-security-set`)
- New PM status: SEALED. The full row is archived to `haven/diagrams/dev-loop-archive.md` and the active row is now a pointer. The oldest pointer (`add-public-profile-search`, already in the archive) was dropped to keep the list at 20.

## Isolation proof
This is a fresh subagent. Its spawn description was "Verify set-request-body-limit seal", and `/todo #291` round 2 (verify_seal) dispatched it through the Agent tool. It has no history of the implementation pass, so it is not grading its own work.

## Reasoning
I read the notes (`evidence/implementer/2026-10-24/set-request-body-limit-plan.md` and `-diff.md`). I did not open the diff.

Command check (step 4): the note ran `npm test`, `npx jest <file>`, `npm run build` and `npm run lint` from the repo root. All of them match `doctrine/MEMORY.md` verbatim, and build output is present (tsc clean, copy step, exit 0).

Output check (step 5): no `...` or "truncated" markers. Summary lines are verbatim.

| Criterion | Evidence | Status |
|---|---|---|
| (1) both parsers pass `limit: REQUEST_BODY_LIMIT` | `src/server.ts:48-49`, constant in `src/config/body.config.ts` re-exported through the config barrel | Covered |
| (2) real-HTTP: over-limit → 413 `PAYLOAD_TOO_LARGE`, between 100kb and limit → 200, JSON + urlencoded | 3 named tests in `errors.test.ts` (JSON 413, urlencoded 413, 500 KiB JSON+urlencoded accepted), and the test app mounts the same constant as `server.ts`. Result: `Tests: 9 passed, 9 total` | Covered |
| (3) `npm test` + build green, lint 0 new | `npm test`: 454 passed, 5 failed (2 suites). The note reran those 2 suites on the stashed clean tree and got the same 5 failures (`Expected 3600 / Received 10800`, `Could not find Chrome` x4), so they already existed. I checked from disk, without a re-run, that both causes are in the local environment: `.env` has `TOKEN_EXP_IN=3h` (= 10800), and `.cache/puppeteer` is absent. The add-security-headers verifier (same day) re-ran and found the same 5 failures at 457 total. This run has 459 total, +2 tests, which matches the note's 2 added tests. So there is no regression. Build exit 0. Lint 275 → 275 | Covered (green apart from 5 failures that already existed, are local-env only and are listed in Noticed) |
| (4) PROJECT.md #291 trap resolved, root CLAUDE.md names the limit | PROJECT.md:47 now reads "Resolved (#291) … `REQUEST_BODY_LIMIT` … 1mb … 413" (I confirmed it on disk). The note cites CLAUDE.md middleware step 6 and the structure line | Covered |
| (5) comments per code-comments.md | One `/** */` JSDoc in `body.config.ts`. It has more than 1 sentence, explains WHY (sizing, multer exclusion), and has no issue refs or history. That complies with Keep/Style | Covered |

Supersedes (step 6b): `## Supersedes: none`. No other open row on the active diagram cites #291.

Forbidden states (step 7):
- ADHOC_WORK: no. The node exists and the work ran with a worker identity.
- NO_EVIDENCE: no. Both notes are present.
- EDIT_UNVERIFIED: no. The output was run and quoted.
- CODE_IN_HAVEN: no. `find haven` turned up no code files.
- DIAGRAM_DRIFT: no. The status is updated by this verdict.

Seal gate (step 8): no commit, push or external action was taken. The note records the gate as none.

Proportion (step 9): 1 new constant file, 1 barrel export, 2 parser options, 1 test file, and the 2 doc rows that criterion 4 requires. The diff does nothing beyond the node.

## Re-run
none. The note has full citations, no truncation, and commands that match MEMORY.md. The node is not a `/release` gate, and PROJECT.md does not name this change class as needing a re-run. The non-green part of criterion 3 is backed by a clean-tree repro in the note. I checked its two causes from disk (`.env` and `.cache/puppeteer`) without running anything, and the test totals agree with today's independent re-run on `add-security-headers`.
