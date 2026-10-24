---
paths:
  - "src/routers/**"
  - "src/auth/**"
  - "src/candidate/**"
  - "src/candidate_me/**"
  - "src/candidate_profile/**"
  - "src/middlewares/**"
  - "src/utils/**"
  - "src/config/**"
---

# API endpoints & auth flow

Moved verbatim from root `CLAUDE.md`. Swagger (`src/config/swagger.config.ts`, `/api-docs`) is the machine-readable spec; keep both in sync when a route changes.

All v1 routes: `/api/v1/...` — JWT required except auth. Auth accepts either an
`Authorization: Bearer <token>` header or an httpOnly JWT cookie; cookie-only
state-changing requests must also pass the double-submit CSRF check (see Security).

## Auth `/api/v1/auth` (authLimiter: 150 req/15 min)

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

## Candidate `/api/v1/candidate`

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

## CV Sections + Application + Profile (all follow same CRUD pattern)

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

## Other

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check |
| GET | `/api/me/search` | None | Keyword search (`?q=` 2–100 chars, `page`/`limit` ≤ 100) over public profiles that have a slug — escaped case-insensitive substring on GeneralInformation `positionDesired`/`professionalSkills.name`, Experience `company`/`position`/`skills`, Education `school`/`major`; returns `data: [{ slug, firstName, lastName, positionDesired }]` + `meta`, never email. Registered before `/api/me/:email` (a slug literally `search` is shadowed) |
| GET | `/api/me/:email` | None | Public profile by vanity slug (checked first) or email; `?lang=vi\|en` and `?profile=<id>` (filters sections to that CV profile) |
| GET | `/api/me/:identifier/download-pdf` | None | Public profile's ATS PDF (attachment, same renderer + metadata as the owner's `download-pdf?template=ats`); `?template=ats` only (anything else → 400), `?lang=`, `?profile=`. Private profile answers exactly like an unknown identifier. Rendered buffer cached in memory per sha256(resolved data) + lang (1h TTL, 50 entries, concurrent requests share one render), so a CV edit re-renders on the next request. Nothing written to disk |
| POST | `/api/me/:email/visit` | None | Record a visit (count, timestamp, IP, geo via `geoip-lite`); optional body `referrer` (the SPA's `document.referrer` — the request's own `Referer` header is ignored) stored as hostname only, `www.`/`m.` stripped, invalid → null; optional body `profile` (the `?profile=` id the visitor was shown) stored only if it is a non-deleted profile of that candidate, else null |
| GET | `/api/v1/download-pdf` | Token via query | Export own CV; `?format=pdf\|json\|docx` (default `pdf`), `?lang=vi\|en`, `?template=classic\|modern\|ats` (default `classic`; `modern` is an additional visual theme, applies to `pdf` and `docx`; `ats` is the ATS-optimized single-column template, PDF-only; `template` ignored for `format=json`) |
| POST | `/api/v1/cv/ats-check` | Bearer/cookie | Renders the candidate's own CV in memory (`template`/`lang` default `ats`/`vi`), extracts its text (`pdf-parse`), and scores it against 10 ATS-safety checks; optional `jobDescription` body field adds a keyword-coverage report |
| GET | `/api-docs` | None | Swagger UI (OpenAPI docs) |
| GET | `/api-docs.json` | None | Raw OpenAPI spec (JSON) |

## Auth flow

1. `POST /auth/register` → validate Joi → check duplicate email → bcrypt(password, 12) → create Candidate doc
2. `POST /auth/login` → find by email → bcryptCompare → sign `accessToken` (TOKEN_SECRET) + `refreshToken` (TOKEN_REFRESH) with payload `{ _id: candidateId }` → set as httpOnly cookies (`utils/authCookies.ts`) and returned in the response body
3. All protected requests → `verifyToken` middleware → extract token (Bearer header, cookie, body, or query via `extractTokenWithSource`) → `jwtVerify` → check blacklist → check per-candidate session-revocation timestamp (`sessionRevocation.ts`) → if the request authenticated purely off the cookie, require a valid double-submit CSRF token → attach `req.user._id` and force `req.body.candidateId` to it
4. `POST /auth/refresh` → CSRF-checked → if the token was already rotated away: 403, and if that rotation was more than 10s ago (not a concurrent refresh) treat it as theft → `invalidateAllSessions` (once — a token already predating the last revocation doesn't re-trigger it) → otherwise verify refresh token → blacklist old refresh token with a rotated-at marker → issue new pair (refresh tokens carry a random `jti` so two issued in the same second never collide)
5. `POST /auth/logout` → CSRF-checked → add token to blacklist (Redis TTL = token remaining exp; mem fallback)
6. `POST /auth/logout-all` → bump the candidate's session-invalidated-at timestamp so every token issued before now is rejected on next use, even if not individually blacklisted or expired
