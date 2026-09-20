# 2026-09-20 — add-cv-profile-selection

- Worker: implementer
- Version: 0.1.0
- Node: `add-cv-profile-selection` (new, `haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: GitHub issue #133 — "CV profile (multi-version) collection +
  slug/PDF selection filter" (verbatim issue body passed via `/todo #133`).

## Hub bytes before
77028

## Diff
| File | Why |
|---|---|
| `src/models/profile.model.ts` | New Mongoose model: `name`, one ObjectId array per selectable section (`educationIds`/`experienceIds`/`projectIds`/`certificateIds`/`awardIds`/`referenceIds`), `candidateId`, `deletedAt` soft-delete (#121 pattern) |
| `src/models/index.ts` | Export `Profile` from the models barrel |
| `src/candidate_profile/profile/profile.validate.ts` | Joi schema — `name` required, 6 optional ObjectId-hex-string arrays, `candidateId` |
| `src/candidate_profile/profile/profile.service.ts` | `createCrudService` wrapper (same as every other section) + new `ensureDefaultProfile(candidateId)` — synthesizes a "Tổng hợp" profile from every existing section item when the candidate has zero profiles yet |
| `src/candidate_profile/profile/profile.controller.ts` | `createCrudController` wrapper (same as every other section) |
| `src/routers/api/v1/profile.route.ts` | `GET /`, `POST /create`, `PUT /update`, `DELETE /delete/:id`, `POST /restore/:id` — same shape as `application.route.ts`; `GET /` runs `ensureDefaultProfile` first |
| `src/routers/api/v1/index.ts` | Mount `routeProfile` at `/profile` behind `verifyToken` |
| `src/types/base.type.ts` | `Collections.PROFILE = 'profiles'` |
| `src/candidate_profile/BaseController.ts` | `modelObject.profiles = MODELS.Profile` (wires generic `baseGetAll`/`baseDelete`/`baseRestore`) |
| `src/candidate/candidate.service.ts` | `MODELS.Profile` added to `CV_SECTION_MODELS` so self-delete (`add-candidate-self-delete`) cascades cleanly instead of orphaning profile rows |
| `src/candidate_me/index.ts` | `handlerGetAboutMe` gains an optional 3rd `profileId` param; `fnGetAboutMe` reads `?profile=` from the query string and passes it through. When a profile resolves (owned by this candidate, not soft-deleted), each of the 6 selectable sections is filtered to `_id: { $in: profileDoc.<section>Ids }`; omitted or unresolved profile id → unfiltered (unchanged existing behavior, existing share-links keep working). `generalInformation` is never filtered (single doc per candidate, not a selectable list) |
| `src/config/swagger.config.ts` | New `Profile` schema |
| `src/routers/index.ts` | `?profile=` query param documented on `GET /api/me/{email}` |
| `src/__tests__/candidate_profile/profile.service.test.ts` (new) | `ensureDefaultProfile`: no-op when a profile already exists; synthesizes correct id lists from all 6 sections when none exists |
| `src/__tests__/candidate_me/index.test.ts` | 4 new tests: no `Profile` query when `?profile=` omitted; correct `$in` filtering per section when a valid profile resolves (and `generalInformation` stays unfiltered); falls back to unfiltered when the profile doesn't resolve; never queries `Profile` when the id is rejected by QuerySafe |

## Scope deliberately left out (per the issue's own text)
- `GET /download-pdf` (`fnExportPDF`) does NOT gain a `?profile=`/`profileId`
  filter — the issue's own proposal calls this optional ("likely a
  profileId filter param on baseGetAll, or the frontend just filters
  client-side... no backend change needed for the DASHBOARD preview side —
  only the anonymous public endpoint strictly needs server-side
  filtering"). Own follow-up node if picked up.
- No one-time migration script — `ensureDefaultProfile` synthesizes lazily
  on first `GET /api/v1/profile` (or first `?profile=`-filtered public
  read once a profile is later resolved), matching the issue's "on first
  read (or via a one-time migration)" wording; a migration script would be
  redundant with this lazy path.
- Frontend work (`resume-vuejs-website#116`) is a separate repo, out of
  scope here.

## Command
`npm run build`
`npm test`

## Output
`npm run build`:
```
> resume-nodejs-api@1.6.0 build
> tsc && npm run copy

> resume-nodejs-api@1.6.0 copy
> cp -R ./src/views ./src/public ./dist/
```
(clean exit, no tsc errors)

`npm test`:
```
Test Suites: 22 passed, 22 total
Tests:       127 passed, 127 total
Snapshots:   0 total
Time:        4.379 s
Ran all test suites.
```
Pre-existing suite count was 21 (per the most recent prior SEALED node,
`fix-soft-delete-bypass-on-update-patch`, 18 suites/96 tests — since
grown by `add-application-tracker`'s +1 suite and `add-csrf-protection-
auth-cookies`'s +3 suites to 21/121); this pass added 2 new suites
(`candidate_profile/profile.service.test.ts`) and 4 new tests inside the
existing `candidate_me/index.test.ts` suite, landing at 22 suites/127
tests, all green.

Additionally, an independent Node/ts-node script parsed the generated
Swagger spec (`swagger-jsdoc`) and confirmed:
```
paths with /profile: [
  '/api/v1/profile',
  '/api/v1/profile/create',
  '/api/v1/profile/update',
  '/api/v1/profile/delete/{id}',
  '/api/v1/profile/restore/{id}'
]
components.schemas.Profile: true
```
and that `GET /api/me/{email}` now lists a `profile` query parameter
alongside the existing `email`/`lang` ones (full parameter array printed
and inspected — no parse errors, no duplicate/malformed JSDoc blocks).

## Acceptance
| Criterion | Evidence |
|---|---|
| `Profile` model + CRUD routes exist, same shape as other CV sections | `src/models/profile.model.ts`, `src/routers/api/v1/profile.route.ts`; `npm run build` clean; `npm test` 22/22 suites |
| Default "Tổng hợp" profile synthesized on first read, no data loss | `ensureDefaultProfile` in `profile.service.ts`; `profile.service.test.ts` — "synthesizes a 'Tổng hợp' profile from every existing section item when none exists yet" passing |
| `GET /api/me/:value?profile=<id>` filters sections; omitted → unchanged | `candidate_me/index.ts` diff; `candidate_me/index.test.ts` — 4 new passing tests, including the "never queries Profile when no profile param is given" regression check |
| Ownership enforced (IDOR-safe) | `profile.route.ts` reuses `req.body.candidateId` (forced by `verifyToken.middleware.ts`, same guarantee as `fix-idor-broken-access-control`) for CRUD; public filter path checks `candidateId: _id` (the resolved candidate's own id) on the `Profile.findOne` lookup in `candidate_me/index.ts` |
| No `<<FILL>>` blockers | `doctrine/MEMORY.md` test/build commands both real, both run verbatim above |

## Noticed, not done
- Nothing new found outside this task's scope.

## Seal gate
None — no outward-facing action taken (no commit/push; `/todo` invoked
without `--ship`, matching the same pattern as `add-application-tracker`
and `add-csrf-protection-auth-cookies`, both still uncommitted at their
own SEAL time).
