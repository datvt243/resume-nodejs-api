# 2026-11-07 - remove-get-login (diff)

- Worker: implementer · Version: 0.1.0
- Node: `remove-get-login` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: `/todo #389` — "Remove `GET /auth/login` (credentials in a GET body)"
- Status: sealed_pending_verifier

## Hub bytes before
93048

## Feature doc
doctrine/features/auth-register-login.md

## Feature doc changed: Behavior 5 "`POST /api/v1/auth/login` (also `GET /api/v1/auth/login`, same handler, reading the body)" → "`POST /api/v1/auth/login` (POST only; `GET /api/v1/auth/login` → 404 like any unknown route)" — operator: "Change: remove the GET route — #389" (doc Open questions, 2026-11-07)

## Diff
| File | Why |
|---|---|
| `src/routers/api/v1/auth.route.ts` | removed `router.get('/login', asyncHandler(authLogin));` and the Swagger `get:` (deprecated) block for `/api/v1/auth/login` (issue: "Update Swagger") |
| `src/__tests__/auth/v1AuthRoute.test.ts` | new: router stack has exactly one `/login` layer, methods `{ post: true }` |
| `.claude/rules/api.md` | endpoint row `POST / GET` → `POST` |
| `agent-hub/doctrine/features/auth-register-login.md` | Behavior 5 + Changelog row |

## Command
- `npx jest src/__tests__/auth/v1AuthRoute.test.ts --verbose`
- `npx jest src/__tests__/auth/auth.controller.test.ts src/__tests__/auth/auth.service.test.ts src/__tests__/auth/v2AuthRoute.test.ts`
- base (`git stash -u`) then after: `npm test 2>&1 | grep -E "^FAIL|^Tests:|^Test Suites:|  ●.*›" | sort -u`
- base: `npx eslint src/routers/api/v1/auth.route.ts`; after: `npx eslint src/routers/api/v1/auth.route.ts src/__tests__/auth/v1AuthRoute.test.ts; echo "eslint exit $?"`
- `npx eslint .`
- `npm run build` (Typecheck: inside Build)

## Output
```
$ npx jest src/__tests__/auth/v1AuthRoute.test.ts --verbose
    ✓ serves /login only as POST — credentials never ride on a GET (2 ms)
Tests:       1 passed, 1 total

$ npx jest auth.controller + auth.service + v2AuthRoute
Test Suites: 3 passed, 3 total
Tests:       33 passed, 33 total

== BASE npm test
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 57 passed, 59 total
Tests:       5 failed, 576 passed, 581 total
== AFTER npm test
  ● access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155) › falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || '1h' default)
  ● ATS PDF integration (real Puppeteer + pdf-parse) › renders a real PDF whose extracted text passes the full ATS check suite
  ● ATS PDF integration (real Puppeteer + pdf-parse) › reports keyword coverage against a sample job description
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the en ATS PDF through the PDF CV import parser
  ● ATS PDF integration (real Puppeteer + pdf-parse) › round-trips the vi ATS PDF through the PDF CV import parser
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 58 passed, 60 total
Tests:       5 failed, 577 passed, 582 total

== BASE eslint changed      (no output — 0 problems)
== AFTER eslint changed     (no output)
eslint exit 0

$ npx eslint .
✖ 274 problems (274 errors, 0 warnings)

$ npm run build
build exit 0
```
Same 5 pre-existing local failures base and after (local `.env` sets `TOKEN_EXP_IN`; no local Chrome); 581 → 582 = the 1 new test, 59 → 60 suites = the new file.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) v1AuthRoute test | "✓ serves /login only as POST — credentials never ride on a GET"; "Tests: 1 passed, 1 total" |
| (2) doc's jest commands | "Tests: 33 passed, 33 total" |
| (3) npm test + build | same 5 `●` base and after; "577 passed, 582 total"; build exit 0 |
| (4) lint ≤ 274, none in changed files | "274 problems"; changed files "eslint exit 0" |
| (5) Behavior #5 | only a POST `/login` layer (test above); doc updated |
| comments per code-comments.md | no `//` comment added; removed a `@swagger` block for the deleted route only (functional doc, matches the route) |

## Supersedes: none

## Noticed, not done
- Not live-tested over HTTP: `GET /api/v1/auth/login` → 404 relies on the app's existing unknown-route handler; the test proves no GET layer exists.

## Seal gate
none yet — `/ship` after SEAL, operator approves each push.
