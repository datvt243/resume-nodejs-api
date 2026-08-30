# 📄 Resume API - Backend (Updated)

Một ứng dụng API backend **hoàn chỉnh** để **quản lý hồ sơ ứng viên (CV/Resume)** với **Redis rate limiting**, **token blacklist**, **PDF export**, **Winston logging**, và **Jest testing**.

**Version**: 1.0.0 | **Author**: DatVT | **License**: ISC

---

## 🎯 Features

- 🔐 **Authentication**: JWT (access/refresh), Bcrypt, Token Blacklist (Redis)
- 👤 **Profile**: Candidate info + General (skills, languages, career)
- 📚 **Education** / 💼 **Experience** / 🏆 **Awards** / 📜 **Certificates** / 🚀 **Projects** / 👥 **References**
- 📄 **PDF Export** (Pug + PDFKit/Puppeteer)
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
| Language  | TypeScript 5.5.4           |

### Database & Cache

| Tech               | Version | Purpose                |
| ------------------ | ------- | ---------------------- |
| MongoDB + Mongoose | 8.4.0   | Data                   |
| Redis              | 4.6.0   | Rate limit / Blacklist |

### Auth & Security

| Tech               | Version | Purpose    |
| ------------------ | ------- | ---------- |
| JWT                | 9.0.2   | Tokens     |
| Bcrypt             | 5.1.1   | Passwords  |
| express-rate-limit | 8.3.0   | Protection |

### Utils

| Tech                 | Version        | Purpose    |
| -------------------- | -------------- | ---------- |
| Joi                  | 17.13.1        | Validation |
| PDFKit/Puppeteer/Pug | 0.15/22.13/3.0 | PDF        |
| Winston              | 3.19.0         | Logging    |
| swagger-jsdoc/swagger-ui-express | 6.3.0/5.0.1 | OpenAPI docs |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts (health/Redis)
│   ├── config/     (env/Joi/CORS)
│   ├── database/   (Mongo)
│   ├── middlewares/ (rateLimit/logger)
│   ├── models/     (schemas)
│   ├── routers/api/v1/ (CRUD routes)
│   ├── candidate_profile/ (controllers/services per section)
│   ├── services/   (PDF/Redis)
│   ├── utils/      (JWT/bcrypt/blacklist)
│   ├── views/      (Pug)
│   ├── public/     (assets/pdf)
│   ├── __tests__/  (Jest)
│   └── types/
├── scripts/       (GitHub automation)
├── TODO.md        (progress)
├── package.json
└── README.md ← Updated
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
```

3. **Redis** (rec.): `brew install redis && redis-server`
4. **Dev**: `npm run dev` → http://localhost:3001/health
5. **Build/Test**: `npm run build` / `npm test`

**Prod**: `npm run start`

---

## 📚 API Endpoints (v1 - JWT required except auth)

### Auth `/api/v1/auth`

| Method | Path        | Desc            |
| ------ | ----------- | --------------- |
| POST   | `/register` | Create user     |
| POST   | `/login`    | Get tokens      |
| POST   | `/logout`   | Blacklist token |
| POST   | `/refresh`  | Renew access    |

### Candidate `/api/v1/candidate`

| Method    | Path      | Desc        |
| --------- | --------- | ----------- |
| GET       | `/:email` | Get profile |
| PUT/PATCH | `/`       | Update      |

### CRUD Pattern (all sections)

**Paths**: `/api/v1/{education,experience,award,certificate,project,reference,generalInformation}`
| Method | Path | Desc |
|--------|------|------|
| GET | `/` | List |
| POST | `/create` | Create |
| PUT | `/update` | Update |
| DELETE | `/delete/:id` | Delete |

**Header**: `Authorization: Bearer <token>`

### Other

| Method | Path             | Auth | Desc                          |
| ------ | ---------------- | ---- | ------------------------------ |
| GET    | `/health`        | None | Health check                  |
| GET    | `/api-docs`      | None | Swagger UI (OpenAPI docs)     |
| GET    | `/api-docs.json` | None | Raw OpenAPI spec (JSON)       |

---

## 🔐 Auth Flow

1. **Login** → `{token, tokenRefresh}`
2. **API Calls**: `Authorization: Bearer ${token}`
3. **Refresh**: POST `/auth/refresh`
4. **Logout**: Blacklist (Redis/utils/tokenBlacklist.ts)
5. **Invalid**: Checked via Redis/mem store

---

## 🧪 Scripts & Testing

**Scripts**:

- `npm run dev` - Hot reload
- `npm run build` - Compile + copy assets
- `npm run test` - Jest

**Tests (~20 files)**: auth.service/controller, middlewares (rateLimit/logger/verify), utils (bcrypt/valid), database/mongo

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

---

## 🛡️ Production Notes

- **Rate Limit**: Redis (fallback mem), exempt `/health`
- **Blacklist**: Redis/utils/tokenBlacklist.ts
- **Logs**: Winston daily rotation
- **Static**: public/ (CSS/JS/fonts/img/PDFs)
- **PDF**: services/createPDF.ts + views/

---

## 🐛 Troubleshooting

| Issue        | Fix                                  |
| ------------ | ------------------------------------ |
| Mongo fail   | MONGO*URI or MONGOBD*\* vars         |
| Redis fail   | `brew install redis` or mem fallback |
| JWT invalid  | Token expired/blacklisted            |
| Rate limited | Wait / check Redis                   |
| Build fail   | `npm run copy`                       |
| Logs         | Check `logs/` (Winston)              |

---

## 📞 Support

Để báo cáo bug hoặc đề xuất tính năng, vui lòng tạo issue trên repository.

---

## 👨‍💻 Author

**Đạt Võ** - [github.com/datvt243](https://github.com/datvt243)
