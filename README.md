# 📄 Resume API - Backend

Một ứng dụng API backend **hoàn chỉnh** để **quản lý hồ sơ ứng viên (CV/Resume)** với **JWT (cookie + Bearer)**, **CSRF protection**, **Redis rate limiting**, **token blacklist**, **CV profiles (multi-version)**, **job application tracker**, **LinkedIn export import**, **PDF/DOCX export**, **i18n (vi/en)**, **Winston logging**, và **Jest testing**.

**Version**: 1.9.0 | **Author**: DatVT | **License**: ISC

---

## 🎯 Features

- 🔐 **Authentication**: JWT (access/refresh, httpOnly cookie or Bearer), Bcrypt, CSRF protection, Token Blacklist (Redis), logout-all, forgot/reset password + email verification (stubs)
- 👤 **Profile**: Candidate info + General (skills, languages, career) + shareable vanity slug
- 📚 **Education** / 💼 **Experience** / 🏆 **Awards** / 📜 **Certificates** / 🚀 **Projects** / 👥 **References**
- 🗂️ **CV Profiles** (multi-version): named subsets of CV sections for tailoring what a public link shows
- 📋 **Job Application Tracker**: applied/interview/offer/rejected pipeline per candidate
- 📎 **LinkedIn Import**: parse a LinkedIn "Data export" ZIP into Education/Experience entries for review
- 🔍 **Public Profile Search**: keyword search over public candidate profiles (skills, position, company, school)
- 📄 **PDF CV Import**: parse an existing PDF CV into the same Education/Experience entries for review (best-effort)
- 📤 **CV File Upload/Download**: store and retrieve a candidate's own PDF résumé
- 📊 **Public Profile Visits**: per-visit analytics (IP + geo + referrer host + viewed CV profile) on public profile views
- 🗑️ **Soft Delete + Restore**: recoverable deletes across all CV sections
- 🌐 **i18n**: Vietnamese/English via `Accept-Language`, localized free-text fields (career, descriptions, introduction)
- 📄 **PDF/JSON/DOCX Export** (Pug + PDFKit/Puppeteer/docx)
- 🤖 **ATS-Optimized PDF + Self-Check**: single-column, no-letter-spacing export template built for Applicant Tracking Systems, plus a self-check endpoint that extracts the PDF's own text and scores it against 10 ATS-safety checks + optional job-description keyword matching
- 🛡️ **Rate Limiting** (Redis/mem fallback)
- 📊 **Logging** (Winston daily)
- 🧪 **Tests** (Jest: auth/middlewares/utils/DB)
- ✅ **Health**: `/health` endpoint
- 📘 **API Docs**: Swagger UI at `/api-docs`, raw spec at `/api-docs.json`

## 🛠️ Tech Stack

### Core

| Category  | Tech                       |
| --------- | -------------------------- |
| Runtime   | Node.js `>=20.19.0 <23.0.0`|
| Framework | Express 4.19.2             |
| Language  | TypeScript 5.5.4 (strict + `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, etc.) |
| Linting   | ESLint 9 (flat config, type-aware) |

### Database & Cache

| Tech               | Version | Purpose                |
| ------------------ | ------- | ---------------------- |
| MongoDB + Mongoose | 8.4.0   | Data                   |
| Redis              | 4.6.0   | Rate limit / Blacklist |

### Auth & Security

| Tech               | Version | Purpose               |
| ------------------ | ------- | ---------------------- |
| JWT                | 9.0.2   | Tokens (access/refresh, cookie or Bearer) |
| Bcrypt             | 5.1.1   | Passwords              |
| express-rate-limit | 8.3.0   | Protection             |
| cookie-parser      | 1.4.7   | httpOnly JWT cookies   |
| geoip-lite         | 1.4.10  | Visit geo-location     |

### Utils

| Tech                              | Version         | Purpose                        |
| --------------------------------- | --------------- | ------------------------------- |
| Joi                                | 17.13.1         | Validation                      |
| PDFKit / Puppeteer / Pug          | 0.15/22.13/3.0  | PDF                              |
| docx                               | 9.7.1           | DOCX export                     |
| pdf-lib / pdf-parse / xss         | 1.17/1.1/1.0    | ATS PDF metadata, text extraction, HTML sanitization |
| multer                             | 2.3.0           | File uploads (CV, images)       |
| adm-zip / csv-parse               | 0.6.1 / 7.0.2   | LinkedIn export ZIP/CSV parsing |
| Winston                           | 3.19.0          | Logging                         |
| swagger-jsdoc / swagger-ui-express| 6.3.0/5.0.1     | OpenAPI docs                    |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts (health/Redis)
│   ├── config/     (env/Joi/CORS/session/swagger)
│   ├── database/   (Mongo)
│   ├── middlewares/ (rateLimit/logger/verifyToken/csrf/language/uploads)
│   ├── models/     (schemas incl. application/profile/visit)
│   ├── routers/api/v1/ (CRUD routes) + api/v2/ (auth WIP)
│   ├── candidate/  (profile + upload-cv + LinkedIn/PDF CV import)
│   ├── candidate_profile/ (controllers/services per section, incl. application/profile)
│   ├── candidate_me/ (public profile, search, visits, PDF/JSON/DOCX export, ATS self-check)
│   ├── services/   (PDF classic + ATS/Redis/base DB ops)
│   ├── utils/      (JWT/bcrypt/blacklist/i18n/csrf)
│   ├── views/      (Pug)
│   ├── public/     (assets/pdf)
│   ├── __tests__/  (Jest)
│   └── types/
├── scripts/       (GitHub automation)
├── TODO.md        (progress)
├── package.json
└── README.md
```

---

## 🚀 Quick Start

> Requires Node.js `>=20.19.0 <23.0.0` (see `engines` in `package.json`).
> Newer Node majors remove `Buffer.SlowBuffer`, which a `jsonwebtoken`
> transitive dependency still relies on.

1. **Install**: `npm install`
2. **Env**: `npm run env:setup` + edit `.env`:

```
NODE_ENV=development
LOCAL_PORT=3001
MONGO_URI=... or MONGOBD_USER/PASSWORD
TOKEN_SECRET=... (32+ chars)
TOKEN_REFRESH=...
SESSION_SECRET=...
REDIS_URL=redis://localhost:6379  # Optional
CORS_ORIGIN=https://your-frontend-domain.example  # required for the httpOnly cookie flow
```

3. **Redis** (rec.): `brew install redis && redis-server`
4. **Dev**: `npm run dev` → http://localhost:3001/health
5. **Build/Test**: `npm run build` / `npm test`

**Prod**: `npm run start`

---

## 🐳 Docker

No local Node/Mongo install needed — everything runs in containers.

**Dev** (hot reload, insecure built-in dev secrets, no `.env` required):
```
docker compose up --build
```
→ http://localhost:3001/health

**Prod** (compiled image, real secrets required):
```
cp .env.example .env   # fill in real TOKEN_SECRET/TOKEN_REFRESH/SESSION_SECRET/CORS_ORIGIN
docker compose -f docker-compose.prod.yml up -d --build
```
→ http://localhost:3008/health

Both stacks include a MongoDB 7 container (`mongo`) with a persistent
volume — no separate Mongo Atlas connection needed for local use. Redis
is intentionally not containerized; the app already falls back to an
in-memory store when `REDIS_URL` is unset.

---

## 📚 API Endpoints (v1 - JWT required except auth)

### Auth `/api/v1/auth`

| Method | Path              | Desc                                          |
| ------ | ----------------- | ---------------------------------------------- |
| POST   | `/register`       | Create user                                   |
| POST   | `/login`          | Get tokens (GET also supported, deprecated)   |
| POST   | `/logout`         | Blacklist current token (CSRF-checked)        |
| POST   | `/logout-all`     | Revoke every token issued to this candidate   |
| POST   | `/refresh`        | Renew access token (CSRF-checked); reusing a rotated refresh token revokes all sessions |
| POST   | `/forgot-password`| Request password reset (stub, no email sent)  |
| POST   | `/reset-password` | Reset password using a reset token            |
| GET    | `/verify-email`   | Verify email using a token issued on register |

### Candidate `/api/v1/candidate`

| Method | Path                      | Desc                                       |
| ------ | ------------------------- | ------------------------------------------- |
| GET    | `/:email`                 | Get profile by email                       |
| PUT    | `/update`                 | Full update                                |
| PATCH  | `/update`                 | Partial update                             |
| DELETE | `/`                       | Delete own account + all CV section data   |
| POST   | `/upload-cv`              | Upload a PDF résumé (max 5MB)              |
| GET    | `/cv-file`                | Download the uploaded résumé               |
| POST   | `/parse-linkedin-export`  | Parse a LinkedIn export ZIP (stateless, not persisted) |
| POST   | `/parse-cv-pdf`           | Parse a PDF CV, max 5MB (stateless, not persisted) |
| GET    | `/visits`                 | Own public-profile visit count + list      |
| GET    | `/visits/stats`           | Own visit stats: day/week/month series + countries + sources + profiles (`tz`-aware) |

### CRUD Pattern (CV sections + Application + Profile)

**Paths**: `/api/v1/{education,experience,award,certificate,project,reference,generalInformation,application,profile}`

| Method | Path          | Desc                            |
| ------ | ------------- | -------------------------------- |
| GET    | `/`           | List (optional `page`/`limit`/`sort`) |
| POST   | `/create`     | Create                          |
| PUT    | `/update`     | Update                          |
| DELETE | `/delete/:id` | Soft-delete by ID (ownership checked) |
| POST   | `/restore/:id`| Restore a soft-deleted entry    |

`generalInformation` also has `PATCH /update`. `profile` also synthesizes
a default "Tổng hợp" (All) profile on first `GET /` if the candidate has
none yet. `education`/`experience` also have `POST /bulk` for a
best-effort bulk create (up to 100 items per request).

**Header**: `Authorization: Bearer <token>` (or httpOnly JWT cookie)

### Other

| Method | Path                       | Auth | Desc                                                        |
| ------ | -------------------------- | ---- | ------------------------------------------------------------ |
| GET    | `/health`                  | None | Health check                                                 |
| GET    | `/api/me/search`           | None | Keyword search over public profiles with a slug (`?q=`, `page`/`limit`) |
| GET    | `/api/me/:email`           | None | Public profile by vanity slug or email, optional `?profile=` filter |
| POST   | `/api/me/:email/visit`     | None | Record a visit (count/timestamp/IP/geo; optional body `referrer` → hostname, `profile` → owned profile id) |
| GET    | `/api/me/:identifier/download-pdf` | None | Public profile's ATS PDF (`?lang=`, `?profile=`; cached per CV content) |
| GET    | `/api/v1/download-pdf`     | Token via query | Export own CV as `pdf` (default), `json`, or `docx`; `?template=classic\|modern\|ats` picks the visual template/theme (`classic`/`modern` apply to `pdf` and `docx`; `ats` is PDF-only) |
| POST   | `/api/v1/cv/ats-check`     | Bearer/cookie | Render own CV in memory, extract its text, score 10 ATS-safety checks + optional JD keyword match |
| GET    | `/api-docs`                | None | Swagger UI (OpenAPI docs)                                    |
| GET    | `/api-docs.json`           | None | Raw OpenAPI spec (JSON)                                      |

---

## 🔐 Auth Flow

1. **Login** → `{token, tokenRefresh}` (issued as httpOnly cookies and in the response body)
2. **API Calls**: `Authorization: Bearer ${token}` or the httpOnly cookie
3. **Refresh**: POST `/auth/refresh` (CSRF-checked)
4. **Logout**: Blacklist current token (Redis/utils/tokenBlacklist.ts) — `/auth/logout-all` revokes every token
5. **Invalid**: Checked via Redis/mem blacklist store

---

## 🧪 Scripts & Testing

**Scripts**:

- `npm run dev` - Hot reload
- `npm run build` - Compile + copy assets
- `npm run test` - Jest
- `npm run lint` - ESLint (type-aware)

**Tests (39 files)**: auth.service/controller/v2/token-expiry, candidate (controller/service/LinkedIn-import/PDF-CV-import), CV-section CRUD core, middlewares (rateLimit/logger/verify/csrf/language/PDF-CV upload), utils (bcrypt/valid/i18n/csrf), PDF export (classic + ATS template, ATS checks, keyword matcher, real-Puppeteer ATS integration), database/mongo

---

## 🌿 Branching & Release Workflow

2 tầng: `staging` (integration) → `main` (production). Xem thêm
[CONTRIBUTING.md](./CONTRIBUTING.md) cho quy trình chi tiết + lý do
thiết kế của từng phần.

- Mọi branch fix/feature/hotfix branch ra từ `staging`, PR merge **về
  `staging`** — không branch từ `main`.
- `main` chỉ nhận code từ `staging` qua bước release chính thức, không
  bao giờ nhận PR trực tiếp từ branch feature.
- Cả `main` và `staging` đều bật GitHub branch protection: không ai
  push thẳng được (kể cả owner/admin), mọi thay đổi đi qua PR.
- Push vào `main` tự kích hoạt deploy (`.github/workflows/deploy.yml`
  → Render).

---

## 🛡️ Production Notes

- **Rate Limit**: Redis (fallback mem), exempt `/health`
- **Blacklist**: Redis/utils/tokenBlacklist.ts
- **CSRF**: required on non-Bearer auth flows (`/auth/refresh`, `/auth/logout`) — see `utils/csrf.ts`
- **CORS**: `CORS_ORIGIN` (comma-separated allow-list) required for the httpOnly cookie flow — `credentials: true` cannot combine with a wildcard origin
- **Logs**: Winston daily rotation
- **Static**: public/ (CSS/JS/fonts/img/PDFs)
- **PDF/DOCX**: services/createPDF.ts (classic) + services/createPDF.ats.ts (ATS) + views/

---

## 🐛 Troubleshooting

| Issue        | Fix                                  |
| ------------ | ------------------------------------ |
| Mongo fail   | MONGO*URI or MONGOBD*\* vars         |
| Redis fail   | `brew install redis` or mem fallback |
| JWT invalid  | Token expired/blacklisted            |
| CSRF error   | Ensure the CSRF token accompanies non-Bearer refresh/logout calls |
| Rate limited | Wait / check Redis                   |
| Build fail   | `npm run copy`                       |
| Logs         | Check `logs/` (Winston)              |

---

## 📞 Support

Để báo cáo bug hoặc đề xuất tính năng, vui lòng tạo issue trên repository.

---

## 👨‍💻 Author

**Đạt Võ** - [github.com/datvt243](https://github.com/datvt243)
