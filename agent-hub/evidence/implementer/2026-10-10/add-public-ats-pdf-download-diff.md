# 2026-10-10 — add-public-ats-pdf-download (implementer diff)

Worker: implementer · Version 0.1.0
Node: `add-public-ats-pdf-download` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING — status left to verifier)
Task (verbatim): `#217` via `/todo #217` — "Public unauthenticated ATS PDF download for public profiles (GET /api/me/:identifier/download-pdf)"
Branch: `217-public-unauthenticated-ats` off `staging` @ `95227aa`
Plan note: `evidence/implementer/2026-10-10/add-public-ats-pdf-download-plan.md`

## Hub bytes before
230699

## Diff
| File | Why |
|---|---|
| `src/candidate_me/public-pdf.ts` (new) | `fnDownloadPublicPdf`: `template` must be absent or `ats` (else 400, before any DB call); `lang` vi/en; `profile` string passthrough; `handlerGetAboutMe({ identifier, lang, profileId })`; `!success \|\| !data \|\| data.isPublic === false` → `formatReturn(res, formatReturnFailed('Email không tồn tại'))` (same as `fnGetAboutMe`'s unknown/private branch); else `renderCached` → `Content-Disposition: attachment; filename=<atsPdfFilename>`, `application/pdf`, `res.send(buffer)`; errors → `handleError`. `renderCached`: Map keyed sha256(lang + JSON(data)), value `{ expiresAt, pdf: Promise }`; TTL 1h (`PUBLIC_PDF_CACHE_TTL_MS`), cap 50 (`PUBLIC_PDF_CACHE_MAX_ENTRIES`, expired purged first, then oldest-inserted evicted); rejected render removed from cache. `clearPublicPdfCache` exported for tests. No disk write anywhere. |
| `src/services/createPDF.ats.ts` | Extracted the attachment filename expression from `createCVAts` into exported `atsPdfFilename(content)` so both download paths share it (behavior of `createCVAts` unchanged) |
| `src/routers/index.ts` | `router.get('/api/me/:identifier/download-pdf', fnDownloadPublicPdf)` + `@swagger` block; registered before the `/api/*` 404 catch-all; 2-segment path can't collide with `/api/me/:email` |
| `src/__tests__/candidate_me/public-pdf.test.ts` (new) | 12 tests (render + data lookup mocked) |
| `CLAUDE.md`, `README.md` | structure row, API row, test-table row |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | appended PENDING node row |

Rate limiting: no code — `src/server.ts:83` `app.use(rateLimitMiddleware)` precedes `app.use(router)` (line 85), so every `/api/me/*` route is covered (proven live via `X-RateLimit-*` headers below).

## Command
Repo root, per `doctrine/MEMORY.md`: `npm test`; `npm run build` (Typecheck); lint as `npx eslint . --format json` on the diff tree vs a `git stash push -u -- src` baseline (`status identical after stash/pop`), diffed per file+rule.
Extra (acceptance 1/3/4 + PDF standard need real extraction): `$S/probe217.sh` — throwaway `mongod` 8.0.1 on 127.0.0.1:27994 (dbpath in session scratchpad), real server `npx ts-node --transpile-only -r tsconfig-paths/register src/server.ts` on 127.0.0.1:3997 with inline env (no `.env` exists in repo), register+login via API, seed via mongosh, `curl` both download paths, extract text with the repo's own `extractPdfText` (`src/services/atsExtract.ts`, pdf-parse) via temp `src/__probe217_extract.ts` (deleted after; `ls src | grep -c probe` → `0`), then server killed, mongod shut down, dbpath removed (`cleaned`).

## Output
`npm test` — run A (before the lint fix): `TEST_EXIT=0`, `Test Suites: 40 passed, 40 total`, `Tests: 336 passed, 336 total`.
Run B (after the lint fix) — **one failing run, recorded honestly**:
```
TEST_EXIT=1
FAIL src/__tests__/utils/helper.test.ts
  ● Test suite failed to run
    A jest worker process (pid=71901) was terminated by another process: signal=SIGSEGV, exitCode=null.
Test Suites: 1 failed, 39 passed, 40 total
Tests:       333 passed, 333 total
```
`helper.test.ts` doesn't import anything touched here. Re-checked: `npx jest src/__tests__/utils/helper.test.ts` → `Tests: 3 passed, 3 total`; then two more full runs on the same final tree:
```
RUN1 TEST_EXIT=0
Test Suites: 40 passed, 40 total
Tests:       336 passed, 336 total
RUN2 TEST_EXIT=0
Test Suites: 40 passed, 40 total
Tests:       336 passed, 336 total
```
→ treated as a transient jest-worker crash, not a regression (also listed under Noticed).

`npm run build` (final tree): `BUILD_EXIT=0`, ending `> cp -R ./src/views ./src/public ./dist/`.

Lint (final tree): `lint before 276 after 276` (no DELTA). Intermediate run had `DELTA src/candidate_me/public-pdf.ts @typescript-eslint/no-unsafe-member-access 0 -> 1` (`_me.data?.isPublic` on `any`) → fixed by narrowing `_me.data` to `(AggregatedCandidateData & { isPublic?: boolean }) | null`.

Targeted: `npx jest src/__tests__/candidate_me/public-pdf.test.ts` → `Tests: 12 passed, 12 total`.

Live probe, final tree (`$S/probe217-final.out`; seeded candidate slug `probe-dat`, email `probe217@example.com`, 1 experience, 1 education, localized intro):
```
auth     status=200 type=application/pdf bytes=86167 time=0.667597     (GET /api/v1/download-pdf?template=ats&lang=en, Bearer)
pub1     status=200 type=application/pdf bytes=86167 time=0.523559     (GET /api/me/probe-dat/download-pdf?template=ats&lang=en, no auth)
pub2     status=200 type=application/pdf bytes=86167 time=0.006476     (same again)
pubmail  status=200 type=application/pdf bytes=86167 time=0.006186     (GET /api/me/probe217@example.com/download-pdf?lang=en)
pubvi    status=200 type=application/pdf bytes=86331 time=0.586010     (GET /api/me/probe-dat/download-pdf — defaults)
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 96
Content-Disposition: attachment; filename="Tan_Vo_CV_CV.pdf"
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
pub1 == pub2 byte-identical (cache hit)
pub1 == pubmail byte-identical (slug/email share key)
auth.pdf chars 287
pub1.pdf chars 287
pubvi.pdf chars 257
TEXT auth == pub1 (identical extracted text)
--- bad template
{"success":false,"message":"Chỉ hỗ trợ template=ats","errors":null,"data":null} status=400
HTTP/1.1 400 Bad Request        (private: isPublic set false via mongosh)
HTTP/1.1 400 Bad Request        (unknown identifier)
private body == unknown body
priv.h:Content-Type: application/json; charset=utf-8
unk.h:Content-Type: application/json; charset=utf-8
--- disk: any pdf written under src/public or dist/public?
(end find)
cleaned
```
Extracted text of the earlier identical run (pub1, en):
```
Tấn Võ
Ho Chi Minh City · 0900000000 · probe217@example.com
SUMMARY
Frontend developer with 5 years of experience
EXPERIENCE
Senior Frontend Engineer — Acme Corp
09/2021 – Present
Built the design system in Vue 3
Stack: Vue.js, Nuxt
EDUCATION
Computer Science — HCMUT
09/2012 – 12/2016
```
pubvi headings: `TÓM TẮT`, `KINH NGHIỆM LÀM VIỆC`, `HỌC VẤN`, `09/2021 – Hiện tại`, `Công nghệ: Vue.js, Nuxt`.
(Filename `Tan_Vo_CV_CV.pdf` = empty headline: the probe seeded `positionDesired` into collection `generalinformations` while the model uses `general-informations` — probe artifact; identical on both paths since both use `atsPdfFilename`.)

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. Public slug/email → 200 `application/pdf`, no auth; text == authenticated ATS export | `pub1`/`pubmail` `status=200 type=application/pdf` with no header/cookie; `TEXT auth == pub1 (identical extracted text)` (287 chars each); `Content-Disposition: attachment`; unit test "sends the ATS PDF as an attachment…" ✓ |
| 2. Private → same as unknown | live: both `HTTP/1.1 400`, `private body == unknown body`, same Content-Type; unit "answers a private profile exactly like an unknown identifier, without rendering" ✓ (status + json call args equal, render not called) |
| 3. Repeat within cache window doesn't relaunch Puppeteer | live: `pub2` 0.006s vs `pub1` 0.52s and `pub1 == pub2 byte-identical` (a fresh render carries a new metadata date, cf. `pub1 != auth bytes` in the first probe run); unit: cache hit (render ×1), concurrent dedupe (×1), data/lang change re-renders, TTL expiry re-renders, failed render not cached, eviction at cap ✓ |
| 4. Rate-limited like other public routes | live `X-RateLimit-Limit: 100` / `Remaining: 96 → 95` on the new route; mounting order `server.ts:83` before router |
| 5. Swagger updated | `@swagger /api/me/{identifier}/download-pdf` block in `src/routers/index.ts` (params, 200 binary, 400, 429); `npm run build` (swagger-jsdoc in src compiles) |
| No PII on disk (`PERSIST_EXPORTED_PDF` off by default) | new path never writes; live `find src/public dist/public -name "*.pdf" -newer probe` → empty |
| `npm test` | final tree RUN1/RUN2: `Tests: 336 passed, 336 total`, TEST_EXIT=0 (one transient SIGSEGV run recorded above) |
| Typecheck | `BUILD_EXIT=0` |
| Lint no new problems | `lint before 276 after 276` |
| pdf-export-standard 10 invariants | Renderer/template untouched — new route calls the existing `renderAtsPdfBuffer` with the same `(data, { lang })` as `fnExportPDF`'s ATS branch → same HTML. Read back from real extraction: (1) no spaced letters in text (`SUMMARY`, `EXPERIENCE`, `Vue.js`); (2) font handling unchanged (`document.fonts.ready` awaited in renderer); (3) `lang=en` → English headings, default → `TÓM TẮT`/`KINH NGHIỆM LÀM VIỆC`/`HỌC VẤN`; (4) `09/2021`, `12/2016` zero-padded; (5) `Stack: Vue.js, Nuxt` per-item list renders; (6) description goes through the renderer's existing sanitizer (unchanged); (7) no DOB/gender/photo in extracted text; (8) ATS template single-column, unchanged; (9) metadata via the same `applyPdfMetadata` inside `renderAtsPdfBuffer`; (10) no disk write, filename has names only (`atsPdfFilename`, never email) |
| comments per code-comments.md | `public-pdf.ts`: file-overview JSDoc + `@author`/`@see` (mirrors siblings `search.ts`/`ats-check.ts`); `/** */` on `cache` (WHY content-hash key + promise dedupe); `//` "Map iterates in insertion order…" (WHY first key = oldest); `//` "A failed render must not be served…" (WHY); `//` "Only the ATS template is public: the classic renderer also writes the file under public/." (WHY); `//` "Private profile answers exactly like an unknown one, same as fnGetAboutMe." (WHY). `createPDF.ats.ts`: `/** */` on exported `atsPdfFilename` (contract: never email). Test file header explains what's mocked/where real path is covered. No `(#N)` refs, no stacked `//`. Swagger = functional doc |

## Noticed, not done
- **Pre-existing filename bug**: `slugifyFilename` (`createPDF.ats.ts`) uses NFD + strip diacritics, but `Đ`/`đ` don't decompose → dropped: `Võ Đạt` → `Vo_at` (found by my first unit-test fixture; affects the owner's existing `download-pdf?template=ats` too). One-line fix (`.replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))`) — own node, not folded in (SmallestDiff). Test fixture changed to `Võ Tấn` accordingly.
- Transient jest worker SIGSEGV once on `helper.test.ts` (unrelated suite), not reproduced in 3 subsequent runs.
- Cache is per-process (multiple instances each keep their own); fine for the single Render instance.
- Diagram file still ~154KB vs 15KB guideline — archive pass due.
- Frontend follow-up (out of scope): `datvt243.github.io` can delete `server/utils/createPDFAts.ts` and proxy `/api/generate-pdf?template=ats` here.

## Seal gate
none — no commit/push/external call (`gh issue develop` in /todo step 0 is part of the /todo contract).
