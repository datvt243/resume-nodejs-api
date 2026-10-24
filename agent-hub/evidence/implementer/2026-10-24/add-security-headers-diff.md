# 2026-10-24 - add-security-headers (diff)

- Worker: implementer · Version: 0.1.0
- Node: `add-security-headers` (`haven/diagrams/dev-loop.prime-mermaid.md`, last row)
- Task (verbatim, GitHub #290): "feat(security): add HTTP security headers (helmet)" — "No `helmet` (or equivalent) middleware in `src/server.ts` — responses ship without CSP, X-Content-Type-Options, X-Frame-Options, etc."
- Branch: `290-feat-security-add`
- Plan: `evidence/implementer/2026-10-24/add-security-headers-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 81139

## Diff
| File | Why |
|---|---|
| `package.json`, `package-lock.json` | `npm install helmet` → `"helmet": "^8.3.0"` (runtime dep, named by the issue) |
| `src/config/helmet.config.ts` (new) | `helmetConfig()` = helmet defaults + `crossOriginResourcePolicy: { policy: 'cross-origin' }`; mirrors `cors.config.ts` pattern |
| `src/config/index.ts` | re-export `helmet.config` |
| `src/server.ts` | `import helmet from 'helmet'`; `app.use(helmet(helmetConfig()))` directly after `app.use(requestLogger)` — before /health, swagger, rate limiter, static, router, 404, error handler, so every response gets the headers |
| `src/__tests__/config/helmet.config.test.ts` (new) | real-HTTP test (ephemeral Express app + built-in fetch, same pattern as `uploadCvPdfParse.test.ts`; no supertest installed) |

## Command
From repo root, verbatim from `doctrine/MEMORY.md`:
- `npx jest src/__tests__/config/helmet.config.test.ts`
- `npm test`
- `npm run build`
- `npm run lint` (before diff, on clean `290-feat-security-add` == staging, and after)
- Baseline comparison: `git stash push -u` → `npm test` → `git stash pop`

## Output
`npx jest src/__tests__/config/helmet.config.test.ts`:
```
PASS src/__tests__/config/helmet.config.test.ts
  helmetConfig
    ✓ sets the standard security headers and hides X-Powered-By (30 ms)
    ✓ allows cross-origin embedding of served resources (3 ms)
    ✓ keeps Swagger UI compatible with the CSP (no inline scripts) (4 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

`npm test` (with diff):
```
Test Suites: 2 failed, 48 passed, 50 total
Tests:       5 failed, 452 passed, 457 total
```
Failing (all 5):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
  ● access vs refresh token expiry ... › falls back to a 1h access token when TOKEN_EXP_IN is unset
    Expected: 3600
    Received: 10800
  ● ATS PDF integration (real Puppeteer + pdf-parse) › (4 tests)
    Could not find Chrome (ver. 127.0.6533.88). ... your cache path is incorrectly configured (which is: /Users/_david/Workspace/Project/resume/resume-nodejs-api/.cache/puppeteer).
```

`npm test` baseline (diff stashed):
```
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Tests:       5 failed, 449 passed, 454 total
```
→ identical 5 failures pre-exist; diff adds exactly +3 passing tests, 0 new failures.

`npm run build`:
```
> tsc && npm run copy
> resume-nodejs-api@2.0.3 copy
> cp -R ./src/public ./dist/
```
(exit clean, no tsc errors)

`npm run lint` before: `✖ 275 problems (275 errors, 0 warnings)` · after: `✖ 275 problems (275 errors, 0 warnings)`.
`npx eslint` on touched files: 5 problems, all in `src/server.ts` at pre-existing lines (`131:5 no-unused-expressions`, `137:1 no-floating-promises` — `isConnected && runServer(...)` / `startServer()`), none on new files.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. CSP, nosniff, X-Frame-Options SAMEORIGIN, HSTS present; X-Powered-By absent | `✓ sets the standard security headers and hides X-Powered-By` |
| 2. CORP `cross-origin` | `✓ allows cross-origin embedding of served resources` |
| 3. Swagger UI works under CSP `script-src 'self'` | `✓ keeps Swagger UI compatible with the CSP (no inline scripts)` — HTML references `swagger-ui-init.js`, contains no `<script>` without `src`; `grep -nE ' on[a-z]+=' node_modules/swagger-ui-express/index.js` → no inline event handlers |
| 4. `npm test` + `npm run build` green (excluding pre-existing), lint 0 new | Tests 452 passed vs baseline 449, same 5 pre-existing failures; build clean; lint 275 → 275 |
| 5. Comments per code-comments.md | `helmet.config.ts`: file header copied from sibling config files (house convention) + one `/** */` explaining WHY CORP is overridden (multi-sentence → JSDoc block). Test file header: one `/** */` explaining WHY real HTTP. No `(#N)` refs, no WHAT comments. `server.ts`: no comments added |

## Supersedes: none
No other not-yet-SEALED row cites #290.

## Noticed, not done
- `atsPdfIntegration.test.ts` fails locally: Chrome not present in project-local `.cache/puppeteer` (moved there by #298's `.puppeteerrc.cjs`); fix is `npx puppeteer browsers install chrome` locally — environment, not code. `npm install` also warned puppeteer postinstall is blocked by `allow-scripts`, so a fresh install won't download it either.
- `tokenExpiry.test.ts` "TOKEN_EXP_IN unset → 1h" receives 10800 (3h) — likely local `.env` leaking into the test env; pre-existing, unrelated.
- HSTS comes from helmet defaults (`max-age=31536000; includeSubDomains`); HTTP→HTTPS redirect stays with #292.
- CSP is helmet's default; if the SPA or any served HTML later needs third-party script/style origins, `helmetConfig()` is the one place to extend.

## Seal gate
None — no commit/push/publish. `npm install helmet` fetched from the npm registry (dependency install, not a publish).
