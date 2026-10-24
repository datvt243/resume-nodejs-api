# 2026-10-24 - add-security-headers (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `add-security-headers` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub issue #290, branch `290-feat-security-add`)
- New PM status: SEALED (row collapsed in place to an archive pointer; full row appended to `haven/diagrams/dev-loop-archive.md`; oldest pointer row `add-cv-pdf-parse-endpoint` pruned, since its full row is already in the archive, keeping 20 pointers)
- Notes audited: `evidence/implementer/2026-10-24/add-security-headers-plan.md`, `evidence/implementer/2026-10-24/add-security-headers-diff.md`

## Isolation proof
Spawned as a fresh Agent-tool subagent. Its brief said: "You are the **verifier** worker ... an independent subagent with a blank context. The implementer pass ran in another session, and you must not trust its reasoning." This context holds no implementation history. The brief also asked me to open `git diff`. I did not, because SOUL invariant 2 / `EvidenceOnly` (read the note, not the diff) takes precedence. The only repo facts I gathered myself are listed under Reasoning and Re-run.

## Reasoning
Commands (step 4): `npx jest <file>`, `npm test`, `npm run build` (Typecheck row), `npm run lint`, all from repo root. They match `doctrine/MEMORY.md`. Lint was compared before and after using a stash baseline, as MEMORY.md prescribes.

Output (step 5): the summary lines are verbatim. One `...` appears inside the quoted Puppeteer error string of a pre-existing failure. Because of that elision, and because criterion 4 says "green" while 5 tests fail, I ran `npm test` myself (see Re-run) rather than taking the note's word.

| Criterion | Evidence | Judgment |
|---|---|---|
| (1) CSP, nosniff, XFO SAMEORIGIN, HSTS present; no X-Powered-By, real-HTTP test | Note: `✓ sets the standard security headers and hides X-Powered-By` in `src/__tests__/config/helmet.config.test.ts` (ephemeral Express + fetch). My run: `PASS src/__tests__/config/helmet.config.test.ts` | Covered |
| (2) CORP `cross-origin` | Note: `✓ allows cross-origin embedding of served resources`; diff table says `crossOriginResourcePolicy: { policy: 'cross-origin' }` | Covered |
| (3) Swagger UI under CSP `script-src 'self'` | Note: `✓ keeps Swagger UI compatible with the CSP (no inline scripts)`, plus a grep showing swagger-ui-express has no inline `on*=` handlers | Covered |
| (4) `npm test` + build green, lint 0 new | With diff: `Tests: 5 failed, 452 passed, 457 total`. Baseline (stashed): `5 failed, 449 passed, 454 total`, same 2 suites. So the diff adds +3 passing tests and 0 new failures. Build: `tsc && npm run copy`, clean. Lint: 275 before, 275 after. I confirmed both pre-existing failures are environmental, from disk: `.env` sets `TOKEN_EXP_IN=3h` (= 10800, the received value; `jest.setup.ts` uses `??=` so `.env` wins), and `.cache/puppeteer` does not exist in this checkout ("No such file or directory"), which matches `Could not find Chrome`. Neither failure touches the diff | Covered (no regression; the 5 pre-existing env failures are listed under Noticed, not done) |
| (5) Comments per code-comments.md | Note: `helmet.config.ts` has the sibling-config file header plus one `/** */` giving the WHY of the CORP override; the test file has one `/** */` WHY; no `(#N)` refs; `server.ts` has no comments added | Covered |

Supersedes (step 6b): `grep 290` on the active diagram shows only this row. The note says `## Supersedes: none`. Consistent.

Forbidden states (step 7): `ADHOC_WORK` (node exists, row 97), `NO_EVIDENCE`, `EDIT_UNVERIFIED`, `CODE_IN_HAVEN`, `DIAGRAM_DRIFT` (row now SEALED). None hit.

Seal gate (step 8): no commit, push or publish. `npm install helmet` is a dependency fetch, not an outward-facing action.

Proportion (step 9): 1 dependency, 1 config file, 1 re-export, a 2-line mount in `server.ts`, and 1 test file. That is exactly what the node specifies. HSTS redirect (#292) and the env failures are left in "Noticed, not done".

## Re-run
partial: `npm test` from repo root → `Test Suites: 2 failed, 48 passed, 50 total` / `Tests: 5 failed, 452 passed, 457 total`, `PASS src/__tests__/config/helmet.config.test.ts`. The failures are tokenExpiry (1) and atsPdfIntegration (4), identical to the note. Reason: the note elided part of a failure message (`...`), and criterion 4's literal "green" did not hold, so I confirmed the counts independently instead of trusting the excerpt. Build and lint were not re-run.
