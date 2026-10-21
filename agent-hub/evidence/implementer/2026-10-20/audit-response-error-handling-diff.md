# 2026-10-20 — audit-response-error-handling (implementer diff)

Worker: implementer · Version 0.1.0
Node: `audit-response-error-handling` (`haven/diagrams/dev-loop.prime-mermaid.md:153`)
Task: GitHub issue #271 (verbatim body in the issue), branch `271-audit-ton-bo`.

## Hub bytes before: 239528

## Diff
| File | Why |
|---|---|
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | +1 PENDING row (`NodeBeforeCode`, appended at end) |
| `src/**` | **none** — read-only audit per operator instruction |

## Command
```
NODE_ENV=production npx jest src/__tests__/zz-probe-scratch.test.ts   # throwaway probe, file removed after run
npm test
npm run build
git status --short
```

## Output
Probe (`NODE_ENV=production`, real `createCrudController`, `authRefreshToken`, `errorsMiddleware`, body-parser over a real `app.listen(0)` + fetch; service stubbed to return `{success:false}`, tokenBlacklist mocked):
```
"createFail":    { "status": 201, "body": { "success": false, "message": "Tạo thất bại", "errors": null, "data": null } }
"malformedJson": { "status": 500, "body": { "success": false, "errorCode": "INTERNAL_SERVER_ERROR", "message": "Internal Server Error" } }
"unknownPost":   { "status": 404, "type": "text/html; charset=utf-8", "body": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n" }
"badRefresh":    { "status": 500, "body": { "success": false, "errorCode": "INTERNAL_SERVER_ERROR", "message": "invalid token" } }
Tests:       1 passed, 1 total
```
After probe removal: `git status --short` → ` M agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` (only).

`npm test`:
```
Test Suites: 44 passed, 44 total
Tests:       398 passed, 398 total
Snapshots:   0 total
Time:        12.012 s
Ran all test suites.
```
(also printed the pre-existing "A worker process has failed to exit gracefully" warning)

`npm run build`: exit=0, tail `> cp -R ./src/views ./src/public ./dist/`, `grep -c "error TS"` → 0.

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) per-endpoint table | Report §1 below |
| (2) ranked findings with file:line | Report §2 — 2 Critical, 6 High, 8 Medium, 5 Low |
| (3) unified standard | Report §3 (envelope, status map, error-code map) |
| (4) sample code: middleware, AppError, response helper, async wrapper | Report §4 |
| (5) severe claims runtime-proven | Probe output above: #1 (201+success:false), #3/#5 (500 "invalid token" in prod), #4 (malformed JSON 500), #8 (HTML 404 for POST) |
| (6) no src change, tests/build green | `git status` above; `Tests: 398 passed, 398 total`; build exit 0, 0 `error TS` |
| comments per code-comments.md | n/a — no code comments added/changed (no `src/` diff) |

## Noticed, not done
- `GET /api/v1/candidate/:email` lets ANY authenticated user read ANY candidate's full profile (minus password: phone, address, birthday…) by email — authorization/privacy issue, outside this audit's response-format scope; worth its own node.
- PROJECT.md Traps rows for CORS `origin:'*'` and "no lint script" look stale vs. root CLAUDE.md (not checked against code here).
- Active diagram is 163 KB (>15 KB threshold) — archive pass due.

## Seal gate
none — no outward-facing action on `src/`. (GitHub issue #271 creation + branch push via `gh issue develop` are Step 0 of `/todo`, operator-invoked.)

---

# Audit #271 — API response & error handling

Phạm vi: toàn bộ `src/` trên `staging` @ `7ad734c`. Không sửa code.
✅ = đã chứng minh bằng runtime probe (`NODE_ENV=production`, gọi thật vào
controller/middleware), còn lại là đọc code.

## 1. Bảng endpoint

Ký hiệu format: **F** = `formatReturn` → `{ success, message, errors, data }`;
**E** = `errorsMiddleware` → `{ success:false, errorCode, message, errors }`;
**X** = format riêng.

| Method | Path | Status hiện tại | Format | Vấn đề |
|---|---|---|---|---|
| POST | /api/v1/auth/register | 200 OK · validate 401 · email trùng 401 · lỗi khác 500 | F/E | Thành công phải 201; validate phải 400; email trùng phải 409 |
| POST/GET | /api/v1/auth/login | 200 · validate 401 · sai email/mk 401 | F | Validate phải 400; message khác nhau cho "không có email" và "sai mật khẩu" → lộ email nào đã đăng ký (user enumeration) |
| POST | /auth/logout | 200 · thiếu token 400 | F | Thiếu token nên là 401 |
| POST | /auth/logout-all | 200 · 401 | F | OK |
| POST | /auth/refresh | 200 · thiếu 401 · revoked 403 · **token hỏng/hết hạn 500** ✅ | F/E | Token hỏng → 500 kèm message thô "invalid token"; revoked dùng 403 trong khi verifyToken dùng 401 TOKEN_REVOKED |
| POST | /auth/forgot-password | 200 · 400 | F | OK |
| POST | /auth/reset-password | 200 · 400 | F | OK |
| GET | /auth/verify-email | 200 · 400 | F | OK |
| GET | /api/v1/candidate/:email | 200 · không có user **400** | F | Phải 404; **không có try/catch** → lỗi DB = unhandled rejection |
| PUT/PATCH | /candidate/update | 200 · validate **401** · không có id 400 | F | Validate phải 400 |
| DELETE | /candidate/ | 200 | F | OK (200 + message, thống nhất với section) |
| POST | /candidate/upload-cv | 200 · 400 | F | Tạo file mới → có thể 201 (Low) |
| GET | /candidate/cv-file | file · 404 | binary/F | OK |
| POST | /candidate/parse-linkedin-export, /parse-cv-pdf | 200 · 400 | F | Lỗi parse file nên 422 (Low) |
| GET | /candidate/visits, /visits/stats | 200 · 400 | F | OK |
| GET | /{section}/ (9 section) | 200 · thiếu collection 404 | F | `data` là **mảng trần** khi không có `limit`, là `{items, pagination}` khi có |
| POST | /{section}/create | 201 · validate 400 · **lỗi service 201 + success:false** ✅ | F | Critical: 201 với body lỗi |
| POST | /education\|experience/bulk | 201 (kể cả khi mọi item fail) · 400 | F | Có lỗi một phần nên 207, hoặc 200 + summary; toàn bộ fail không nên 201 |
| PUT | /{section}/update | 200 · validate 400 · không tìm thấy **400** · không phải của mình **400** · lỗi DB **400** | F | 404 / 403 / 500 bị gộp hết thành 400 |
| PATCH | /generalInformation/update | 200 · validate **401** | F | Validate phải 400 |
| PUT | /generalInformation/update | 200 · validate **401** | F | như trên |
| DELETE | /{section}/delete/:id | 200 · không tìm thấy 400 · không phải của mình 400 · đã xoá rồi **400 với message "Xoá thành công"** | F | 404/403; message sai khi `modifiedCount=0` |
| POST | /{section}/restore/:id | như delete | F | như delete |
| POST | /{section}/upload-images/:id | 200 · 400 · 403 · 404 | F | OK (tốt nhất trong code base) |
| GET | /api/v1/download-pdf | file · 400 · **500 `{status,message}`** | binary/X | Key `status` thay vì `success`, thiếu `errorCode`; DOCX trả cả object `error` ra client; `findOne` nằm ngoài try |
| POST | /api/v1/cv/ats-check | 200 · 400 | F | "Candidate not found" là 400 → 404 |
| GET | /api/me/search | 200 · 400 | F | OK (`{items, pagination}`) |
| GET | /api/me/:email | 200 · không có/private **400** | F | Phải 404 (vẫn giữ private == unknown) |
| GET | /api/me/:id/download-pdf | file · 400 | binary/F | không tìm thấy → 404 |
| POST | /api/me/:email/visit | 200 · 400 | F | Ghi record → 201 hoặc 204 (Low) |
| GET | /health | 200 `{status,timestamp,uptime}` | X | Chấp nhận được (health check) |
| * | route không tồn tại | GET /api/* → 404 F (thiếu errorCode) · **POST/PUT/DELETE → 404 HTML của Express** ✅ · GET /xyz → **200 HTML "Hello World"** | X | `notFoundHandler` đã viết nhưng chưa mount |
| * | JSON body sai cú pháp | **500 INTERNAL_SERVER_ERROR** ✅ | E | Phải 400 |
| * | vượt rate limit | 429 `{success,message,errors,data}` | X | Thiếu `errorCode`, message chưa i18n |

## 2. Danh sách vấn đề

### Critical
1. **Lỗi service ở `/create` trả về 201 Created với `success:false`** ✅ —
   `src/candidate_profile/BaseController.ts:217`
   `formatReturn(res, { statusCode: CREATED, ..._result })`: `_result` lỗi
   (timeout DB, model validate fail, thiếu candidateId —
   `services/index.ts` `baseCreateDocument`, `BaseService.ts:42-44`) không có
   `statusCode`, nên 201 được giữ nguyên. Giống hệt ở
   `general_information/generalInformation.controller.ts:58`. Client nào
   check `res.ok` sẽ hiểu là đã tạo thành công.
2. **Async handler không có try/catch + không có handler cho
   `unhandledRejection`** —
   `src/candidate/candidate.controller.ts:27` (`fnGetInformationById`), `:35`
   (`fnGetInformationByEmail`, route `GET /candidate/:email`),
   `src/candidate_me/index.ts:326` (`findOne` của `fnExportPDF` nằm trước
   `try`). Express 4 không bắt được promise bị reject; Node ≥15 mặc định
   **tắt process** khi có unhandled rejection. Một lần Mongo timeout ở
   route này là đủ làm sập server. Không có `express-async-errors`, async
   wrapper hay `process.on('unhandledRejection')` nào (đã grep).

### High
3. **Message của lỗi lạ bị lộ ra client ở production** ✅ —
   `src/utils/helper.ts:83-84` bọc mọi lỗi không xác định thành
   `AppError(500, err.message)`. `errorsMiddleware`
   (`middlewares/errors.middleware.ts:16-31`) tin mọi `AppError` và trả
   nguyên `message`, nên nhánh "ẩn message ở prod" ở `:36` không bao giờ
   chạy cho những lỗi này. Probe: refresh token hỏng → `500 {"message":"invalid token"}`.
   Lỗi kết nối Mongo/Redis, TypeError, v.v. sẽ trả nguyên văn ra ngoài. Cũng
   lộ: `services/index.ts:170,200` (message lỗi DB nằm trong `errors` của
   delete/restore), `:383` (message của `ReferenceError`),
   `services/createDocx.ts:247-251` (trả cả object `error` ra client).
4. **JSON body sai cú pháp / payload quá lớn → 500** ✅ —
   `errors.middleware.ts:35` bỏ qua `err.status`/`err.type` mà body-parser
   gắn vào (`entity.parse.failed` 400, `entity.too.large` 413). Lỗi của
   client bị log như lỗi server.
5. **Refresh token hết hạn/không hợp lệ → 500** ✅ —
   `src/auth/auth.controller.ts:154` `jwtVerify` throw `JsonWebTokenError`/
   `TokenExpiredError` của `jsonwebtoken`, rơi vào `handleError` → 500.
   Phải là 401 `TOKEN_EXPIRED`/`INVALID_TOKEN` (verifyToken đã map đúng ở
   `middlewares/verifyToken.middleware.ts:77-79`).
6. **Lỗi validate trả 401** — `auth/auth.controller.ts:32,64`,
   `candidate/candidate.controller.ts:46,231`,
   `general_information/generalInformation.controller.ts:70,86`. Trong khi
   `/create` của section trả 400 (`BaseController.ts:212`). 401 có nghĩa
   "chưa xác thực", nên frontend có interceptor 401 sẽ logout user khi họ
   gõ sai format email.
7. **Mọi kết quả `success:false` của service đều thành 400** —
   `utils/helper.ts:117-121` mặc định là 400. Base service trả "không tìm
   thấy" (`services/index.ts` `baseCheckDocumentById`), "không phải của
   bạn" (`:155,190,243`) và lỗi DB (`BaseService.ts:16,43,59,75`) cùng một
   shape, không có `statusCode`, nên 404/403/500 đều thành 400.
8. **Unknown route không thống nhất** ✅ — `notFoundHandler`
   (`errors.middleware.ts:52`) chưa mount ở đâu cả. 404 tự viết chỉ bắt GET
   (`routers/index.ts:218`, `routers/api/v1/index.ts:121`,
   `routers/api/v2/index.ts:14`), nên POST/PUT/DELETE ra trang HTML 404
   mặc định của Express. `routers/index.ts:227` trả **200** HTML "Hello
   World" cho mọi GET không phải API.

### Medium
9. **Register**: thành công trả 200 (phải 201), email trùng trả 401 (phải 409 `CONFLICT`) — `auth/auth.controller.ts:42`, `auth/auth.service.ts:31`.
10. **Login lộ email nào đã đăng ký** — `auth/auth.service.ts:94` (`emailNotFound`) và `:98` (`wrongPassword`) trả message khác nhau. `InvalidCredentialsError` đã có sẵn nhưng không được dùng.
11. **3 shape khác nhau cho `errors` của validate** — Joi: `{ field: msg }` nhưng chỉ lấy `path[0]` (`utils/valid.ts:61`), nên lỗi ở `items[3].company` bị gộp vào key `items` và lỗi sau đè lỗi trước. Mongoose (base service): `errors: ['field', ...]` với `message: ''` (`services/index.ts:376`). Mongoose (`handleError`): `['msg', ...]` không có tên field (`helper.ts:71-80`). CastError: string.
12. **Các response lỗi chưa đi qua chuẩn chung** — PDF/DOCX 500 dùng `{ status:false, message }` (`services/createPDF.ts:91`, `createPDF.ats.ts:482`, `createDocx.ts:247`). 429 không có `errorCode` (`middlewares/rateLimit.middleware.ts:102,131`). 404 tự viết không có `errorCode`. Mọi response `success:false` đi qua `formatReturn` (phần lớn lỗi nghiệp vụ) đều **không có `errorCode`**, chỉ lỗi được throw mới có.
13. **List response không thống nhất** — không có `limit` thì `data` là mảng trần, có `limit` thì là `{ items, pagination }` (`services/index.ts:118-140`). Client phải check hai kiểu.
14. **Delete/restore**: khi `modifiedCount === 0`, `success` là false nhưng message vẫn là "Xoá/khôi phục thành công" (`services/index.ts:168,198`).
15. **Public profile/PDF/ATS không tìm thấy → 400** — `candidate_me/index.ts:58`, `public-pdf.ts:80`, `ats-check.ts:36`, `index.ts:328`. Phải 404 (private vẫn trả giống hệt unknown).
16. **Refresh revoked 403 và verifyToken revoked 401** — `auth.controller.ts:140,148,168,177` khác với `verifyToken.middleware.ts:27,41`. Cùng một trạng thái nhưng status khác nhau.

### Low
17. Message hardcode, chưa i18n: `candidate_me/*.ts` (tiếng Việt), `verifyToken.middleware.ts` (tiếng Anh), 404 "Page not found", 429 "Too many requests".
18. `/bulk` trả 201 cả khi mọi item đều fail (`BaseController.ts:289-294`).
19. Lỗi "đọc được file nhưng không parse được" (LinkedIn ZIP, PDF CV) trả 400, đúng ngữ nghĩa hơn là 422. Tuỳ chọn.
20. `AppError` có 2 overload constructor (positional + options) × 9 class ≈ 200 dòng lặp lại. `isOperational` luôn là `true`, kể cả lỗi 500 bọc từ bug (`helper.ts:84`), nên `isOperationalError()` vô dụng.
21. `res.send(swaggerSpec)` ở `server.ts:80`: OK, đã set header JSON.

## 3. Đề xuất chuẩn

**Envelope** (giữ gần shape hiện tại để frontend migrate ít nhất. RFC 9457 là lựa chọn khác nhưng phải viết lại toàn bộ frontend):

```jsonc
// Thành công
{ "success": true, "message": "Tạo thành công", "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 } }  // meta chỉ có ở list
// Lỗi
{ "success": false, "error": { "code": "EXPERIENCE_NOT_FOUND", "message": "Không tìm thấy dữ liệu", "details": [ { "field": "items.3.company", "message": "Công ty là bắt buộc" } ] } }
```

Quy tắc:
- List **luôn** trả `data: [...]` + `meta` (dù không phân trang thì `meta.total` vẫn có).
- `details` luôn là **mảng `{ field, message }`**, `field` là full path nối bằng `.`.
- Không bao giờ trả 2xx khi `success:false` (helper chặn bằng type + runtime assert).
- 500 ở production: `message` cố định, không bao giờ là `err.message`.

**Status map**: 200 đọc/sửa/xoá · 201 tạo · 204 (tuỳ chọn) xoá/logout · 400 body/param sai cú pháp · 401 chưa xác thực / token hỏng / hết hạn / revoked · 403 đã xác thực nhưng không có quyền / CSRF · 404 không tồn tại hoặc không phải của mình (nếu muốn giấu) · 409 trùng · 413 payload quá lớn · 422 validate nghiệp vụ (tuỳ chọn, hoặc gộp vào 400 cho đơn giản, nhưng phải thống nhất) · 429 · 500 · 503 DB/Redis timeout.

**Error code**: `UPPER_SNAKE`, dạng `<DOMAIN>_<REASON>`, khai báo tập trung trong **một** map `code → status` (tự suy ra status, không truyền tay):

| Nhóm | Code |
|---|---|
| Chung | `VALIDATION_ERROR` 400, `BAD_REQUEST` 400, `MALFORMED_JSON` 400, `PAYLOAD_TOO_LARGE` 413, `ROUTE_NOT_FOUND` 404, `RATE_LIMITED` 429, `INTERNAL_ERROR` 500, `SERVICE_UNAVAILABLE` 503 |
| Auth | `AUTH_NO_TOKEN` 401, `AUTH_TOKEN_INVALID` 401, `AUTH_TOKEN_EXPIRED` 401, `AUTH_TOKEN_REVOKED` 401, `AUTH_INVALID_CREDENTIALS` 401, `AUTH_EMAIL_EXISTS` 409, `AUTH_CSRF_INVALID` 403, `AUTH_RESET_TOKEN_INVALID` 400 |
| Resource | `RESOURCE_NOT_FOUND` 404, `RESOURCE_FORBIDDEN` 403, `RESOURCE_CONFLICT` 409 (thêm code riêng như `CANDIDATE_NOT_FOUND`, `PROFILE_NOT_FOUND` khi frontend cần rẽ nhánh) |
| File | `FILE_TOO_LARGE` 413, `FILE_INVALID_TYPE` 400, `FILE_UNPARSABLE` 422 |
| Export | `EXPORT_FAILED` 500 |

Các code hiện có (`TOKEN_EXPIRED`, `CSRF_TOKEN_INVALID`…) có thể giữ tên cũ để tránh breaking change. Chỉ cần dồn về một map.

## 4. Code mẫu

`src/errors/AppError.ts` (thay 9 class lặp lại):

```ts
import { StatusCodes } from 'http-status-codes';

export const ERROR_STATUS = {
  VALIDATION_ERROR: StatusCodes.BAD_REQUEST,
  BAD_REQUEST: StatusCodes.BAD_REQUEST,
  MALFORMED_JSON: StatusCodes.BAD_REQUEST,
  PAYLOAD_TOO_LARGE: StatusCodes.REQUEST_TOO_LONG,
  ROUTE_NOT_FOUND: StatusCodes.NOT_FOUND,
  NOT_FOUND: StatusCodes.NOT_FOUND,
  FORBIDDEN: StatusCodes.FORBIDDEN,
  CONFLICT: StatusCodes.CONFLICT,
  NO_TOKEN: StatusCodes.UNAUTHORIZED,
  INVALID_TOKEN: StatusCodes.UNAUTHORIZED,
  TOKEN_EXPIRED: StatusCodes.UNAUTHORIZED,
  TOKEN_REVOKED: StatusCodes.UNAUTHORIZED,
  INVALID_CREDENTIALS: StatusCodes.UNAUTHORIZED,
  CSRF_TOKEN_INVALID: StatusCodes.FORBIDDEN,
  RATE_LIMITED: StatusCodes.TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR: StatusCodes.INTERNAL_SERVER_ERROR,
  SERVICE_UNAVAILABLE: StatusCodes.SERVICE_UNAVAILABLE,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;
export type ErrorDetail = { field: string; message: string };

export class AppError extends Error {
  readonly statusCode: number;
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
    // false = a bug: message is never shown to the client
    readonly isOperational = true,
  ) {
    super(message);
    this.statusCode = ERROR_STATUS[code];
  }
}
// usage: throw new AppError('NOT_FOUND', t('common.idNotFound', lang));
```

`src/utils/response.ts` (helper thành công, chỉ trả 2xx):

```ts
import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

type Meta = { page: number; limit: number; total: number; totalPages: number };

export const ok = (res: Response, data: unknown = null, message = '', meta?: Meta) =>
  res.status(StatusCodes.OK).json({ success: true, message, data, ...(meta && { meta }) });

export const created = (res: Response, data: unknown = null, message = '') =>
  res.status(StatusCodes.CREATED).json({ success: true, message, data });
// Errors are never sent from here — throw AppError and let the middleware answer.
```

`src/utils/asyncHandler.ts`:

```ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
// router.get('/:email', asyncHandler(fnGetInformationByEmail));
```

(Cách khác, ít diff nhất: `import 'express-async-errors'` một lần ở `server.ts`, thêm 1 dependency. Hoặc nâng lên Express 5, bản này tự forward promise bị reject.)

`src/middlewares/errors.middleware.ts`:

```ts
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@/errors/AppError';
import { NODE_ENV } from '@/config/process.config';
import { logger } from '@/logger';
import { t } from '@/utils/i18n';

const toAppError = (err: unknown, lang?: string): AppError => {
  if (err instanceof AppError) return err;
  if (err instanceof mongoose.Error.CastError) return new AppError('BAD_REQUEST', t('errors.invalidIdFormat', lang));
  if (err instanceof mongoose.Error.ValidationError)
    return new AppError('VALIDATION_ERROR', t('validation.hasErrors', lang),
      Object.entries(err.errors).map(([field, e]) => ({ field, message: e.message })));
  const type = (err as { type?: string }).type; // set by body-parser
  if (type === 'entity.parse.failed') return new AppError('MALFORMED_JSON', t('errors.malformedJson', lang));
  if (type === 'entity.too.large') return new AppError('PAYLOAD_TOO_LARGE', t('errors.payloadTooLarge', lang));
  const name = (err as { name?: string }).name; // jsonwebtoken
  if (name === 'TokenExpiredError') return new AppError('TOKEN_EXPIRED', t('auth.tokenExpired', lang));
  if (name === 'JsonWebTokenError') return new AppError('INVALID_TOKEN', t('auth.invalidToken', lang));
  return new AppError('INTERNAL_SERVER_ERROR', err instanceof Error ? err.message : String(err), undefined, false);
};

export const errorsMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const e = toAppError(err, req.lang);
  logger.error(`[${e.code}] ${e.message}`, { url: req.originalUrl, stack: err instanceof Error ? err.stack : undefined });

  res.status(e.statusCode).json({
    success: false,
    error: {
      code: e.code,
      message: e.isOperational || NODE_ENV === 'development' ? e.message : t('errors.internalServerError', req.lang),
      ...(e.details && { details: e.details }),
      ...(NODE_ENV === 'development' && { stack: e.stack }),
    },
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) =>
  next(new AppError('ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
```

`server.ts`: thay 3 catch-all GET bằng `app.use('/api', notFoundHandler)` đặt
trước `app.use(errorsMiddleware)`, và thêm
`process.on('unhandledRejection', (r) => logger.error('unhandledRejection', { r }))`
làm lưới an toàn cuối cùng.

Base service: thay `return formatReturnFailed(...)` bằng
`throw new AppError('NOT_FOUND' | 'FORBIDDEN', ...)`. Controller chỉ còn
`created(res, data)` / `ok(res, data)`. Bỏ hết các nhánh `success:false`
cùng `formatReturn` mặc định 400, nên lỗi #1, #7, #14 biến mất theo.

## Lộ trình sửa đề xuất (mỗi dòng 1 node/issue riêng)
1. `asyncHandler` + `unhandledRejection` + mount `notFoundHandler` (#2, #8). Diff nhỏ, an toàn.
2. `errorsMiddleware.toAppError` (body-parser, jwt, ẩn message prod) (#3, #4, #5).
3. Sửa status sai mà không đổi shape: validate 401→400, register 201/409, `/create` không bao giờ 201 khi fail, login dùng 1 message (#1, #6, #9, #10, #16).
4. Base service throw `AppError` thay vì trả `success:false` (#7, #14, #15).
5. **Breaking** envelope `error: { code, message, details }` + `meta` cho list. Cần phối hợp release với frontend (`vue-resume-web`) (#11, #12, #13).
