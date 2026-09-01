# TODO — Resume API Backend

> Last updated: 2026-07-05
> Overall assessment: Core features are solid. Auth, CRUD for all CV sections, PDF export, rate limiting, logging are complete. Main gaps: test coverage for CV sections, API v2 incomplete, security headers missing, no pagination/filtering, no upload endpoint.
>
> GitHub issues tracked: [datvt243/resume-nodejs-api](https://github.com/datvt243/resume-nodejs-api/issues) — 8 closed, 5 open

---

## Legend

| Status | Meaning |
|---|---|
| ✅ done | Implemented and working |
| 🔄 in-progress | Partially implemented / has known gaps |
| ❌ todo | Not yet started |
| 🐛 bug/risk | Works but has a correctness or security concern |

---

## 1. Authentication

| # | Feature | File(s) | Status | Notes |
|---|---|---|---|---|
| 1.1 | Register | `auth/auth.service.ts`, `auth/auth.controller.ts` | ✅ done | |
| 1.2 | Login | `auth/auth.service.ts`, `auth/auth.controller.ts` | ✅ done | |
| 1.3 | Logout (token blacklist) | `auth/auth.controller.ts`, `utils/tokenBlacklist.ts` | ✅ done | |
| 1.4 | Refresh token rotation | `auth/auth.controller.ts` | ✅ done | Old refresh token blacklisted on rotate |
| 1.5 | Password strength requirements | `config/regex.config.ts`, `plugins/joi/index.ts` | ✅ done | [#15](https://github.com/datvt243/resume-nodejs-api/issues/15) min 12 chars, uppercase/lowercase/number/special |
| 1.6 | Validate data with Mongoose model before save | `auth/auth.service.ts:40` | 🔄 in-progress | TODO comment — currently skips model-level validation |
| 1.7 | `authCreateRefreshToken` (v1 API alt) | `api/v1/auth/controllers/refreshTokenCreate.ts` | 🔄 in-progress | Empty body — "coming soon" |
| 1.8 | Email verification on register | — | ❌ todo | No email sending logic |
| 1.9 | Forgot password / reset password | — | ❌ todo | [#15](https://github.com/datvt243/resume-nodejs-api/issues/15) mentioned reset flow — not implemented |

---

## 2. Candidate Profile

| # | Feature | File(s) | Status | Notes |
|---|---|---|---|---|
| 2.1 | Get candidate by email | `candidate/candidate.controller.ts` | ✅ done | |
| 2.2 | Full update (PUT) | `candidate/candidate.controller.ts` | ✅ done | |
| 2.3 | Partial update (PATCH) | `candidate/candidate.controller.ts` | ✅ done | |
| 2.4 | Public profile (no auth) | `candidate_me/index.ts` | ✅ done | Aggregates all sections, strips password |

---

## 3. CV Sections (Experience / Education / Award / Certificate / Project / Reference / GeneralInformation)

| # | Feature | Status | Notes |
|---|---|---|---|
| 3.1 | List all (GET /) | ✅ done | All 7 sections |
| 3.2 | Create (POST /create) | ✅ done | All 7 sections |
| 3.3 | Update (PUT /update) | ✅ done | All 7 sections |
| 3.4 | Delete (DELETE /delete/:id) | ✅ done | All 7 sections, ownership-checked |
| 3.5 | Patch generalInformation (PATCH /update) | ✅ done | |
| 3.6 | Pagination on list endpoints | ❌ todo | All GETs return full collection, no page/limit |
| 3.7 | Sorting / filtering on list endpoints | ❌ todo | |
| 3.8 | Image upload for project / certificate / award | ❌ todo | `images[]` field exists in models but no upload endpoint |

---

## 4. PDF Export

| # | Feature | File(s) | Status | Notes |
|---|---|---|---|---|
| 4.1 | Generate CV as PDF | `services/createPDF.ts` | ✅ done | Puppeteer, A4 format |
| 4.2 | Download PDF endpoint | `routers/index.ts` + `candidate_me/index.ts` | ✅ done | Auth via query token |
| 4.3 | Hardcoded Chrome executable path | `services/createPDF.ts:14-25` | 🐛 bug/risk | Breaks if Chrome not at expected path (CI/Docker) — use `puppeteer.executablePath()` or env var |
| 4.4 | PDF template coverage | `services/createPDF.ts` + `views/` | 🔄 in-progress | All sections rendered but styling/layout not verified on all data variations |

---

## 5. Security

| # | Feature | File(s) | Status | Notes |
|---|---|---|---|---|
| 5.1 | JWT access + refresh tokens | `utils/jwt.ts` | ✅ done | |
| 5.2 | Bcrypt password hashing (12 rounds) | `utils/bcrypt.ts` | ✅ done | |
| 5.3 | Token blacklist (Redis + mem fallback) | `utils/tokenBlacklist.ts` | ✅ done | |
| 5.4 | NoSQL injection prevention (QuerySafe) | `utils/querySafe.ts` | ✅ done | [#13](https://github.com/datvt243/resume-nodejs-api/issues/13) Blocks `$` operators and `javascript:` patterns |
| 5.5 | Rate limiting (Redis + mem fallback) | `middlewares/rateLimit.middleware.ts` | ✅ done | [#14](https://github.com/datvt243/resume-nodejs-api/issues/14) 100 req/15min general, 150 auth |
| 5.6 | CORS open to all origins | `config/cors.config.ts:8` | 🐛 bug/risk | `origin: '*'` — should restrict to known origins in production |
| 5.7 | HTTP security headers (Helmet) | — | ❌ todo | [#13](https://github.com/datvt243/resume-nodejs-api/issues/13) mentioned helmet — not added |
| 5.8 | Request body size limit | `server.ts` | ❌ todo | No `limit` on `bodyParser.json()` — DoS risk |
| 5.9 | XSS input sanitization | — | ❌ todo | No output encoding or sanitize-html layer |
| 5.10 | HTTPS enforcement / HSTS | — | ❌ todo | No redirect or header enforcement |

---

## 6. API Versioning

| # | Feature | File(s) | Status | Notes |
|---|---|---|---|---|
| 6.1 | API v1 — all endpoints | `routers/api/v1/` | ✅ done | Auth, Candidate, 7 CV sections |
| 6.2 | API v2 — auth register + login | `routers/api/v2/auth.route.ts` | 🔄 in-progress | Only register + login; no logout, refresh, or any CV section routes |
| 6.3 | API v2 — remaining routes | — | ❌ todo | |

---

## 7. Infrastructure & Config

| # | Feature | File(s) | Status | Notes |
|---|---|---|---|---|
| 7.1 | MongoDB connection (singleton) | `database/mongo.db.ts` | ✅ done | [#32](https://github.com/datvt243/resume-nodejs-api/issues/32) updated |
| 7.2 | Redis client (singleton, optional) | `services/redis.ts` | ✅ done | Non-blocking init; graceful fallback |
| 7.3 | Winston logging (daily rotation) | `logger/` | ✅ done | [#17](https://github.com/datvt243/resume-nodejs-api/issues/17) |
| 7.4 | Health check endpoint | `server.ts:51` | ✅ done | `GET /health` — exempt from rate limit |
| 7.5 | Environment validation (Joi) | `config/process.config.ts` | ✅ done | |
| 7.6 | Async/await patterns audit | various | ✅ done | [#20](https://github.com/datvt243/resume-nodejs-api/issues/20) completed |
| 7.7 | Graceful shutdown (MongoDB + Redis close) | `server.ts:104` | 🔄 in-progress | `exitHook` is commented out — connections not closed on SIGTERM |
| 7.8 | MongoDB query optimization (indexes, pooling) | `database/mongo.db.ts`, `models/` | ❌ todo | [#23](https://github.com/datvt243/resume-nodejs-api/issues/23) Add index on email, compound indexes, enable pooling |
| 7.9 | Docker / Docker Compose setup | — | ❌ todo | [#24](https://github.com/datvt243/resume-nodejs-api/issues/24) Dockerfile + docker-compose (include Mongo) for dev + prod |
| 7.10 | CI/CD pipeline | — | ❌ todo | No GitHub Actions config |
| 7.11 | Production CORS restriction | `config/cors.config.ts` | ❌ todo | See 5.6 |

---

## 8. Testing

| # | Test | File | Status | Notes |
|---|---|---|---|---|
| 8.1 | auth.service — register, login, email check | `__tests__/auth/auth.service.test.ts` | ✅ done | [#19](https://github.com/datvt243/resume-nodejs-api/issues/19) |
| 8.2 | auth.controller — all handlers | `__tests__/auth/auth.controller.test.ts` | ✅ done | [#19](https://github.com/datvt243/resume-nodejs-api/issues/19) |
| 8.3 | Refresh token controller | `__tests__/auth/refreshToken.test.ts` | ✅ done | |
| 8.4 | verifyToken middleware | `__tests__/middlewares/verifyToken.test.ts` | ✅ done | [#18](https://github.com/datvt243/resume-nodejs-api/issues/18) |
| 8.5 | rateLimit middleware | `__tests__/middlewares/rateLimit.test.ts` | ✅ done | |
| 8.6 | requestLogger middleware | `__tests__/middlewares/requestLogger.test.ts` | 🐛 bug/risk | **Empty file (0 bytes)** — no tests written |
| 8.7 | bcrypt utils | `__tests__/utils/bcrypt.test.ts` | ✅ done | |
| 8.8 | Joi/Mongoose validation utils | `__tests__/utils/valid.test.ts` | ✅ done | |
| 8.9 | MongoDB connection | `__tests__/database/mongo.db.ts` | ✅ done | |
| 8.10 | CV sections — experience, education, award, certificate, project, reference, generalInformation | — | ❌ todo | **Zero tests** for all 7 CV section controllers + services |
| 8.11 | candidate controller / service | — | ❌ todo | |
| 8.12 | candidate_me (public profile + PDF export) | — | ❌ todo | |
| 8.13 | services/index.ts (base DB operations) | — | ❌ todo | |
| 8.14 | querySafe utility | — | ❌ todo | |
| 8.15 | tokenBlacklist utility | — | ❌ todo | |
| 8.16 | Integration / E2E tests | — | ❌ todo | All tests are unit with mocks; no real DB integration tests |

---

## 9. API Documentation

| # | Feature | Status | Notes |
|---|---|---|---|
| 9.1 | Swagger / OpenAPI spec | ❌ todo | [#22](https://github.com/datvt243/resume-nodejs-api/issues/22) swagger-jsdoc + swagger-ui-express, document all endpoints with request/response schemas |
| 9.2 | Postman collection | ❌ todo | |

---

## 10. Code Quality

| # | Issue | File(s) | Status | Notes |
|---|---|---|---|---|
| 10.1 | Duplicate auth implementation | `src/auth/` vs `src/api/v1/auth/` | 🔄 in-progress | Two parallel auth implementations — v1 routes use `api/v1/auth/controllers`, but `auth/` also exists and is tested. Should consolidate. |
| 10.2 | `authCreateRefreshToken` — empty body | `api/v1/auth/controllers/refreshTokenCreate.ts` | ❌ todo | |
| 10.3 | Error messages mixed in Vietnamese/English | various | 🔄 in-progress | Response messages inconsistent — should pick one language |
| 10.4 | `exitHook` import commented out | `server.ts:15,104` | ❌ todo | Implement graceful shutdown |
| 10.5 | Token expiry not set in JWT sign calls | `auth/auth.service.ts:79-80` | 🐛 bug/risk | `jwtSign({ _id }, TOKEN_SECRET)` — no `expiresIn` option passed; token never expires unless `TOKEN_SECRET` encodes it |
| 10.6 | Consistent response format | various | 🔄 in-progress | Some handlers use `formatReturn`, others use `res.status().json()` directly |
| 10.7 | DRY refactor — repeated code patterns | various | ❌ todo | [#21](https://github.com/datvt243/resume-nodejs-api/issues/21) e.g. `getSelectFields → Object.keys`, consolidate validation helpers across CV section services |
