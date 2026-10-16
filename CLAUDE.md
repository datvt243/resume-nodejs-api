# Resume API — Backend

Node.js/TypeScript REST API for managing candidate CVs/resumes with auth, PDF export, Redis caching, and Winston logging.

**Version**: 1.9.0 | **Author**: DatVT | **License**: ISC

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js + TypeScript 5.5 (strict, CommonJS) |
| Framework | Express 4.19 |
| Database | MongoDB + Mongoose 8.4 |
| Cache / Blacklist | Redis 4.6 (in-memory fallback) |
| Auth | JWT (access + refresh), Bcrypt (12 rounds) |
| Validation | Joi 17.13 |
| PDF | Puppeteer 22.13 + PDFKit 0.15 + Pug 3.0 (classic template); `pdf-lib` (PDF metadata) + `pdf-parse` (ATS text extraction) + `xss` (sanitization) for the ATS template |
| Logging | Winston 3.19 + daily-rotate-file |
| Testing | Jest 29 + ts-jest |
| Linting | ESLint 9 (flat config, type-aware via `typescript-eslint`) |

TypeScript runs with `strict` plus `noUncheckedIndexedAccess`,
`noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`,
`noUnusedLocals`/`noUnusedParameters`, `noImplicitOverride`, and
`noFallthroughCasesInSwitch` — no `any`, `!` non-null assertions, or
`@ts-ignore` in `src/` outside test mocks (enforced by
`eslint.config.mjs`'s `no-explicit-any`/`no-non-null-assertion`/
`no-unsafe-*` rules, relaxed only for `src/__tests__/**`).

---

## Commands

```bash
npm run dev          # ts-node + nodemon hot reload
npm run build        # tsc + copy views/public → dist/
npm start            # build + NODE_ENV=production node dist/server.js
npm test             # jest --passWithNoTests
npm run lint         # eslint .
npm run lint:fix     # eslint . --fix

npm run env:setup    # cp .env.example .env
npm run env:dev      # cp .env.development .env
npm run env:prod     # cp .env.production .env
npm run copy         # copy views + public to dist/ (post-build fix)
```

---

## Environment Variables

```
NODE_ENV=development
LOCAL_PORT=3001              # prod uses 3008
MONGO_URI=...                # full URI, or use MONGOBD_USER + MONGOBD_PASSWORD
MONGOBD_USER=...
MONGOBD_PASSWORD=...
TOKEN_SECRET=...             # 32+ chars, signs access tokens
TOKEN_REFRESH=...            # signs refresh tokens
TOKEN_EXP_IN=...             # access token expiry
SESSION_SECRET=...
REDIS_URL=redis://localhost:6379   # optional; fallback to in-memory if absent
MONGO_MAX_POOL_SIZE=10       # optional; MongoDB connection pool max size
MONGO_MIN_POOL_SIZE=2        # optional; MongoDB connection pool min size
CORS_ORIGIN=...              # comma-separated allow-list; required for the httpOnly cookie auth flow
                              # (credentials: true can't combine with a wildcard origin)
TOKEN_REFRESH_EXP_IN=7d      # optional; refresh token lifetime (default 7d)
```

---

## Project Structure

```
src/
├── server.ts                  # Entry: Express setup, MongoDB connect, Redis init
├── alias.ts                   # module-alias: @ → src/ (dev) or dist/ (prod)
├── config/
│   ├── process.config.ts      # Env var validation + export
│   ├── cors.config.ts         # CORS: CORS_ORIGIN allow-list (credentials: true)
│   ├── session.config.ts      # Express session config
│   ├── joi.config.ts          # Shared Joi schemas (email, password, phone, etc.)
│   ├── regex.config.ts        # Password + phone regex
│   └── swagger.config.ts      # OpenAPI spec (swagger-jsdoc), served at /api-docs
├── database/
│   └── mongo.db.ts            # Singleton MongoDB connection manager
├── middlewares/
│   ├── verifyToken.middleware.ts   # JWT extraction (Bearer/cookie/body/query) + blacklist +
│   │                                # session-revocation + CSRF check; attaches req.user._id,
│   │                                # forces req.body.candidateId
│   ├── csrf.middleware.ts          # Standalone CSRF check for routes not behind verifyToken
│   │                                # (/auth/refresh, /auth/logout)
│   ├── language.middleware.ts      # Resolves Accept-Language → req.lang / req.t(key)
│   ├── rateLimit.middleware.ts     # Redis-backed rate limit (100 req/15 min); mem fallback
│   ├── errors.middleware.ts        # Global error handler; AppError-aware; stack in dev only
│   ├── requestLogger.middleware.ts # Logs method, URL, status, duration via Winston
│   ├── uploadCV.middleware.ts      # Multer: candidate's own PDF résumé (max 5MB)
│   ├── uploadImages.middleware.ts  # Multer: CV-section image attachments
│   ├── uploadLinkedInExport.middleware.ts # Multer: LinkedIn export ZIP (max 20MB)
│   └── uploadCvPdfParse.middleware.ts # Multer: PDF CV for import parsing (max 5MB, memory only)
├── models/
│   ├── candidate.model.ts
│   ├── generalInformation.model.ts
│   ├── experience.model.ts
│   ├── education.model.ts
│   ├── project.model.ts
│   ├── certificate.model.ts
│   ├── award.model.ts
│   ├── reference.modal.ts
│   ├── application.model.ts   # Job application tracker (applied/interview/offer/rejected)
│   ├── profile.model.ts       # Named CV profile (multi-version): subset of section ids
│   ├── visit.model.ts         # One doc per public-profile visit (ip + geo + referrer host + viewed CV profile, no soft-delete)
│   └── part/index.ts          # Reusable sub-schemas (skills, languages, socialMedia, localizedText)
├── routers/
│   ├── api/v1/                # All active routes (see API section), incl. cv.route.ts (ATS self-check)
│   └── api/v2/                # Auth v2 (WIP: register/login only)
├── auth/
│   ├── auth.controller.ts
│   └── auth.service.ts
├── candidate/
│   ├── candidate.controller.ts
│   ├── candidate.service.ts
│   ├── candidate.validate.ts
│   ├── parseLinkedInExport.service.ts # Parses LinkedIn "Data export" ZIP → Education/Experience (stateless)
│   ├── visitStats.service.ts  # Visit stats aggregation: tz-aware zero-filled day/week/month series + country/source/profile breakdown
│   └── parseCvPdf.service.ts  # Parses an uploaded PDF CV's text → Education/Experience (heuristic, stateless)
├── candidate_profile/         # One controller+service+validate per CV section
│   ├── experience/
│   ├── education/
│   ├── general_information/
│   ├── awards/
│   ├── certificates/
│   ├── project/
│   ├── reference_information/
│   ├── application/            # Job application tracker CRUD
│   ├── profile/                # CV profile CRUD + ensureDefaultProfile()
│   ├── BaseController.ts      # baseGetAll()/baseDelete()/baseRestore()/baseUploadImages() shared
│   └── BaseService.ts         # createCrudService() factory shared across section services
├── candidate_me/
│   ├── index.ts               # Public profile aggregation (slug/email, i18n, ?profile= filter),
│   │                           # visit recording, PDF/JSON/DOCX export
│   ├── search.ts              # GET /api/me/search: keyword search over public, slugged profiles
│   ├── public-pdf.ts          # GET /api/me/:identifier/download-pdf: public ATS PDF, in-memory render cache
│   └── ats-check.ts           # POST /cv/ats-check: renders either PDF template in memory,
│                               # extracts text, scores the 10 ATS checks + optional JD keyword match
├── services/
│   ├── index.ts               # Core DB ops: baseFindDocument, baseCreateDocument,
│   │                           # baseUpdateDocument, basePatchDocument, baseDeleteDocument
│   │                           # (soft-delete), baseRestoreDocument
│   ├── redis.ts               # Redis client singleton (init/get/close/isAvailable)
│   ├── createPDF.ts           # Puppeteer PDF generation (createCV, pageRender — classic template)
│   ├── createPDF.ats.ts       # ATS-optimized template (pageRenderAts, createCVAts, renderAtsPdfBuffer) —
│   │                           # single column, no letter-spacing, sanitized text, localized headings
│   ├── pdfMetadata.ts         # Sets PDF Title/Author/Subject/Keywords/Language via pdf-lib
│   ├── atsExtract.ts          # extractPdfText() — pdf-parse wrapper for the ATS self-check
│   ├── atsChecks.ts           # The 10 ATS-safety check functions + weighted scoreChecks()
│   ├── keywordMatcher.ts      # Job-description keyword matcher (alias-aware, e.g. vue/vuejs/vue.js)
│   └── createDocx.ts          # docx-based Word export (same aggregated data as PDF)
├── utils/
│   ├── jwt.ts                 # jwtSign(), jwtVerify()
│   ├── bcrypt.ts              # bcryptGenerateSalt(), bcryptCompareHash()
│   ├── tokenBlacklist.ts      # Redis/mem blacklist; cleanup every 60s; key: blacklist:{token}; rotated refresh tokens carry a rotated-at marker
│   ├── sessionRevocation.ts   # "Logout of all devices" — per-candidate invalidated-at timestamp
│   ├── authCookies.ts         # Sets/clears httpOnly access+refresh JWT cookies
│   ├── csrf.ts                # requiresCsrfCheck()/isCsrfTokenValid() double-submit CSRF check
│   ├── slug.ts                # Vanity slug generation for public profile URLs
│   ├── i18n.ts                # t(key, lang), SUPPORTED_LANGS, DEFAULT_LANG (vi/en)
│   ├── emailVerification.ts   # Email-verification token issue/check (stub, logged not emailed)
│   ├── passwordReset.ts       # Forgot/reset-password token issue/check (stub, logged not emailed)
│   ├── helper.ts              # handleError, formatReturn, formatResponse, getSelectFields
│   ├── helper-auth.ts         # extractTokenFromRequest()/extractTokenWithSource() (header/body/query/cookie)
│   ├── valid.ts               # validateSchema() (Joi), validateModel() (Mongoose)
│   ├── querySafe.ts           # QuerySafe: blocks $ and javascript: to prevent NoSQL injection
│   ├── timeout.ts             # withTimeout, withDBTimeout(5s), withRedisTimeout(2s)
│   └── index.ts               # Re-exports all utils
├── errors/
│   └── index.ts               # AppError hierarchy (see Errors section)
├── types/
│   ├── base.type.ts           # BaseReturn interface, Collections enum
│   ├── candidate.type.ts      # AggregatedCandidateData + section data types, shared by PDF/DOCX export
│   └── express.d.ts           # Extends Express Request: user?: { _id: string }
├── logger/                    # Winston setup: console + combined + error logs; JSON in prod
├── constant/                  # App-wide constants, incl. atsKeywords.ts (ATS keyword dictionary)
├── views/                     # Pug templates for PDF
└── public/                    # Static assets + generated PDFs
```

---

## Express Middleware Stack (server.ts order)

1. Request logger (Winston)
2. Cookie parser (httpOnly JWT cookies → `req.cookies`)
3. Language middleware (`Accept-Language` → `req.lang` / `req.t(key)`)
4. Session middleware
5. CORS (`CORS_ORIGIN` allow-list, `credentials: true`)
6. Body parser (JSON + URL-encoded)
7. `GET /health` — exempt from rate limit
8. Swagger UI (`/api-docs`, `/api-docs.json`) — exempt from rate limit
9. Rate limiter (Redis or mem)
10. Static files (`public/`)
11. API router
12. Global error handler

Pug is set as view engine. Dev: port 3001, Prod: port 3008 (both respect `LOCAL_PORT` when set).

---

## API Endpoints

All v1 routes: `/api/v1/...` — JWT required except auth. Auth accepts either an
`Authorization: Bearer <token>` header or an httpOnly JWT cookie; cookie-only
state-changing requests must also pass the double-submit CSRF check (see Security).

### Auth `/api/v1/auth` (authLimiter: 150 req/15 min)

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create user, bcrypt hash password |
| POST / GET | `/login` | Validate + return access + refresh tokens (GET deprecated) |
| POST | `/logout` | Blacklist current token (CSRF-checked) |
| POST | `/logout-all` | Revoke every token issued to this candidate up to now |
| POST | `/refresh` | Rotate tokens; blacklist old refresh token (CSRF-checked); reuse of a rotated token > 10s later revokes all sessions |
| POST | `/forgot-password` | Request password reset (stub — logged, not emailed) |
| POST | `/reset-password` | Reset password using a reset token |
| GET | `/verify-email` | Verify email using a token issued on register (stub) |

`api/v2/auth` mirrors `/register` and `/login` only — still WIP.

### Candidate `/api/v1/candidate`

| Method | Path | Description |
|---|---|---|
| GET | `/:email` | Get profile by email |
| PUT | `/update` | Full update |
| PATCH | `/update` | Partial update |
| DELETE | `/` | Delete own account + all CV section data (self only, via `req.user._id`) |
| POST | `/upload-cv` | Upload own PDF résumé (multer, max 5MB) |
| GET | `/cv-file` | Download own uploaded résumé |
| POST | `/parse-linkedin-export` | Parse a LinkedIn "Data export" ZIP → Education/Experience entries; stateless, nothing persisted |
| POST | `/parse-cv-pdf` | Parse an existing PDF CV (max 5MB, memory only) → same Education/Experience shape + `extractedText`; best-effort heading/date-range heuristic (vi + en), stateless, nothing persisted |
| GET | `/visits` | Own public-profile visit count + list |
| GET | `/visits/stats` | Own visit stats: `?interval=day\|week\|month` (default `day`), inclusive local `from`/`to` (`YYYY-MM-DD`, default last 30 days), `?tz=` IANA zone (default `Asia/Ho_Chi_Minh`); zero-filled `series` (ISO weeks `YYYY-Www`) + `countries` from the recorded geo location + `sources` from the recorded referrer hostname (null = direct/unknown) + `profiles` (`{ profileId, name, deleted, count }`, null = default link; a profile deleted since keeps its row with `deleted: true`); ≤ 400 buckets |

### CV Sections + Application + Profile (all follow same CRUD pattern)

Sections: `education`, `experience`, `award`, `certificate`, `project`, `reference`, `generalInformation`, `application`, `profile`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all for authenticated user (optional `page`/`limit`/`sort` query) |
| POST | `/create` | Create entry |
| PUT | `/update` | Update entry |
| DELETE | `/delete/:id` | Soft-delete by ID (`deletedAt` set; ownership checked) |
| POST | `/restore/:id` | Restore a soft-deleted entry by ID |

`generalInformation` also has `PATCH /update`. `profile` (see `profile.model.ts`)
holds named subsets of the other sections' ids for tailoring a public share
link; `GET /` synthesizes a default "Tổng hợp" (All) profile on first read if
the candidate has none yet (`ensureDefaultProfile`). `education` and
`experience` also have `POST /bulk` (`{ items: [...] }`, up to 100 items,
best-effort — each item validated/created independently via the same
`fnBulkCreate` path as `/create`; response `data: { results, summary }`).

### Other

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check |
| GET | `/api/me/search` | None | Keyword search (`?q=` 2–100 chars, `page`/`limit` ≤ 100) over public profiles that have a slug — escaped case-insensitive substring on GeneralInformation `positionDesired`/`professionalSkills.name`, Experience `company`/`position`/`skills`, Education `school`/`major`; returns `{ items: [{ slug, firstName, lastName, positionDesired }], pagination }`, never email. Registered before `/api/me/:email` (a slug literally `search` is shadowed) |
| GET | `/api/me/:email` | None | Public profile by vanity slug (checked first) or email; `?lang=vi\|en` and `?profile=<id>` (filters sections to that CV profile) |
| GET | `/api/me/:identifier/download-pdf` | None | Public profile's ATS PDF (attachment, same renderer + metadata as the owner's `download-pdf?template=ats`); `?template=ats` only (anything else → 400), `?lang=`, `?profile=`. Private profile answers exactly like an unknown identifier. Rendered buffer cached in memory per sha256(resolved data) + lang (1h TTL, 50 entries, concurrent requests share one render), so a CV edit re-renders on the next request. Nothing written to disk |
| POST | `/api/me/:email/visit` | None | Record a visit (count, timestamp, IP, geo via `geoip-lite`); optional body `referrer` (the SPA's `document.referrer` — the request's own `Referer` header is ignored) stored as hostname only, `www.`/`m.` stripped, invalid → null; optional body `profile` (the `?profile=` id the visitor was shown) stored only if it is a non-deleted profile of that candidate, else null |
| GET | `/api/v1/download-pdf` | Token via query | Export own CV; `?format=pdf\|json\|docx` (default `pdf`), `?lang=vi\|en`, `?template=classic\|modern\|ats` (default `classic`; `modern` is an additional visual theme, applies to `pdf` and `docx`; `ats` is the ATS-optimized single-column template, PDF-only; `template` ignored for `format=json`) |
| POST | `/api/v1/cv/ats-check` | Bearer/cookie | Renders the candidate's own CV in memory (`template`/`lang` default `ats`/`vi`), extracts its text (`pdf-parse`), and scores it against 10 ATS-safety checks; optional `jobDescription` body field adds a keyword-coverage report |
| GET | `/api-docs` | None | Swagger UI (OpenAPI docs) |
| GET | `/api-docs.json` | None | Raw OpenAPI spec (JSON) |

---

## Auth Flow

1. `POST /auth/register` → validate Joi → check duplicate email → bcrypt(password, 12) → create Candidate doc
2. `POST /auth/login` → find by email → bcryptCompare → sign `accessToken` (TOKEN_SECRET) + `refreshToken` (TOKEN_REFRESH) with payload `{ _id: candidateId }` → set as httpOnly cookies (`utils/authCookies.ts`) and returned in the response body
3. All protected requests → `verifyToken` middleware → extract token (Bearer header, cookie, body, or query via `extractTokenWithSource`) → `jwtVerify` → check blacklist → check per-candidate session-revocation timestamp (`sessionRevocation.ts`) → if the request authenticated purely off the cookie, require a valid double-submit CSRF token → attach `req.user._id` and force `req.body.candidateId` to it
4. `POST /auth/refresh` → CSRF-checked → if the token was already rotated away: 403, and if that rotation was more than 10s ago (not a concurrent refresh) treat it as theft → `invalidateAllSessions` (once — a token already predating the last revocation doesn't re-trigger it) → otherwise verify refresh token → blacklist old refresh token with a rotated-at marker → issue new pair (refresh tokens carry a random `jti` so two issued in the same second never collide)
5. `POST /auth/logout` → CSRF-checked → add token to blacklist (Redis TTL = token remaining exp; mem fallback)
6. `POST /auth/logout-all` → bump the candidate's session-invalidated-at timestamp so every token issued before now is rejected on next use, even if not individually blacklisted or expired

---

## Models

All models use Mongoose with `timestamps: true` and `candidateId` foreign key (except Candidate). Every CV-section model plus `Application` and `Profile` carries a nullable `deletedAt: Number` for soft-delete/restore (`Visit` does not).

| Model | Key Fields |
|---|---|
| Candidate | email, password, firstName, lastName, gender, marital, birthday, address, phone, introduction, socialMedia, slug (vanity public-profile URL), cvFile ({ originalName, uploadedAt } metadata for the uploaded PDF résumé), isPublic (default true — gates whether `GET /api/me/:slug-or-email` returns anything), emailVerified (default false, informational only, doesn't gate login) |
| GeneralInformation | candidateId, position/career, professionalSkills[], personalSkills[], foreignLanguages[], workLocation, workForm |
| Experience | candidateId, company, position, startDate, endDate, isCurrent, description, skills[] |
| Education | candidateId, school, major, startDate, endDate, isCurrent, description |
| Project | candidateId, name, position, description, technology[], startDate, endDate, isWorking, images[], link |
| Certificate | candidateId, name, organization, startDate, endDate, isNoExpiration, link, images[], description |
| Award | candidateId, name, organization, issueDate, link, images[], description |
| Reference | candidateId, fullName, phone, company, position |
| Application | candidateId, company, position, appliedDate, status (`applied`\|`interview`\|`offer`\|`rejected`), note, jobLink |
| Profile | candidateId, name, educationIds[], experienceIds[], projectIds[], certificateIds[], awardIds[], referenceIds[] |
| Visit | candidateId, ip, location, referrer (hostname only, nullable), profileId (owned profile, nullable) (no `_id` override — see comment in `visit.model.ts` on why) |

Free-text fields on several models (e.g. Award/Certificate `description`, GeneralInformation `career`/`careerGoal`, Candidate `introduction`) use `localizedTextSchema` (`{ vi, en }`) resolved per-request by `?lang=`.

**Reusable sub-schemas** (`models/part/index.ts`): `foreignLanguageSchema`, `professionalSkillsSchema`, `personalSkills`, `socialMediaSchema`, `localizedTextSchema`

---

## Service Layer Pattern

`services/index.ts` exposes base DB operations used by all feature services:

- `baseFindDocument(props)` — query with NoSQL injection guard; optional `page`/`limit`/`sort`
- `baseCreateDocument(props)` — create with Mongoose validation + optional `hookAfterSave`/`hookHasErrors`
- `baseUpdateDocument(props)` — update with validation
- `basePatchDocument(props)` — partial update
- `baseDeleteDocument(props)` — soft-delete (`deletedAt`) with ownership check
- `baseRestoreDocument(props)` — clears `deletedAt`, same ownership check

`candidate_profile/BaseService.ts` (`createCrudService()`) wraps these into a
`{ handlerGet, handlerCreate, handlerUpdate, handlerDelete, ... }` factory used
by every CV-section service. `BaseController.ts` wraps `baseGetAll()`,
`baseDelete()`, `baseRestore()`, and `baseUploadImages()` (ownership-checked
image attachment) shared across all CV section controllers.

---

## Error Hierarchy (`errors/index.ts`)

```
AppError (base: statusCode, message, errorCode, isOperational)
├── ValidationError       400  VALIDATION_ERROR
├── BadRequestError       400  BAD_REQUEST
├── AuthenticationError   401  UNAUTHORIZED | NO_TOKEN
│   ├── InvalidCredentialsError   INVALID_CREDENTIALS
│   ├── TokenExpiredError         TOKEN_EXPIRED
│   ├── TokenRevokedError         TOKEN_REVOKED
│   └── InvalidTokenError         INVALID_TOKEN
├── AuthorizationError    403  FORBIDDEN | INSUFFICIENT_PERMISSIONS | CSRF_TOKEN_INVALID
├── NotFoundError         404  NOT_FOUND
└── ConflictError         409  CONFLICT
```

Global error middleware catches all `AppError` instances, logs via Winston, and returns `{ errorCode, message, stack? }` (stack dev-only).

---

## Security

- **NoSQL injection**: `QuerySafe` class in `utils/querySafe.ts` blocks `$` operators and `javascript:` patterns before any DB query
- **Password**: bcrypt with 12 salt rounds
- **Token blacklist**: Redis `blacklist:{token}` with TTL; in-memory Map fallback; cleanup job every 60s. Value `revoked` (logout) or `rotated:<unix s>` (refresh rotation)
- **Refresh-token reuse detection**: a rotated-away refresh token presented again after a 10s grace window revokes every session of that candidate (same mechanism as logout-all); the response is the same 403 as any revoked token
- **Session revocation**: `utils/sessionRevocation.ts` — logout-all invalidates every token issued before the recorded timestamp, independent of blacklist/expiry
- **CSRF**: double-submit check (`utils/csrf.ts`) required whenever a state-changing request authenticated purely off the httpOnly cookie (no Bearer header) — enforced inline in `verifyToken` and standalone via `csrf.middleware.ts` on `/auth/refresh` and `/auth/logout`, which sit outside `verifyToken`
- **IDOR**: `verifyToken` always overwrites `req.body.candidateId` with the authenticated `req.user._id` — handlers must never trust a client-supplied `candidateId`
- **Rate limiting**: Redis-backed (100 req/15 min general, 150 req/15 min auth); Redis failure falls back to in-memory
- **Token extraction**: Supports Bearer header, request body, query param, and httpOnly cookie
- **CORS**: `CORS_ORIGIN` allow-list with `credentials: true` — a wildcard origin cannot be combined with credentialed cookies
- **i18n**: `utils/i18n.ts` / `language.middleware.ts` resolve vi/en from `Accept-Language`; error/response messages and localized model fields respect it

---

## Testing

```bash
npm test                         # run all tests
```

- Config: `jest.config.ts` — preset `ts-jest`, root `src/`, module alias `@/* → src/*`, coverage from `src/**/*.{js,ts}`
- Test files: `src/__tests__/`, mirroring `src/` by feature

| Test File | Coverage |
|---|---|
| auth/auth.service.test.ts | register, login, email check (mocks: CandidateModel, bcrypt, JWT) |
| auth/auth.controller.test.ts | controller layer |
| auth/refreshToken.test.ts | token rotation + reuse of a rotated token (grace window, unverifiable token, no repeat revocation, same 403 as logout) |
| auth/refreshTokenReuse.test.ts | end-to-end reuse-after-rotation on real jwt + in-memory blacklist/session stores (fake clock) |
| auth/tokenExpiry.test.ts | real `jwtSign`/`jwtVerify` — access vs refresh `TOKEN_EXP_IN`/`TOKEN_REFRESH_EXP_IN` wiring |
| auth/v2AuthRoute.test.ts | v2 auth route wiring (register/login only) |
| candidate/candidate.controller.test.ts | candidate controller (upload/download CV, visits, etc.) |
| candidate/candidate.service.test.ts | password field exclusion + `handlerDelete` cascade/file cleanup |
| candidate/parseLinkedInExport.service.test.ts | LinkedIn export ZIP/CSV parsing |
| candidate/visitStats.service.test.ts | visit stats: query validation/defaults, tz + DST bucket boundaries, ISO-week/month labels, zero-fill, own-id-only, `sources` + `profiles` facets |
| candidate/parseCvPdf.service.test.ts | PDF CV parsing heuristics (vi + en fixture text) + unreadable-PDF rejection |
| candidate_me/index.test.ts | public profile aggregation, visit recording (incl. referrer hostname normalization, owned-profile-id check), export |
| candidate_me/public-pdf.test.ts | public ATS PDF: attachment headers, private == unknown response, template allow-list, cache hit/miss/TTL/eviction, concurrent dedupe, failed render not cached |
| candidate_me/search.test.ts | public search: only public + slugged candidates, field whitelist, regex escaping, pagination, `q` validation |
| candidate_profile/BaseController.test.ts | shared getAll/delete/restore/upload-images controller |
| candidate_profile/BaseService.test.ts | `createCrudService().handlerCreate` real CV-section create flow |
| candidate_profile/profile.service.test.ts | CV profile CRUD + default-profile synthesis |
| config/cors.config.test.ts | CORS allow-list behavior |
| middlewares/verifyToken.test.ts | token extraction + blacklist + session-revocation + CSRF check |
| middlewares/csrf.test.ts | CSRF middleware |
| middlewares/rateLimit.test.ts | rate limiting logic |
| middlewares/requestLogger.test.ts | request logging |
| middlewares/uploadCvPdfParse.test.ts | PDF-only / 5MB limit / memory storage over a real multipart request |
| middlewares/language.test.ts | `Accept-Language` → `req.lang`/`req.t()` resolution |
| services/baseCreateDocument.test.ts | `hookAfterSave` propagation on create |
| services/baseFindDocument.test.ts | query/pagination/sort |
| services/baseSoftDelete.test.ts | soft-delete behavior |
| services/baseUpdatePatchSoftDelete.test.ts | update/patch interaction with soft-delete |
| services/createPDF.test.ts | PDF export (classic template) + `formatDate`/`getSkills` regressions |
| services/createDocx.test.ts | DOCX export |
| services/createPDF.ats.test.ts | ATS template HTML — no letter-spacing/images/flex-grid, localized headings, sanitized description |
| services/atsChecks.test.ts | Each of the 10 ATS check functions, passing + failing fixtures |
| services/keywordMatcher.test.ts | JD keyword matcher — alias handling, case-insensitivity, Vietnamese diacritics |
| services/atsPdfIntegration.test.ts | Real Puppeteer + `pdf-parse` end-to-end: renders a fixture CV, extracts text, asserts the full ATS check suite passes, and round-trips it (vi + en) through the PDF CV import parser (skipped via `CI_NO_CHROME`) |
| utils/authCookies.test.ts | httpOnly cookie set/clear |
| utils/tokenBlacklist.test.ts | rotated-at marker vs logout entry, Redis + in-memory |
| utils/csrf.test.ts | double-submit CSRF token validation |
| utils/bcrypt.test.ts | hash + compare |
| utils/valid.test.ts | Joi + Mongoose validation |
| utils/helper.test.ts | response/format helpers |
| utils/i18n.test.ts | `t()`/`tErrorType()` lookup, `SUPPORTED_LANGS`/`DEFAULT_LANG` |
| database/mongo.db.ts | DB connection |

---

## Logging

Winston config in `src/logger/`:
- **Console**: all levels in dev; errors only in prod
- **Combined log**: `logs/combined-YYYY-MM-DD.log` (daily rotation)
- **Error log**: `logs/error-YYYY-MM-DD.log`
- Format: simple in dev, JSON in prod

---

## Path Aliases

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` (dev via tsconfig-paths) / `dist/*` (prod via module-alias) |

Always import as `@/utils/helper`, `@/models/candidate.model`, etc.

---

## Build Notes

- `npm run build` = `tsc && npm run copy`
- `copy` step: `cp -R ./src/views ./src/public ./dist/` — required because Pug templates and static assets are not compiled by tsc
- If build succeeds but PDF/views break in prod: run `npm run copy` manually
- `dist/` is gitignored; always rebuild before deploying
