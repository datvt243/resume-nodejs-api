# 2026-10-10 — add-visit-referrer-source (implementer diff)

Worker: implementer · Version 0.1.0
Node: `add-visit-referrer-source` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING — status left to verifier)
Task (verbatim): `#248 Referrer/source tracking for public-profile visits (follow-up to #164)` (via `/todo "#248"`, branch `248-referrer-source-tracking-for` off freshly pulled `staging` @ `b17d4f1`)
Plan note: `evidence/implementer/2026-10-10/add-visit-referrer-source-plan.md`

## Hub bytes before
229877

## Operator decisions (AskUserQuestion, 2026-10-10)
- Source: "Body field only (Recommended)" — Referer header ignored (SPA XHR's own Referer = the CV page).
- Normalize: "Strip www. and m. (Recommended)".

## Diff
| File | Why |
|---|---|
| `src/models/visit.model.ts` | New `referrer: { type: String, default: null }` + 1-line `//` (hostname-only rationale) |
| `src/candidate_me/index.ts` | `handlerRecordVisit` reads `req.body?.referrer` → `normalizeReferrer()` → passed to `Visit.create`. New exported `normalizeReferrer(raw: unknown): string \| null` (non-string/empty/>2048 chars/unparsable/non-http(s) → null; `URL.hostname` lowercased; strip leading `www.`/`m.`; empty → null) with JSDoc incl. why body not header. Constant `REFERRER_MAX_LENGTH = 2048` |
| `src/candidate/visitStats.service.ts` | `$facet.sources: [{ $group: { _id: '$referrer', count } }, { $sort: { count: -1, _id: 1 } }]` (same sort as `countries`); `VisitStats.sources`/`FacetResult.sources` types; return maps `{ source, count }`; file overview updated (no longer "no schema change") |
| `src/routers/index.ts` | swagger: optional `requestBody.referrer` on `POST /api/me/{email}/visit` |
| `src/routers/api/v1/candidate.route.ts` | swagger: `sources` array in `/visits/stats` 200 schema + summary/description |
| `src/__tests__/candidate/visitStats.service.test.ts` | zero-fill test now asserts `sources` mapping; new test asserts the `sources` facet pipeline stage |
| `src/__tests__/candidate_me/index.test.ts` | 2 `handlerRecordVisit` tests (body referrer stored normalized while a `headers.referer` is ignored; no body → `referrer: null`, still success) + `normalizeReferrer` table: 5 valid, 10 invalid, oversized cap |
| `CLAUDE.md`, `README.md` | doc rows: Visit model field, visit POST body, `/visits/stats` `sources`, test-table rows |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | appended PENDING node row (AppendOnly) |

`GET /visits` (`candidate.service.ts:120`) untouched — returns full docs, so new docs simply carry an extra `referrer` key (additive).

## Command
From repo root (`doctrine/MEMORY.md`): `npm test`, `npm run build` (Typecheck row), `npm run lint` measured as `npx eslint . --format json` before (clean `src/` at HEAD, only agent-hub files changed at that point) vs after, diffed per file+rule.
Extra: live probe against a throwaway local `mongod` 8.0.1 (127.0.0.1:27993, dbpath in session scratchpad), temp script `src/__probe248.ts` run via `npx ts-node --transpile-only -r tsconfig-paths/register`, then deleted (`ls src | grep -c probe` → 0), mongod shut down, dbpath removed.

## Output
`npm test` (final tree):
```
TEST_EXIT=0
Test Suites: 39 passed, 39 total
Tests:       324 passed, 324 total
Snapshots:   0 total
Time:        8.92 s, estimated 11 s
Ran all test suites.
```
(also present: the pre-existing "A worker process has failed to exit gracefully" jest warning — same as on prior nodes, not introduced here)

`npm run build`:
```
BUILD_EXIT=0
> resume-nodejs-api@1.12.0 copy
> cp -R ./src/views ./src/public ./dist/
```

Lint:
```
lint before 276 after 276
```
(no DELTA lines). An intermediate run showed `DELTA src/__tests__/candidate_me/index.test.ts @typescript-eslint/unbound-method 16 -> 18` from my 2 new `expect(MODEL.Visit.create).toHaveBeenCalledWith(...)` asserts; rewritten as `expect((MODEL.Visit.create as jest.Mock).mock.calls[0][0]).toEqual(...)` → file back to 16 (remaining hits at lines 59-60 are the pre-existing test).

Targeted run (before the lint rewrite): `Test Suites: 2 passed, 2 total` / `Tests: 46 passed, 46 total`.

Live mongod probe (candidate `me` has 1 legacy doc inserted raw WITHOUT a `referrer` field; another candidate has 1 `linkedin.com` visit; 6 `handlerRecordVisit` calls all with `headers.referer: 'https://datvt243.github.io/'` and bodies `www.LinkedIn.com/feed/?trk=1`, `m.facebook.com/x`, `garbage`, no body, `lnkd.in/a`, `linkedin.com/`):
```
record {"success":true,"message":"Ghi nhận lượt ghé thăm thành công","data":null}   (x6)
stored ["<missing>","linkedin.com","facebook.com",null,null,"lnkd.in","linkedin.com"]
total 7 sources [{"source":null,"count":3},{"source":"linkedin.com","count":2},{"source":"facebook.com","count":1},{"source":"lnkd.in","count":1}] countries [{"country":null,"count":6},{"country":"VN","count":1}]
```
(probe printed `process.config` missing-env warnings for TOKEN_SECRET/TOKEN_REFRESH/SESSION_SECRET — no `.env` in that run, non-fatal)

## Acceptance
| Criterion | Evidence |
|---|---|
| Only hostname stored, normalized | probe `stored`: `www.LinkedIn.com/feed/?trk=1` → `linkedin.com`, `m.facebook.com/x` → `facebook.com`; unit `normalizeReferrer` table ✓ (path/query dropped, `l.facebook.com`/`lnkd.in` kept) |
| Malformed → null, never an error | probe: `garbage` and no-body → `null`, all 6 `record` → `success:true`; unit: 10 invalid cases + oversized → null |
| Referer header ignored (operator decision) | probe: header `datvt243.github.io` on every call, never appears in `sources`; unit test "ignoring the Referer header" ✓ |
| `/visits/stats` `sources`, old visits → null, own-data-only | probe: legacy `<missing>` doc counted under `source:null` (3 = legacy + garbage + no-body); other candidate's `linkedin.com` NOT counted (`linkedin.com: 2` = my 2 only). Same `$match` as before (unchanged code) |
| No regression `POST /visit` / `GET /visits` | existing `handlerRecordVisit` fail-closed test ✓; `candidate.controller.test.ts` in the 39/39; `fnGetVisits`/`handlerGetVisits` untouched |
| `npm test` | `Tests: 324 passed, 324 total`, TEST_EXIT=0 |
| Typecheck | `BUILD_EXIT=0` |
| Lint no new problems | `lint before 276 after 276`, no DELTA |
| comments per code-comments.md | Added: `visit.model.ts` 1-line `//` (WHY: personal data in path/query); `normalizeReferrer` `/** */` JSDoc on exported fn (WHY body not header, never-fail contract); `visitStats.service.ts` 1-line `//` on `sources` facet (WHY missing → null); file overview edited (removed now-false "no schema change"). Swagger blocks = functional docs. No `(#N)` refs, no stacked `//`. Test-only: none added |

## Noticed, not done
- Frontends (`resume-vuejs-website/src/pages/public/PagePublicResume.vue:82`, `datvt243.github.io/plugins/VisitTracker.client.ts`) don't send `referrer` yet — until they forward `document.referrer` in the POST body, new visits group under null. Separate repos, out of scope.
- Prettier `--check` fails on 4 touched files, but each already failed at HEAD (`git show HEAD:<f> | prettier --check`) — Prettier isn't enforced here; not reformatted (SmallestDiff).
- Diagram file is ~154KB vs 15KB guideline — archive pass due (separate action).

## Seal gate
none — no commit/push/external call. (`gh issue develop` branch creation in /todo step 0 is part of the /todo contract.)

## Correction (2026-10-10, after verifier SEAL)
The Acceptance row says "10 invalid cases"; the `it.each` table actually has 9 (plus the separate oversized-cap test). Flagged by the verifier as non-blocking.
