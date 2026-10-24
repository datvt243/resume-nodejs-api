# 2026-10-24 - enforce-https (diff)

- Worker: implementer · Version: 0.1.0
- Node: `enforce-https` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #292): "feat(security): HTTPS enforcement / HSTS" — "No HTTPS redirect or `Strict-Transport-Security` header anywhere in `src/` (behind a proxy this needs `trust proxy` + `x-forwarded-proto`). May be covered by helmet's HSTS if that issue lands first."
- Plan: `evidence/implementer/2026-10-24/enforce-https-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 81431

## Diff
| File | Why |
|---|---|
| `src/middlewares/httpsRedirect.middleware.ts` (new) | `httpsRedirect`: production only (`NODE_ENV` from `@/config/process.config`); first value of `x-forwarded-proto` (string or array, comma-split, trimmed) === `http` → `res.redirect(308, https://<host><originalUrl>)`; `/health` exempt; otherwise `next()`. |
| `src/middlewares/index.ts` | Barrel re-export, same as the other middlewares. |
| `src/server.ts` | Import + `app.use(httpsRedirect)` right after `requestLogger`, before helmet/body parsing/routes. |
| `src/__tests__/middlewares/httpsRedirect.test.ts` (new) | Real HTTP (ephemeral Express app, `httpsRedirect` → helmet, like server.ts), `NODE_ENV` mocked via getter (pattern from `errors.test.ts`), 7 tests. |
HSTS: no change — helmet already sends it (node `add-security-headers`).

## Command
From repo root, per `doctrine/MEMORY.md`: `npm test`; `npm run build` (Typecheck row); `npm run lint` (baseline 275 on staging, measured this morning for #293 and unchanged since: staging only gained the #293 merge whose new files lint clean); `npx jest src/__tests__/middlewares/httpsRedirect.test.ts`; `npx eslint` on new files. Live smoke: `LOCAL_PORT=3399 NODE_ENV=production node dist/server.js` + curl.

## Output
New test file (first run 1 failed: undici `fetch` ignores a custom `Host` header, so Location was `https://127.0.0.1:<port>/…`; fixed the test to assert the real host, middleware unchanged):
```
    ✓ 308-redirects a plain-HTTP request to https, keeping host + path + query (23 ms)
    ✓ uses 308 for POST too, so the method and body survive (2 ms)
    ✓ reads the first value of a multi-hop x-forwarded-proto (3 ms)
    ✓ passes https and header-less requests through (5 ms)
    ✓ never redirects /health (1 ms)
    ✓ is a no-op outside production (3 ms)
    ✓ still sends HSTS on https responses (2 ms)
Tests:       7 passed, 7 total
```
`npx eslint src/middlewares/httpsRedirect.middleware.ts src/__tests__/middlewares/httpsRedirect.test.ts src/middlewares/index.ts` → clean.

`npm test`:
```
TEST_RC=1
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 50 passed, 52 total
Tests:       5 failed, 465 passed, 470 total
```
Same 2 suites / 5 tests that fail on staging in this checkout (proven in `add-graceful-shutdown-diff.md` with diff stashed: `5 failed, 2 passed, 7 total`; causes confirmed by that node's verifier: `.env` `TOKEN_EXP_IN=3h`, no `.cache/puppeteer` Chrome). 470 = 463 (staging after #293) + 7 new; 465 = 458 + 7.

`npm run build`: `BUILD_RC=0`, ends `> cp -R ./src/public ./dist/`.
`npm run lint`: `✖ 275 problems (275 errors, 0 warnings)` = staging baseline 275 → 0 new.

Live smoke (built `dist/`, `NODE_ENV=production`):
```
no-header   /api/me/search=200
proto=https /api/me/search=200
proto=http  /api/me/search=308 location=https://localhost:3399/api/me/search?q=dev
proto=http  POST /api/v1/auth/login=308 location=https://localhost:3399/api/v1/auth/login
proto=http  /health=200
Strict-Transport-Security: max-age=31536000; includeSubDomains
EXIT_CODE=0
```
(HSTS line from `curl -sI -H "x-forwarded-proto: https" /health`. A first smoke attempt returned 400s because a zsh `${h:+-H "$h"}` expansion passed the header as one malformed argument; rerun with explicit `-H` above.)

## Acceptance
| # | Criterion | Evidence |
|---|---|---|
| 1 | prod + `x-forwarded-proto: http` → 308 to `https://<host><originalUrl>` | tests 1-3 ✓; smoke `308 location=https://localhost:3399/api/me/search?q=dev`, POST login `308` |
| 2 | https / no header / non-prod pass through | `✓ passes https and header-less requests through`, `✓ is a no-op outside production`; smoke `no-header 200`, `proto=https 200` |
| 3 | `/health` never redirected | `✓ never redirects /health`; smoke `proto=http /health=200` |
| 4 | Mounted before body parsing/routes | `src/server.ts` diff: `app.use(httpsRedirect)` directly after `app.use(requestLogger)` |
| 5 | Real-HTTP test covers 1-3 + HSTS still present | 7 tests above incl. `✓ still sends HSTS on https responses`; smoke `Strict-Transport-Security: max-age=31536000; includeSubDomains` |
| 6 | test/build no new failures, lint 0 new; comments per code-comments.md | build `BUILD_RC=0`; lint 275=275; `npm test` failures = the 5 pre-existing env ones only. Comments added: file JSDoc (WHY header-read instead of `trust proxy`), `//` WHY `/health` exempt, `//` WHY 308 not 301, test file JSDoc (WHY `redirect: 'manual'`). No `(#N)`, no narrated history; header block matches sibling middlewares. |

## Supersedes: none
Grepped active diagram for `#292` — only this node.

## Noticed, not done
- `trust proxy` still unset → `req.ip` behind Render is the proxy address (rate limiter + visit geo per-proxy, not per-client). Already noted in `src/candidate_me/index.ts:249-254`. Own node if picked up (needs the real hop count of the deploy).
- Same local `npm test` env issue as #293 (`.env` TOKEN_EXP_IN, missing Puppeteer Chrome).

## Seal gate: none
No commit/push yet.
