# 2026-10-16 — add-visit-profile-tracking (implementer diff)

Worker: implementer · Version 0.1.0
Node: `add-visit-profile-tracking` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING — status left to verifier)
Task (verbatim): `#253 Record which CV profile was viewed on public-profile visits` via `/todo #253`
Branch: `253-record-which-cv` off `staging` @ `89360fc`
Plan note: `evidence/implementer/2026-10-16/add-visit-profile-tracking-plan.md`

## Hub bytes before
231949

## Diff
| File | Why |
|---|---|
| `src/models/visit.model.ts` | `profileId: { type: ObjectId, default: null, ref: 'profile' }` + one `//` WHY (only ever an owned id; null = default link) |
| `src/candidate_me/index.ts` | `handlerRecordVisit` reads `body.profile` (same body object as `referrer`), passes `profileId` to `Visit.create`. New exported `resolveVisitProfileId(raw, candidateId)`: null unless `candidateId` set, raw is a string matching `/^[a-f\d]{24}$/i` (rejects malformed before Mongoose would throw a CastError on the visit), QuerySafe `idQuerySafe` keeps `_id`, and `Profile.findOne({ _id, candidateId, deletedAt: null }).select('_id')` finds it. `import type { Model, Types }`. |
| `src/candidate/visitStats.service.ts` | `$facet.profiles`: `$group _id '$profileId'` → `$sort { count: -1, _id: 1 }` → `$lookup` (`from: MODELS.Profile.collection.name`, `_id`↔`_id`, `as: 'profile'`) → `$project { count, found: size>0, name, deletedAt }`. Mapped to `{ profileId: string\|null, name: string\|null, deleted, count }`; `deleted = _id !== null && (!found \|\| deletedAt != null)`. `VisitStats`/`FacetResult` types extended; file overview updated. Same `$match` → own data only. |
| `src/routers/index.ts` | swagger: `requestBody.profile` on `POST /api/me/{email}/visit` |
| `src/routers/api/v1/candidate.route.ts` | swagger: `/visits/stats` summary/description + `profiles` item schema |
| `src/__tests__/candidate_me/index.test.ts` | +10 tests: owned profile stored (asserts exact `findOne` filter incl. `candidateId` + `deletedAt: null`); foreign/deleted (`findOne` → null) stored null; `it.each` over `undefined, '', 'abc', '$gt', 25-hex, { $ne: null }, [id], 42` → null and `Profile.findOne` never called |
| `src/__tests__/candidate/visitStats.service.test.ts` | `Profile.collection.name` added to the models mock; zero-fill `toEqual` gains `profiles: []`; +2 tests: facet stages (`$group`/`$sort`/`$lookup`) and row mapping (live / null / soft-deleted / missing) |
| `CLAUDE.md`, `README.md` | structure rows, `/visits/stats` + `POST visit` rows, Visit model row, test-table rows |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | appended PENDING node row |

## Command
Repo root, per `doctrine/MEMORY.md`: `npm test`; `npm run build` (Typecheck). Lint: `npx eslint . --format json` on the diff tree vs a `git stash push -- src` baseline (`status identical after stash/pop`), diffed per file+rule.
Extra (the `$lookup` inside `$facet` and the ownership check can't be proven with the mocked aggregate): throwaway `mongod` 8.0.1 on 127.0.0.1:27994 (dbpath in session scratchpad), probe `$S/probe253.ts` run with `npx ts-node --transpile-only -r tsconfig-paths/register` calling the real `handlerRecordVisit` + `handlerGetVisitStats` against it; afterwards `db.shutdownServer()`, dbpath + probe removed (`cleaned`, `no-mongod`), nothing written under `src/`.

## Output
Final tree (after the lint fix below):
```
Test Suites: 40 passed, 40 total
Tests:       348 passed, 348 total
TEST_EXIT=0
```
(staging baseline was 336 tests; +12 new.) An earlier full run on the pre-lint-fix tree gave the same `40 passed / 348 passed`, `TEST_EXIT=0`.
```
> cp -R ./src/views ./src/public ./dist/

BUILD_EXIT=0
```
Lint, first pass: `lint before 276 after 278`, `DELTA src/__tests__/candidate_me/index.test.ts @typescript-eslint/unbound-method 16 -> 18` — from my 2 bare `expect(MODEL.Profile.findOne)` lines. An `as jest.Mock` cast did NOT clear it (still 278); switched those 2 lines to `expect(jest.mocked(MODEL.Profile).findOne)` → `lint after 276 index.test unbound 16` (delta 0). `npx jest src/__tests__/candidate_me/index.test.ts` → `Tests: 35 passed, 35 total` after the change.

Live probe (real mongod), verbatim:
```
RECORD live true stored profileId= 6ad1f712ef69945e405ce361
RECORD live2 true stored profileId= 6ad1f712ef69945e405ce361
RECORD soon(before delete) true stored profileId= 6ad1f712ef69945e405ce362
RECORD deleted true stored profileId= null
RECORD foreign true stored profileId= null
RECORD malformed true stored profileId= null
RECORD operator true stored profileId= null
RECORD absent true stored profileId= null
RECORD referrer+live true stored profileId= 6ad1f712ef69945e405ce361
IDS live=6ad1f712ef69945e405ce361 soon=6ad1f712ef69945e405ce362 missing=6ad1f713ef69945e405ce395
STATS total 11
STATS sources [{"source":null,"count":10},{"source":"linkedin.com","count":1}]
STATS countries [{"country":null,"count":11}]
STATS profiles [{"profileId":null,"name":null,"deleted":false,"count":6},{"profileId":"6ad1f712ef69945e405ce361","name":"Frontend","deleted":false,"count":3},{"profileId":"6ad1f712ef69945e405ce362","name":"Backend","deleted":true,"count":1},{"profileId":"6ad1f713ef69945e405ce395","name":null,"deleted":true,"count":1}]
OTHER profiles [{"profileId":"6ad1f712ef69945e405ce364","name":"Theirs","deleted":false,"count":1}]
PROBE_EXIT=0
```
(A "Missing required environment variables" warning from `process.config.ts` printed first — expected, no `.env`; probe connects directly.) Reading: null bucket 6 = deleted + foreign + malformed + operator + absent (5) + 1 legacy doc inserted with no `profileId` field; `Backend` was recorded while live, soft-deleted afterwards → own row, `deleted: true`, name kept; `missing` = a stored id with no profile doc → `name: null, deleted: true`; the other candidate's visit to its own profile appears only in its own stats (own-data-only).

## Acceptance
| # | Criterion | Evidence |
|---|---|---|
| 1 | `Visit.profileId` optional ObjectId, default null | `visit.model.ts` diff; probe `absent` → null |
| 2 | Only an owned, non-deleted profile id stored; else null, never an error | unit: exact `findOne` filter + 8-value `it.each` + foreign/deleted test; probe RECORD lines (all `true`, only live/own ids stored) |
| 3 | `/visits/stats` `profiles` from the same `$facet`, own data only, legacy → null, deleted flagged | unit facet-stage + mapping tests; probe STATS/OTHER lines (real `$lookup` inside `$facet` on mongod 8.0.1) |
| 4 | No regression to POST visit / GET /visits / countries / sources | existing referrer + no-body tests unchanged and PASS; `fnGetVisits` untouched; probe `sources`/`countries` still correct; full suite 348/348 |
| 5 | Tests, `npm test`, build, lint delta 0 | Output above |
| 6 | Docs | CLAUDE.md, README.md, 2 swagger blocks |
| 7 | comments per code-comments.md | `visit.model.ts`: one `//` WHY. `resolveVisitProfileId`: `/** */` JSDoc on an exported function (WHY: public route → no planted/foreign ids; never fail the visit; CastError). `visitStats.service.ts`: one `/** */` WHY above `profiles` (lookup by `_id` alone is safe because of the write-time check; deleted keeps its row so restore doesn't shift history); overview line updated to stay true. No `(#N)` refs, no stacked `//`. Swagger blocks are functional docs. |

## Noticed, not done
- `$lookup` uses `localField/foreignField` without a `candidateId` condition — safe only because of the write-time ownership check (documented in the comment); a pipeline-form lookup would need MongoDB 5.0+ for `localField`+`pipeline`, not worth the version coupling here.
- `handlerGetAboutMe` (pre-existing) passes a raw `?profile=` straight to `Profile.findOne`; a malformed non-ObjectId like `abc` likely throws a CastError there (not verified in this pass) — out of scope for this node; could be its own small node.

## Status
`sealed_pending_verifier`
