# 2026-09-20 — add-linkedin-export-parse-endpoint

- Worker: implementer
- Version: 0.1.0
- Node: `add-linkedin-export-parse-endpoint` (new, `haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: GitHub issue #141 — "PDF/LinkedIn-export parsing endpoint for CV
  data import" (verbatim issue body passed via `/todo ##141`, treated as
  issue #141).

## Hub bytes before
80108

## Scope decision
The issue's own text recommends scoping the LinkedIn CSV path first
("structured, low ambiguity") and treating PDF free-text parsing as a
stretch/follow-up — this node implements ONLY the LinkedIn "Data export"
ZIP path. PDF text-extraction (`pdf-parse` + regex heuristics) is
deliberately NOT implemented here; left as its own follow-up node if
picked up. Endpoint named `POST /api/v1/candidate/parse-linkedin-export`
rather than the issue's suggested `/parse-cv` — that name would overstate
scope (implies PDF support exists too), so it was changed to be accurate
about what this node actually does.

## Diff
| File | Why |
|---|---|
| `package.json`/`package-lock.json` | Added `adm-zip` (read the export ZIP without writing to disk) + `csv-parse` (RFC4180-correct CSV parsing, handles quoted commas LinkedIn's export can contain in company/school names) via `npm install`; `@types/adm-zip` as a dev dependency (`csv-parse` ships its own types) |
| `src/candidate/parseLinkedInExport.service.ts` (new) | Pure parsing function `parseLinkedInExportZip(buffer)` — no I/O beyond the buffer, never touches the DB. Finds `Education.csv`/`Positions.csv` anywhere in the zip (LinkedIn nests them in a dated folder), case-insensitive header matching, best-effort date parsing (`Date.parse`, "Present"/empty → `null`/`isCurrent: true`), filters out blank rows (no school/company name). Throws `Error('INVALID_ZIP')` for a corrupt/non-zip buffer; returns `{ educations: [], experiences: [] }` (no throw) when the zip is valid but doesn't contain either CSV |
| `src/middlewares/uploadLinkedInExport.middleware.ts` (new) | Multer config, same error-wrapping pattern as `uploadCV.middleware.ts` — but `memoryStorage()` (nothing persisted to disk, unlike the CV-upload feature) + `.zip`-only filter (mimetype + extension) + 20MB cap |
| `src/candidate/candidate.controller.ts` | New `fnParseLinkedInExport` — reads `req.file.buffer`, calls the service, returns parsed data as-is (never persisted). Missing file → 400; `INVALID_ZIP` → 400; any other thrown error → `handleError` (500, not swallowed) |
| `src/routers/api/v1/candidate.route.ts` | `POST /parse-linkedin-export` mounted with `uploadLinkedInExportMiddleware` + `fnParseLinkedInExport` — inherits `verifyToken` from the router-level mount in `routers/api/v1/index.ts` (`router.use('/candidate', verifyToken, routeCandidate)`), same as every other candidate route. Full Swagger JSDoc block added, including the response shape |
| `src/locales/vi.ts`, `src/locales/en.ts` | New `linkedinImport.*` message keys (`noFileUploaded`, `invalidFileType`, `fileTooLarge`, `invalidZip`, `parseSuccess`, `parseFailed`), matching the existing `candidate.cv*`/`images.*` naming pattern |
| `src/__tests__/candidate/parseLinkedInExport.service.test.ts` (new) | 5 tests on the pure parser using real in-memory ZIP fixtures built with `adm-zip` itself: correct field mapping + date parsing + `isCurrent`, nested-folder file discovery (matches LinkedIn's real export shape), case-insensitive headers, empty-result (no throw) when neither CSV is present, `INVALID_ZIP` thrown for a non-zip buffer |
| `src/__tests__/candidate/candidate.controller.test.ts` (new) | 4 tests on `fnParseLinkedInExport`'s own logic (the service is mocked): 400 on missing file, 200 with the parsed data passed through unchanged on success, 400 `invalidZip` on `INVALID_ZIP`, and an unrecognized error is forwarded through `handleError` (verified it becomes a 500 `AppError`, not swallowed or misrouted as a 400) |

## Command
`npm run build`
`npm test`

## Output
`npm run build`:
```
> resume-nodejs-api@1.7.0 build
> tsc && npm run copy

> resume-nodejs-api@1.7.0 copy
> cp -R ./src/views ./src/public ./dist/
```
(clean exit, no tsc errors)

`npm test`:
```
Test Suites: 24 passed, 24 total
Tests:       136 passed, 136 total
Snapshots:   0 total
Time:        27.237 s
Ran all test suites.
```
Prior count on this branch's base (`staging`, post-v1.7.0 release) was 22
suites/127 tests; this node added 2 new suites (9 new tests) — 24/136,
all green.

Additionally, an independent Node/ts-node script parsed the generated
Swagger spec and confirmed `POST /api/v1/candidate/parse-linkedin-export`
resolves with the full `educations`/`experiences` response schema intact
(no parse errors, no malformed JSDoc block) — printed and inspected the
`data.properties` tree, matches the route file's JSDoc exactly.

## Acceptance
| Criterion | Evidence |
|---|---|
| New stateless parse-and-return endpoint exists, auth-gated, never persists | `candidate.route.ts` diff (mounted behind the existing `verifyToken` at router level); `fnParseLinkedInExport` never calls any `baseCreateDocument`/model `.create()`/`.save()` — only returns `parseLinkedInExportZip`'s return value directly |
| LinkedIn export ZIP → Education/Experience shapes, best-effort | `parseLinkedInExport.service.ts`; `parseLinkedInExport.service.test.ts` — 5/5 passing, including real date-parsing and nested-folder discovery against the actual LinkedIn export layout |
| Accepts ZIP only, size-capped, real content-type check (not just client `accept`) | `uploadLinkedInExport.middleware.ts` — mimetype AND extension both checked, 20MB `limits.fileSize` |
| Errors handled without crashing/swallowing | `candidate.controller.test.ts` — missing-file/invalid-zip/unexpected-error branches all covered, unexpected error confirmed to reach the global error handler as a 500, not silently dropped |
| No `<<FILL>>` blockers | `doctrine/MEMORY.md` test/build commands both real, both run verbatim above |
| SmallestDiff / proportionate | PDF path deliberately NOT implemented (issue's own recommendation); no existing CRUD model/route touched; new dependency additions are the minimum needed (a maintained zip reader + a maintained CSV parser, not a hand-rolled parser for either) |

## Noticed, not done
- PDF free-text parsing (the other half of the issue's proposal) — left
  as a follow-up per the issue's own scope note. Own node if picked up.
- Frontend mapping/review-before-save UI is `resume-vuejs-website#120`,
  a separate repo, out of scope here.

## Seal gate
None — no outward-facing action taken (no commit/push).
