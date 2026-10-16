# 2026-10-16 — add-application-profile-link (implementer diff)

Worker: implementer · Version 0.1.0
Node: `add-application-profile-link` (`haven/diagrams/dev-loop.prime-mermaid.md`, PENDING — status left to verifier)
Task (verbatim): `#256 Link each application to a CV profile (Application.profileId)` via `/todo #256`
Branch: `256-link-each-application` off `staging` @ `b13a314`
Plan note: `evidence/implementer/2026-10-16/add-application-profile-link-plan.md`

## Hub bytes before
234872

## Diff
| File | Why |
|---|---|
| `src/models/application.model.ts` | `profileId: { type: ObjectId, default: null, ref: 'profile' }` + one `//` WHY (kept if the profile is soft-deleted later) |
| `src/candidate_profile/application/application.validate.ts` | `profileId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '')` + one `//` (null/'' unlinks; ownership checked in the service) |
| `src/candidate_profile/application/application.service.ts` | Keeps `handlerGet`/`handlerDelete` from `createCrudService`; wraps `handlerCreate`/`handlerUpdate` with `checkProfileLink`: omitted → item unchanged; `''`/`null` → `profileId: null`, no lookup; otherwise `idQuerySafe.safeQuery({}, { _id: profileId, candidateId })` and, only if both keys survive, `ProfileModel.exists({ ...safe, deletedAt: null })`; not found → `{ success: false, statusCode: 400, message: t('application.profileNotFound') }` and the CRUD handler is never called. `createCrudController` spreads the result after `statusCode: CREATED`, so the 400 wins (proven below). |
| `src/locales/{vi,en}.ts` | `application.profileNotFound` |
| `src/config/swagger.config.ts` | `Application.profileId` (nullable, with the rules) |
| `src/__tests__/candidate_profile/application.service.test.ts` (new) | 17 tests: schema accepts id/null/''/absent, rejects `abc`, 25-hex, `$ne`, 42, `{ $ne: null }`, `[id]`; owned → exact `exists` filter + forwarded to CRUD; foreign/deleted/missing → exact 400 result on create AND update, CRUD never called; QuerySafe-rejected candidateId → no Profile query, failure; `''`/null → null, no lookup; omitted → item passed through untouched; `fnCreate` with unowned profile → `res.status(400)` + localized message. |
| `CLAUDE.md`, `README.md` | structure rows, Application model row, test table row, README feature line |
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | appended PENDING node row (text corrected once right after adding it: "on create, update and bulk create" → "on create and update" — `application.route.ts` has no bulk route) |

## Command
Repo root, per `doctrine/MEMORY.md`: `npm test`; `npm run build` (Typecheck). Lint: `npx eslint . --format json` on the diff tree vs a `git stash push -u -- src` baseline (`status identical after stash/pop`), per file+rule.
Extra (shared `baseCreateDocument`/`baseUpdateDocument` path + Mongoose casting/defaults can't be proven with the mocked CRUD): throwaway `mongod` 8.0.1 on 127.0.0.1:27995 (dbpath in session scratchpad), probe `$S/probe256.ts` calling the REAL `fnCreate`/`fnUpdate` controllers (real Joi, real service, real BaseService/base ops) with a stub `res`; then `db.shutdownServer()`, dbpath + probe removed (`cleaned`, `no-mongod`, `ls src | grep -c probe` → `0`). Plus a no-DB `Application.hydrate()` check of the legacy default (scratch file, removed).

## Output
```
Test Suites: 43 passed, 43 total
Tests:       378 passed, 378 total
TEST_EXIT=0
> cp -R ./src/views ./src/public ./dist/

BUILD_EXIT=0
status identical after stash/pop
lint before 276 after 276
delta lines 0
```
(staging baseline 361; +17 new.) First run of the new file alone: `Tests: 5 failed, 12 passed` — 4 schema "accepts" cases + the controller case failed with `"_id" is required`: my fixture lacked `_id: null` (the shared `_id` Joi rule requires the key, null allowed — what the frontend sends on create). Fixture fixed, no production change → `Tests: 17 passed, 17 total`.

Live probe (real mongod, real controllers), verbatim:
```
CREATE owned 201 true "Created successfully" apps= 1
CREATE deleted 400 false "The selected CV profile does not exist or has been deleted" apps= 1
CREATE foreign 400 false "The selected CV profile does not exist or has been deleted" apps= 1
CREATE malformed 400 false "Validation has errors" apps= 1
CREATE random-missing 400 false "The selected CV profile does not exist or has been deleted" apps= 1
CREATE no-profileId 201 true apps= 2
STORED linked.profileId= 6ad20fe9bd24f7f1d8a91b20 plain.profileId= null
UPDATE omit 200 true profileId= 6ad20fe9bd24f7f1d8a91b20
UPDATE foreign 400 false "The selected CV profile does not exist or has been deleted" profileId= 6ad20fe9bd24f7f1d8a91b20
UPDATE '' 200 true profileId= null
UPDATE relink 200 true after profile soft-delete profileId= 6ad20fe9bd24f7f1d8a91b20
LEGACY read profileId= undefined
PROBE_EXIT=0
```
`apps=` = applications collection count after each call (rejected creates write nothing). `LEGACY ... undefined` is from a `.lean()` read in the probe (raw doc, no defaults). The real GET path (`baseGetAll` → `baseFindDocument`, `services/index.ts:105-128`) uses `find(...).exec()` without `lean`, i.e. hydrated documents — checked separately:
```
HYDRATED profileId= null in JSON= true
```
so pre-existing applications are returned with `profileId: null`.

## Acceptance
| # | Criterion | Evidence |
|---|---|---|
| 1 | `profileId` optional ObjectId, default null | model diff; probe `plain.profileId= null` |
| 2 | Joi: id / null / '' accepted, anything else 400 | schema unit tests; probe `CREATE malformed 400` |
| 3 | Foreign/deleted/missing → 400, nothing written (create + update) | unit (CRUD never called, exact 400 result) + controller 400; probe `apps=` unchanged, update leaves stored id unchanged |
| 4 | Owned → stored/returned; null/'' unlinks; omitted keeps | unit; probe `CREATE owned`, `UPDATE ''` → null, `UPDATE omit` → id kept |
| 5 | Existing applications unaffected (`profileId` null) | probe `CREATE no-profileId 201`; `HYDRATED profileId= null` |
| 6 | No regression to CRUD/soft-delete/restore | full suite 378/378; `handlerGet`/`handlerDelete` unchanged; delete/restore routes use `baseDelete`/`baseRestore` (untouched) |
| 6b | Profile soft-deleted later → id kept (operator decision) | probe `UPDATE relink ... after profile soft-delete profileId=` id; no cascade code added |
| 6c | GET returns id only via shared path (operator decision) | no change to `baseGetAll`/route |
| 7 | Tests, test/build/lint 0, swagger + docs | Output above |
| 8 | comments per code-comments.md | model: one `//` WHY; validate: one `//` (where ownership lives); service: one `/** */` WHY on `checkProfileLink` (Joi checks shape only; never point at others'/deleted; ''/omit semantics). New test file: overview JSDoc. Swagger description is functional docs. No `(#N)` refs, no stacked `//`. |

## Noticed, not done
- Time-of-check gap: a profile soft-deleted between the `exists` check and the save would still be linked — harmless given decision 2 (deleted-later links are kept anyway).

## Status
`sealed_pending_verifier`
