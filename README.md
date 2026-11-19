# Resume API — Backend

REST API (Node.js + TypeScript) for managing candidate profiles (CVs): JWT login, per-section CV management, multiple CV versions, public profile links, PDF/DOCX export (including an ATS-optimized template), and job application tracking. This is the backend for [resume-vuejs-website](https://github.com/datvt243/resume-vuejs-website).

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Running with Docker](#running-with-docker)
- [API documentation](#api-documentation)
- [Common commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [Tech stack](#tech-stack)
- [Contributing](#contributing)
- [Author & License](#author--license)

## Features

- **Authentication** — JWT access/refresh (httpOnly cookie or Bearer), bcrypt, CSRF, token blacklist, log out of every device, refresh-token reuse detection, forgot/reset password and email verification (links emailed over SMTP)
- **CV profile** — candidate information, education, experience (with career breaks), projects, awards, certificates, references; soft delete and restore
- **Multiple CV versions** — each version is a subset of the entries, with its own public link and PDF
- **Public profile** — custom slug, public profile search, view statistics (country, traffic source, CV version)
- **CV export** — PDF / JSON / DOCX, several templates (`classic`, `modern`, `ats`); self-scoring of the CV against 10 ATS criteria + keyword matching against a job description
- **CV import** — from a LinkedIn export file (ZIP) or from an existing CV PDF
- **Application tracking** — applied / interview / offer / rejected, linked to the CV version that was sent
- **Bilingual** — Vietnamese/English via `Accept-Language` or `?lang=`
- **Operations** — rate limit (Redis, falls back to in-memory when Redis is absent), daily Winston logs, `/health`, Swagger at `/api-docs`

## Quick start

Requirements: Node.js `>=20.19.0 <23.0.0` (see `engines` in `package.json` — newer Node drops `Buffer.SlowBuffer`, which a `jsonwebtoken` dependency still uses), MongoDB, Redis (optional).

```bash
npm install
npm run env:setup     # cp .env.example .env, then fill in the values
npm run dev           # → http://localhost:3001/health
```

Minimum environment variables in `.env`:

```
NODE_ENV=development
LOCAL_PORT=3001
MONGO_URI=...                     # or MONGOBD_USER + MONGOBD_PASSWORD
TOKEN_SECRET=...                  # 32+ characters
TOKEN_REFRESH=...
REDIS_URL=redis://localhost:6379  # optional
CORS_ORIGIN=https://your-frontend.example   # required for the httpOnly cookie flow
```

Full list: [`.env.example`](.env.example). Redis on macOS: `brew install redis && redis-server`.

## Running with Docker

No need to install Node/Mongo locally — both run in containers (MongoDB 7, with a data volume). Redis is intentionally not containerized; the app uses in-memory storage when `REDIS_URL` is missing.

```bash
# Dev: hot reload, built-in dev secrets, no .env needed
docker compose up --build                                  # → http://localhost:3001/health

# Prod: built image, needs real secrets in .env
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build    # → http://localhost:3008/health
```

## API documentation

- **Swagger UI**: `/api-docs` (JSON spec: `/api-docs.json`) — the complete and most up-to-date source for every endpoint.
- **Response/error standard**: [`API-STANDARD.md`](API-STANDARD.md).
- Every `/api/v1/...` route requires a JWT, except the auth group. Send `Authorization: Bearer <token>` or use the httpOnly cookie; when using the cookie only, state-changing requests must include a CSRF token.
- Public profiles (`/api/me/...`) need no login.

## Common commands

```bash
npm run dev        # hot reload
npm run build      # tsc + copy public → dist/
npm start          # build + run production
npm test           # Jest
npm run lint       # ESLint (npm run lint:fix to autofix)
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Can't connect to Mongo | Check `MONGO_URI` or `MONGOBD_USER`/`MONGOBD_PASSWORD` |
| No Redis | Install Redis, or unset `REDIS_URL` to use in-memory storage |
| CSRF error | Cookie-only requests (no Bearer) must include a CSRF token |
| Build succeeds but static files / uploads are missing | `npm run copy` |
| Need to read logs | The `logs/` directory |

## Tech stack

Node.js · Express 4 · TypeScript 5 (strict) · MongoDB + Mongoose 8 · Redis 4 · JWT + bcrypt · Joi · Puppeteer + pdf-lib + pdf-parse · docx · multer · Winston · Swagger · Jest · ESLint 9

## Contributing

- `main` and `staging` are both GitHub-protected: no direct push, PRs required, CI must be green.
- Branch off `staging`, open PRs into `staging`. `main` only receives code from `staging` through the release step; a push to `main` auto-deploys to Render.
- Details and rationale: [`CONTRIBUTING.md`](CONTRIBUTING.md). Code conventions for AI agents: [`CLAUDE.md`](CLAUDE.md).
- Bug reports / suggestions: [GitHub Issues](https://github.com/datvt243/resume-nodejs-api/issues).

## Author & License

**Đạt Võ** — [@datvt243](https://github.com/datvt243)

License: ISC (declared in `package.json`; the repo has no `LICENSE` file yet).
