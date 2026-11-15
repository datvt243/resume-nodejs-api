# 2026-11-14 - config-fail-fast (SEAL)

- Worker: verifier · Version: 0.1.0
- Node: `config-fail-fast` (`haven/diagrams/dev-loop.prime-mermaid.md`) · Issue: #458 (labels: bug, security)
- New PM status: SEALED (full row archived to `haven/diagrams/dev-loop-archive.md`; active row replaced by a pointer; oldest pointer `private-cv-storage` dropped, 21 > 20, its full row already in the archive)
- Notes audited: `evidence/implementer/2026-11-14/config-fail-fast-plan.md`, `evidence/implementer/2026-11-14/config-fail-fast-diff.md`
- Feature doc: `doctrine/features/startup-config-env.md` (draft backfill; Behavior #2-#5 decided by the operator 2026-11-14 per `evidence/analyst/2026-11-14/startup-config-env-spec.md`)

## Isolation proof
Fresh Agent-tool spawn, description "verify_seal config-fail-fast #458", spawn=fresh. That is not the implementer's task string ("#458 Config: fail fast at startup when required env vars are missing"). The pass was cut off by an API error after step 11. The coordinator then resumed this same first-round spawn with a message that starts "Resume: your previous run on node `config-fail-fast` was cut off by an API error (machine slept) after step 11". Steps 12-13 were finished from that resume, after re-reading the note, the pointer row and the archive row from disk. This context wrote no part of the diff.

## Reasoning
| # | Criterion (node row + feature doc acceptance) | Evidence in note | Result |
|---|---|---|---|
| 1 | `npx jest src/__tests__/config/` passes and covers the listed cases | `Test Suites: 5 passed, 5 total` / `Tests: 43 passed, 43 total`. process.config.test.ts output (`Tests: 16 passed, 16 total`) has one test per required case: TOKEN_SECRET missing throws naming it; TOKEN_REFRESH and SESSION_SECRET at 31 chars throw; only MONGO_URI passes; no Mongo config throws; each of LOCAL_PORT, MONGO_MAX_POOL_SIZE, MONGO_MIN_POOL_SIZE, TRUST_PROXY_HOPS =abc throws; numeric vars unset passes; development with a missing secret does not throw | Covered |
| 2 | Production boot with a missing or short TOKEN_SECRET exits non-zero, names the var, nothing listens | Real `node dist/server.js` boot after build: `exit 1`, message lists `"TOKEN_SECRET" length must be at least 32 characters long` (+ TOKEN_REFRESH, SESSION_SECRET), `listeners on 39458: 0` | Covered |
| 3 | Development boot with TOKEN_SECRET unset warns naming it and keeps starting | `⚠️ Missing required environment variables: - "TOKEN_SECRET" is required`, then `[MongoDB] Connected!`, process still alive at the 8s alarm (exit 142). `TOKEN_SECRET=` counts as unset (blank values are dropped before the check, and dotenv does not override a variable that is already set) | Covered |
| 4 | `npm test` passes, `jest.setup.ts` unchanged | `5 failed, 703 passed, 708 total`. The 5 failures are tokenExpiry (local `.env` TOKEN_EXP_IN) + 4 × atsPdfIntegration (no Chrome). The same 5 fail on clean `staging` (`5 failed, 2 passed, 7 total` for those 2 files), and prior seals accepted the same set (`job-applications-validate-seal.md`, `education-project-manual-order-seal.md`). `git diff --stat -- src` = process.config.ts + the new test only; session-start git status agrees | Covered (0 new failures) |
| 5 | `npm run build` (typecheck) passes | `npm run build` → exit 0 (MEMORY Typecheck = inside Build) | Covered |
| 6 | Matches feature doc Behavior #2-#5 | #2: schema per note (3 secrets min 32; MONGOBD_* required only without MONGO_URI; 4 optional numerics; the rest unchecked via `.unknown(true)`). #3: the prod throw lists every failing var with its reason (abortEarly false; 3 vars in the real boot). #4: dev warns only on `any.required`; the "short secret neither throws nor warns" test passes. #5: MONGO_URI-only passes in prod, and dev MONGO_URI + blank MONGOBD_* gives no warning (tests) | Covered |
| 7 | Comments per code-comments.md | Note cites 1 JSDoc on exported `checkEnv` (WHY prod vs elsewhere) + 1 `//` WHY for the empty-string drop, no issue refs | Covered |
| 8 | Supersedes / Still open | `## Supersedes: none`, `grep "#458"` → only this node | Covered |

- Commands match `doctrine/MEMORY.md` (Test, Test one file with the feature doc's directory path, Build/Typecheck inside Build, Lint), run from the repo root.
- Lint: `✖ 274 problems` = baseline 274; `npx eslint` on the 2 changed files → exit 0.
- Truncation: none. Summary lines and boot outputs are verbatim.
- Review: `/code-review medium` → 4 correctness findings with one root cause (blank `KEY=` vars). Fixed, +4 tests, commands re-run after the fix. The out-of-spec `Joi.number()` range note is stated as not done (spec only says "a number"). `/security-review` is present because the issue has the `security` label: no findings ≥ 8; Joi messages name the key, never the value (seen in the real boot output).
- Forbidden states: ADHOC_WORK no (node on the diagram, branch-local); NO_EVIDENCE no; EDIT_UNVERIFIED no; CODE_IN_HAVEN no (only .md changes under agent-hub/); DIAGRAM_DRIFT resolved by this SEAL.
- Seal gate: none needed (no outward action in the diff; push happens later via `/ship`).
- Proportionality: 1 src file + 1 new test file; consumers unchanged. Matches the node.
- Observation (not a gap): the diff summary says "17 cases", but the verbatim jest output is 16 tests (12 pre-review + 4 post-review, which matches the 704 → 708 total). The verbatim count is what was audited, so the summary line is a typo.
- Deploy risk (carried over from the note's "Noticed, not done"): production now needs TOKEN_SECRET/TOKEN_REFRESH/SESSION_SECRET ≥ 32 chars. The local `.env` fails this and Render's values were not checked. The operator must check them before `/release`.
- Doctrine proposal: none.
- 11e: this is a fix SEAL on a backfilled draft doc, so its `Status: draft` and INDEX row are left as is.

## Re-run
none — audit-only. The note is verbatim, the commands match doctrine and every criterion is cited. The node is not outward-facing or a release gate, and PROJECT.md has no re-run rule for it.
