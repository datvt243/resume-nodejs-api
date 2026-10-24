# Resume API — Backend

REST API (Node.js + TypeScript) để quản lý hồ sơ ứng viên (CV): đăng nhập JWT, quản lý từng phần CV, nhiều phiên bản CV, link hồ sơ công khai, xuất PDF/DOCX (kể cả mẫu tối ưu cho ATS), theo dõi ứng tuyển. Đây là backend của [resume-vuejs-website](https://github.com/datvt243/resume-vuejs-website).

## Mục lục

- [Tính năng](#tính-năng)
- [Bắt đầu nhanh](#bắt-đầu-nhanh)
- [Chạy bằng Docker](#chạy-bằng-docker)
- [Tài liệu API](#tài-liệu-api)
- [Lệnh thường dùng](#lệnh-thường-dùng)
- [Xử lý sự cố](#xử-lý-sự-cố)
- [Công nghệ](#công-nghệ)
- [Đóng góp](#đóng-góp)
- [Tác giả & License](#tác-giả--license)

## Tính năng

- **Xác thực** — JWT access/refresh (httpOnly cookie hoặc Bearer), bcrypt, CSRF, token blacklist, đăng xuất mọi thiết bị, phát hiện dùng lại refresh token, quên/đặt lại mật khẩu (stub, chưa gửi email thật)
- **Hồ sơ CV** — thông tin ứng viên, học vấn, kinh nghiệm (có career break), dự án, giải thưởng, chứng chỉ, người tham khảo; xoá mềm và khôi phục
- **Nhiều phiên bản CV** — mỗi phiên bản là một tập con các mục, có link công khai và PDF riêng
- **Hồ sơ công khai** — slug tuỳ chỉnh, tìm kiếm hồ sơ công khai, thống kê lượt xem (quốc gia, nguồn truy cập, phiên bản CV)
- **Xuất CV** — PDF / JSON / DOCX, nhiều mẫu (`classic`, `modern`, `ats`); tự chấm CV theo 10 tiêu chí ATS + so khớp từ khoá với mô tả công việc
- **Nhập CV** — từ file export LinkedIn (ZIP) hoặc từ file PDF CV có sẵn
- **Theo dõi ứng tuyển** — applied / interview / offer / rejected, gắn với phiên bản CV đã gửi
- **Song ngữ** — Việt/Anh qua `Accept-Language` hoặc `?lang=`
- **Vận hành** — rate limit (Redis, tự fallback về bộ nhớ khi không có Redis), log Winston theo ngày, `/health`, Swagger tại `/api-docs`

## Bắt đầu nhanh

Yêu cầu: Node.js `>=20.19.0 <23.0.0` (xem `engines` trong `package.json` — Node mới hơn bỏ `Buffer.SlowBuffer` mà một dependency của `jsonwebtoken` còn dùng), MongoDB, Redis (tuỳ chọn).

```bash
npm install
npm run env:setup     # cp .env.example .env, rồi điền giá trị
npm run dev           # → http://localhost:3001/health
```

Biến môi trường tối thiểu trong `.env`:

```
NODE_ENV=development
LOCAL_PORT=3001
MONGO_URI=...                     # hoặc MONGOBD_USER + MONGOBD_PASSWORD
TOKEN_SECRET=...                  # 32+ ký tự
TOKEN_REFRESH=...
SESSION_SECRET=...
REDIS_URL=redis://localhost:6379  # tuỳ chọn
CORS_ORIGIN=https://your-frontend.example   # bắt buộc cho luồng httpOnly cookie
```

Danh sách đầy đủ: [`.env.example`](.env.example). Muốn có Redis trên macOS: `brew install redis && redis-server`.

## Chạy bằng Docker

Không cần cài Node/Mongo trên máy — cả hai chạy trong container (MongoDB 7, có volume lưu dữ liệu). Redis cố ý không đóng container; app tự dùng bộ nhớ khi thiếu `REDIS_URL`.

```bash
# Dev: hot reload, secret dev có sẵn, không cần .env
docker compose up --build                                  # → http://localhost:3001/health

# Prod: image đã build, cần secret thật trong .env
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build    # → http://localhost:3008/health
```

## Tài liệu API

- **Swagger UI**: `/api-docs` (spec JSON: `/api-docs.json`) — nguồn đầy đủ và luôn đúng nhất cho mọi endpoint.
- **Chuẩn response/error**: [`API-STANDARD.md`](API-STANDARD.md).
- Mọi route `/api/v1/...` cần JWT, trừ nhóm auth. Gửi `Authorization: Bearer <token>` hoặc dùng httpOnly cookie; khi chỉ dùng cookie, request thay đổi dữ liệu phải kèm CSRF token.
- Hồ sơ công khai (`/api/me/...`) không cần đăng nhập.

## Lệnh thường dùng

```bash
npm run dev        # hot reload
npm run build      # tsc + copy public → dist/
npm start          # build + chạy production
npm test           # Jest
npm run lint       # ESLint (npm run lint:fix để tự sửa)
```

## Xử lý sự cố

| Vấn đề | Cách xử lý |
|---|---|
| Không kết nối được Mongo | Kiểm tra `MONGO_URI` hoặc `MONGOBD_USER`/`MONGOBD_PASSWORD` |
| Không có Redis | Cài Redis, hoặc bỏ `REDIS_URL` để dùng bộ nhớ |
| Lỗi CSRF | Request chỉ dùng cookie (không có Bearer) phải kèm CSRF token |
| Build xong nhưng thiếu file tĩnh / upload | `npm run copy` |
| Cần xem log | Thư mục `logs/` |

## Công nghệ

Node.js · Express 4 · TypeScript 5 (strict) · MongoDB + Mongoose 8 · Redis 4 · JWT + bcrypt · Joi · Puppeteer + pdf-lib + pdf-parse · docx · multer · Winston · Swagger · Jest · ESLint 9

## Đóng góp

- `main` và `staging` đều được GitHub bảo vệ: không push thẳng, bắt buộc qua PR, CI phải xanh.
- Tạo branch từ `staging`, mở PR vào `staging`. `main` chỉ nhận code từ `staging` qua bước release; push vào `main` tự deploy lên Render.
- Chi tiết và lý do: [`CONTRIBUTING.md`](CONTRIBUTING.md). Quy ước code cho AI agent: [`CLAUDE.md`](CLAUDE.md).
- Báo lỗi / đề xuất: [GitHub Issues](https://github.com/datvt243/resume-nodejs-api/issues).

## Tác giả & License

**Đạt Võ** — [@datvt243](https://github.com/datvt243)

License: ISC (khai báo trong `package.json`; repo chưa có file `LICENSE`).
