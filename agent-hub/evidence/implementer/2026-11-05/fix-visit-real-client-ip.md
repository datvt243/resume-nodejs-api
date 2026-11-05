# 2026-11-05 - fix-visit-real-client-ip
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-visit-real-client-ip` · Task: `/todo #371` — "Visit tracking stores the proxy's IP/location, not the visitor's (no trust proxy)"
Status: sealed_pending_verifier · Branch: `371-visit-tracking-stores` · Plan: `evidence/implementer/2026-11-05/fix-visit-real-client-ip-plan.md`

## Hub bytes before: 84459

## Diff
| File | Why |
|---|---|
| `src/candidate_me/index.ts` | New module-local `visitorIp(req)`: leftmost `X-Forwarded-For` entry if `net.isIP` accepts it, else `req.ip \|\| req.socket.remoteAddress \|\| 'unknown'` (the old expression). `handlerRecordVisit` uses it; stale "out of scope" comment removed; JSDoc documents the accepted spoof risk + why no global `trust proxy`. |
| `src/__tests__/candidate_me/index.test.ts` | Existing `handlerRecordVisit` req mocks gain `headers: {}` (the handler now reads `req.headers`); 2 new tests (XFF used + geo looked up on it; non-IP XFF falls back to `req.ip`). |
| `.claude/rules/api.md` | Visit endpoint row: how the IP is derived + spoof risk accepted. |
| `src/middlewares/rateLimit.middleware.ts` | NOT touched — rate-limit key stays `req.ip` (operator decision). |

## Command
`npm test` · `npx jest src/__tests__/candidate_me/index.test.ts` · `npm run build` · `npm run lint` (all from repo root)

## Output
`npx jest src/__tests__/candidate_me/index.test.ts`:
```
      ✓ stores the leftmost X-Forwarded-For IP and its geo location, not the proxy address (1 ms)
      ✓ falls back to req.ip when X-Forwarded-For is not an IP (2 ms)
Tests:       49 passed, 49 total
```
`npm test`:
```
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 566 passed, 571 total
```
Failing: `src/__tests__/auth/tokenExpiry.test.ts` (1, `falls back to a 1h access token when TOKEN_EXP_IN is unset`) + `src/__tests__/services/atsPdfIntegration.test.ts` (4, real-Puppeteer). Pre-existing — with this diff stashed (`git stash push -- src .claude/rules/api.md`), the same 2 files alone: `Test Suites: 2 failed, 2 total` / `Tests: 5 failed, 2 passed, 7 total`. Environment-dependent (local `.env` TOKEN_EXP_IN / Chrome), unrelated to `candidate_me`.
`npm run build`: exit 0, no `error` lines (tsc + copy).
`npm run lint`: `✖ 274 problems (274 errors, 0 warnings)` — = baseline 274. Touched files (`src/candidate_me/index.ts` + its test): 45 problems with diff stashed, 45 with diff applied → 0 new.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) XFF `"203.0.113.7, 10.0.0.2"` → stored ip `203.0.113.7` + geo on it | `✓ stores the leftmost X-Forwarded-For IP and its geo location, not the proxy address` (asserts `lookup` called with `203.0.113.7`, `Visit.create` gets `ip: '203.0.113.7', location: 'Hanoi, HN, VN'`) |
| (2) non-IP XFF → `req.ip` | `✓ falls back to req.ip when X-Forwarded-For is not an IP` |
| (3) rate-limit key unchanged | `git diff --stat` touches no `rateLimit.middleware.ts` |
| (4) test/build/lint | `Tests: 49 passed, 49 total` (file); full suite 5 failures pre-existing (above); build exit 0; lint 274 = baseline, 0 new in touched files |
| Spoof risk documented + accepted | JSDoc on `visitorIp` + `.claude/rules/api.md` visit row; operator chose this in plan note |
| comments per code-comments.md | One `/** */` JSDoc on `visitorIp` (WHY: why not `trust proxy`, accepted risk), no issue refs; removed the stale multi-line "out of scope" comment |

## Supersedes: none
## Noticed, not done
- `tokenExpiry.test.ts` fails locally (pre-existing, env-dependent).
