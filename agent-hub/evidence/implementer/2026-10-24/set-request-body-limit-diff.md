# 2026-10-24 - set-request-body-limit (diff)

- Worker: implementer · Version: 0.1.0
- Node: `set-request-body-limit` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #291): "fix(security): set an explicit request body size limit" — see plan note `evidence/implementer/2026-10-24/set-request-body-limit-plan.md`
- Branch: `291-fix-security-set`

## Hub bytes before: 81129

## Diff
| File | Why |
|---|---|
| `src/config/body.config.ts` (new) | `REQUEST_BODY_LIMIT = '1mb'` + JSDoc giving the sizing reason (100-item bulk import with unbounded localized descriptions can exceed 100kb; uploads go through multer) |
| `src/config/index.ts` | re-export `body.config` (barrel pattern) |
| `src/server.ts:21,48-49` | import constant; `bodyParser.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT })`, `bodyParser.json({ limit: REQUEST_BODY_LIMIT })` |
| `src/__tests__/middlewares/errors.test.ts` | test app now mounts both parsers exactly as `server.ts` (shared constant); 413 test retitled off "100kb default" and sized at 1 MiB payload; + urlencoded 413 test; + 500 KiB JSON/urlencoded accepted (200) test; + `postForm` helper |
| `CLAUDE.md` | middleware stack step 6 names the limit + 413; `config/body.config.ts` in project structure |
| `agent-hub/doctrine/domains/PROJECT.md` | #291 trap row → Resolved, cites current code + test |

## Command
From repo root, verbatim from `doctrine/MEMORY.md`:
- `npx jest src/__tests__/middlewares/errors.test.ts`
- `npm test`
- `npm run build`
- `npm run lint` (before and after the diff)
- pre-existing check: `git stash -u` → `npx jest src/__tests__/auth/tokenExpiry.test.ts src/__tests__/services/atsPdfIntegration.test.ts` → `git stash pop`

## Output
`npx jest src/__tests__/middlewares/errors.test.ts`:
```
PASS src/__tests__/middlewares/errors.test.ts
    ✓ JSON body over REQUEST_BODY_LIMIT → 413 PAYLOAD_TOO_LARGE (6 ms)
    ✓ urlencoded body over REQUEST_BODY_LIMIT → 413 PAYLOAD_TOO_LARGE (4 ms)
    ✓ bodies over the old 100kb default but under REQUEST_BODY_LIMIT are accepted (8 ms)
Tests:       9 passed, 9 total
```
`npm test`:
```
Test Suites: 2 failed, 48 passed, 50 total
Tests:       5 failed, 454 passed, 459 total
FAIL src/__tests__/auth/tokenExpiry.test.ts  (falls back to a 1h access token when TOKEN_EXP_IN is unset)
FAIL src/__tests__/services/atsPdfIntegration.test.ts  (4 tests)
```
Same 2 suites on the stashed clean tree (no diff applied):
```
    Expected: 3600
    Received: 10800
    Could not find Chrome (ver. 127.0.6533.88). This can occur if either   (x4)
Tests:       5 failed, 2 passed, 7 total
```
→ identical 5 failures pre-exist, local-environment only (see Noticed).

`npm run build`: `tsc` clean, `> resume-nodejs-api@2.0.3 copy` / `cp -R ./src/public ./dist/`, exit 0.

`npm run lint`: before `✖ 275 problems (275 errors, 0 warnings)`; after `✖ 275 problems (275 errors, 0 warnings)`.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. Both parsers pass `limit: REQUEST_BODY_LIMIT` | `src/server.ts:48-49` (diff above) |
| 2. Over-limit → 413 `PAYLOAD_TOO_LARGE` (JSON + urlencoded); 100kb < body < limit → 200 | errors.test.ts: "JSON body over REQUEST_BODY_LIMIT → 413", "urlencoded body over REQUEST_BODY_LIMIT → 413", "bodies over the old 100kb default but under REQUEST_BODY_LIMIT are accepted" — `Tests: 9 passed, 9 total` |
| 3. `npm test` + build green, lint 0 new | `npm test`: 454 passed, 5 failed — all 5 reproduced on clean tree (pre-existing, env); build exit 0; lint 275 → 275 |
| 4. PROJECT.md trap resolved; CLAUDE.md names limit | PROJECT.md trap row now "Resolved (#291) …"; CLAUDE.md middleware step 6 + structure line |
| 5. Comments per code-comments.md | One JSDoc added (`body.config.ts`): `/** */` because > 1 sentence, explains WHY the value (sizing + multer exclusion), no issue refs / history. No other comments touched. |

## Supersedes: none
No other not-yet-SEALED row cites #291 in the active diagram.

## Noticed, not done
- `atsPdfIntegration.test.ts` fails locally: Chrome not present in the project-local `.cache/puppeteer` introduced by `fix-render-puppeteer-cache-dir` (#298) — needs `npx puppeteer browsers install chrome` locally (or `CI_NO_CHROME`). Not code, not this diff.
- `tokenExpiry.test.ts` "falls back to 1h when TOKEN_EXP_IN is unset" reads 10800 — local `.env` sets `TOKEN_EXP_IN` (3h) and the test doesn't fully isolate from it. Pre-existing test-isolation gap, out of scope.

## Seal gate
none — no commit/push/external action taken. src/ diff shown to operator in-session.
