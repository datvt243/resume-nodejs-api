# 2026-10-10 — add-public-ats-pdf-download (implementer plan)

Worker: implementer · Version 0.1.0
Node: `add-public-ats-pdf-download` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended row, PENDING)
Task (verbatim): `#217` (via `/todo #217`) — "Public unauthenticated ATS PDF download for public profiles (GET /api/me/:identifier/download-pdf)"; issue body is the full task.
Branch: `217-public-unauthenticated-ats` off freshly pulled `staging` @ `95227aa`.

## Hub bytes before: 230699
(per-session formula, measured before the diagram row + this note)

## Implementer decisions (issue explicitly leaves these open)
1. Public template = `ats` only (default). Any other `template` → 400. Reason: frontend only needs `ats`; `classic` `createCV` writes `src/public/pdf/<email>.pdf` (PII on disk under `express.static`, pdf-export-standard rule 10 + PROJECT.md trap) — not exposing that publicly.
2. Cache = in-memory Map keyed by sha256(JSON of resolved aggregated data) + lang. Any CV edit changes the data → new key → invalidation by construction, no hooks on every write path. TTL (1h) + entry cap (bounded memory) + in-flight promise dedupe (no stampede). Each request still does the cheap Mongo reads (`handlerGetAboutMe`), only Puppeteer is skipped on hit. Redis not used: buffers are binary + Redis is optional in this app.
3. Rate limit = existing global `rateLimitMiddleware` (`src/server.ts:83`, `app.use` before `app.use(router)`) already covers `/api/me/*`. Renders per candidate are bounded anyway: key space ≈ 2 langs × (profiles+1) per data version; invalid/foreign profile ids fall back to unfiltered data → same key.

## Acceptance (from issue)
1. `GET /api/me/<public slug|email>/download-pdf?template=ats&lang=en` → 200 `application/pdf`, attachment, no auth. Extracted text == authenticated `download-pdf?template=ats` for the same candidate.
2. Private profile → same response as unknown identifier.
3. Repeated request within the cache window doesn't launch Puppeteer again.
4. Rate-limited like other public routes.
5. Swagger updated.
Plus: pdf-export-standard 10 invariants (render path unchanged → reuse; rule 10 explicitly: no disk write), `npm test`, `npm run build`, lint delta 0, code-comments row.

## Code anchors
- `src/candidate_me/index.ts` `fnGetAboutMe` (private-profile mirroring), `handlerGetAboutMe`, `fnExportPDF` (auth ATS path)
- `src/services/createPDF.ats.ts:398` `renderAtsPdfBuffer`, `:448` `createCVAts` (filename + headers), private `slugifyFilename`
- `src/routers/index.ts` (`/api/me/*` routes + swagger)
- `src/server.ts:83` global rate limiter

## Blockers
none.
