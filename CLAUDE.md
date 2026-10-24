# Resume API — Backend

Node.js/TypeScript REST API for managing candidate CVs/resumes with auth, PDF export, Redis caching, and Winston logging.

## Stack

- Node.js + TypeScript 5.5 (strict, CommonJS) · Express 4 · MongoDB + Mongoose 8
- Redis 4 (cache, token blacklist, rate limit — every use has an in-memory fallback)
- JWT (access + refresh) + bcrypt (12 rounds) · Joi validation
- Puppeteer PDF (classic template in `createPDF.ts`); ATS template adds `pdf-lib` (metadata), `pdf-parse` (text extraction), `xss` (sanitization)
- Winston + daily-rotate-file · Jest 29 + ts-jest · ESLint 9 (flat config, type-aware)

TypeScript runs with `strict` plus `noUncheckedIndexedAccess`,
`noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`,
`noUnusedLocals`/`noUnusedParameters`, `noImplicitOverride`, and
`noFallthroughCasesInSwitch` — no `any`, `!` non-null assertions, or
`@ts-ignore` in `src/` outside test mocks (enforced by
`eslint.config.mjs`'s `no-explicit-any`/`no-non-null-assertion`/
`no-unsafe-*` rules, relaxed only for `src/__tests__/**`).

## Commands

```bash
npm run dev          # ts-node + nodemon hot reload
npm run build        # tsc + copy public → dist/ (this is the typecheck)
npm start            # build + NODE_ENV=production node dist/server.js
npm test             # jest --passWithNoTests
npx jest <path>      # one test file
npm run lint         # eslint . (lint:fix to autofix)

npm run env:setup    # cp .env.example .env
npm run env:dev      # cp .env.development .env
npm run env:prod     # cp .env.production .env
```

- Build gotcha: `tsc` doesn't copy static assets. If static files/uploads break in prod, run `npm run copy` (`cp -R ./src/public ./dist/`). `dist/` is gitignored — always rebuild before deploying.
- Tests live in `src/__tests__/`, mirroring `src/` by feature. The real-Puppeteer ATS integration test is skipped when `CI_NO_CHROME` is set.

## Environment Variables

```
NODE_ENV=development
LOCAL_PORT=3001              # unset → 3001 dev / 3008 prod
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

## Conventions

- Always import via the `@/` alias (`@/utils/helper`) — `src/*` in dev (tsconfig-paths), `dist/*` in prod (module-alias, `src/alias.ts`).
- Middleware order is `runServer` in `src/server.ts`. `/health` and `/api-docs` are registered before the rate limiter on purpose (exempt).
- New CV section → `src/candidate_profile/<section>/` controller + service + validate, built on `createCrudService()` (`BaseService.ts`) and `BaseController.ts`, like the existing sections.
- CV-section models + `Application` + `Profile` soft-delete via nullable `deletedAt` (`Visit` doesn't). Localized free-text fields use `localizedTextSchema` (`{ vi, en }`), resolved per request by `?lang=`.
- Errors: services throw `AppError` subclasses (`src/errors/`), never return `{ success:false }`. Every status comes from the `ERROR_STATUS` map in `errors/AppError.ts`; `withTimeout` throws `SERVICE_UNAVAILABLE` (503) on a DB/Redis timeout.
- Every error response is written by `sendError` (`utils/helper.ts`): `{ success:false, error:{ code, message, details?, stack? } }` (stack dev-only), `details` = `{ field: fullDottedPath, message }[]`. Success: `{ success:true, message, data, meta? }`; every list returns `data: []` + `meta` (`{ page, limit, total, totalPages }`). Contract: `API-STANDARD.md`.
- Logs: `logs/combined-YYYY-MM-DD.log` + `logs/error-YYYY-MM-DD.log`; console shows errors only in prod; JSON format in prod.

## Security invariants

- **IDOR**: `verifyToken` always overwrites `req.body.candidateId` with `req.user._id` — handlers must never trust a client-supplied `candidateId`.
- **NoSQL injection**: every DB query goes through `QuerySafe` (`utils/querySafe.ts`), which blocks `$` operators and `javascript:`.
- **CSRF**: double-submit check (`utils/csrf.ts`) whenever a state-changing request authenticated purely off the httpOnly cookie (no Bearer header) — inline in `verifyToken`, standalone via `csrf.middleware.ts` on `/auth/refresh` and `/auth/logout` (outside `verifyToken`).
- **Tokens**: Redis blacklist `blacklist:{token}` with TTL (value `revoked` or `rotated:<unix s>`), in-memory fallback. A rotated-away refresh token reused after a 10s grace window revokes every session of that candidate (same mechanism as logout-all, `utils/sessionRevocation.ts`).
- **Rate limit**: 100 req/15 min general, 150 req/15 min auth; Redis failure falls back to in-memory.
- **CORS**: `CORS_ORIGIN` allow-list with `credentials: true` — never a wildcard.

## Path-scoped detail (`.claude/rules/`)

- `api.md` — every endpoint + the auth flow (loads when touching routers, controllers, middlewares, utils, config).
- `models.md` — model fields + the base service layer (loads when touching models/services/CV sections).

## Workflow

- Tracked code work goes through agent-hub (`agent-hub/README.md`): `/todo "<task>"` or `/worker implementer` → `/worker verifier` → `/ship [--merge]`.
- Never push directly to `main` or `staging` (GitHub-protected, PR-only). Branch off `staging`, PR into `staging`; `staging` → `main` only via `/release`. Full rationale: `CONTRIBUTING.md`.
