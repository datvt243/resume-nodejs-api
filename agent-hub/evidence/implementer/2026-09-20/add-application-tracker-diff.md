# 2026-09-20 — add-application-tracker

- Worker: implementer
- Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `add-application-tracker`
- Task (verbatim): "Application-tracker collection (CRUD for job
  applications, matches Education/Experience pattern) — issue #132:
  https://github.com/datvt243/resume-nodejs-api/issues/132

  Add a full CRUD collection for job-application tracking, mirroring the
  existing Education/Experience CV-section pattern exactly: src/models/
  application.model.ts (company, position, appliedDate, status enum
  applied/interview/offer/rejected, note, jobLink, candidateId, deletedAt
  soft-delete per #121, timestamps); src/candidate_profile/application/
  application.validate.ts mirroring education.validate.ts; src/
  candidate_profile/application/application.controller.ts following
  education.controller.ts; src/routers/api/v1/application.route.ts (GET
  /, POST /create, PUT /update, DELETE /delete/:id, POST /restore/:id via
  baseGetAll/baseDelete/baseRestore); add APPLICATION = 'applications' to
  Collections enum in src/types/base.type.ts and register the router in
  src/routers/api/v1/index.ts; ownership check via req.user._id against
  candidateId, same as every other candidate_profile/* collection."

## Hub bytes before: 72332

## Diff
| File | Why |
|---|---|
| `src/models/application.model.ts` (new) | Mongoose schema for the new `applications` collection — `company`, `position`, `appliedDate: Number`, `status` (String enum `applied/interview/offer/rejected`, default `applied`, exported as `APPLICATION_STATUSES` for reuse by the Joi schema), `note`, `jobLink`, `candidateId` (ObjectId, required, indexed), `deletedAt` (soft-delete per #121), `{ timestamps: true }`. Field-level `required: [false, ...]` on the descriptive fields exactly matches the established convention in `education.model.ts`/`award.model.ts` (Mongoose-level required is decorative; Joi enforces real requiredness at the API boundary). |
| `src/models/index.ts` | Export `Application` alongside the other 7 CV-section models. |
| `src/candidate_profile/application/application.validate.ts` (new) | Joi schema. Reuses the shared `company`/`position` validators from `joi.config.ts` (same reuse pattern as `reference.validate.ts`) instead of redefining them. `appliedDate` mirrors `startDate`'s shape. `status` is `Joi.string().valid(...APPLICATION_STATUSES)` sourced from the model so the two never drift. `note`/`jobLink` optional, `.allow('')`. `_id`/`candidateId` reused from `joi.config.ts`, identical to every other section. |
| `src/candidate_profile/application/application.service.ts` (new) | `createCrudService({ model: ApplicationModel, name: 'đơn ứng tuyển' })` — same minimal shape as `award.service.ts`/`certificate.service.ts`/`project.service.ts`/`reference.service.ts` (the majority pattern; `education.service.ts`'s two extra unused helpers were not copied since nothing else references them). |
| `src/candidate_profile/application/application.controller.ts` (new) | `createCrudController({ schema: schemaApplication, service: applicationService })` — no `booleanDefaultField`, there's no boolean field on this model. |
| `src/routers/api/v1/application.route.ts` (new) | `GET /`, `POST /create`, `PUT /update`, `DELETE /delete/:id`, `POST /restore/:id`, structured identically to `education.route.ts` (no image-upload route — not part of the issue's field list). Swagger JSDoc tags `[Application]`, `$ref`s `#/components/schemas/Application`. |
| `src/types/base.type.ts` | Added `APPLICATION = 'applications'` to the `Collections` enum. |
| `src/candidate_profile/BaseController.ts` | Added `applications: MODELS.Application` to `modelObject`, so `baseGetAll`/`baseDelete`/`baseRestore` recognize the new collection. |
| `src/routers/api/v1/index.ts` | Imported `routeApplication` and mounted it at `router.use('/application', verifyToken, routeApplication)`, same `verifyToken`-gated pattern as every other section. |
| `src/config/swagger.config.ts` | Added an `Application` schema definition (`_id`, `candidateId`, `company`, `position`, `appliedDate`, `status` enum, `note`, `jobLink`) next to the other section schemas, so the route file's `$ref`s resolve. |
| `src/candidate/candidate.service.ts` | Added `MODELS.Application` to `CV_SECTION_MODELS` (the array `handlerDelete` cascades through on self-delete) — a 1-line addition to an existing array so a candidate's self-delete (`add-candidate-self-delete`) doesn't orphan application rows, matching every other CV section. Not in the issue's own file list, but required for "matches Education/Experience pattern" to hold end-to-end; not added to `IMAGE_SECTION_MODELS` (no images field) or to `candidate_me/index.ts`'s public-profile aggregation (job-application tracking is private, unlike the public CV sections). |

## Command
```
npm run build
```
```
npm test
```
(both copied verbatim from `doctrine/MEMORY.md`, run from
`/Users/_david/Workspace/Project/resume/resume-nodejs-api`)

## Output

`npm run build` (verbatim):
```
> resume-nodejs-api@1.6.0 build
> tsc && npm run copy


> resume-nodejs-api@1.6.0 copy
> cp -R ./src/views ./src/public ./dist/
```
(clean exit, no tsc errors — full strict-mode typecheck of the new files
plus every touched existing file)

`npm test` (verbatim tail):
```
Test Suites: 19 passed, 19 total
Tests:       99 passed, 99 total
Snapshots:   0 total
Time:        6.304 s
Ran all test suites.
```

Additionally, ran a standalone script through `ts-node -r tsconfig-paths/
register` to independently confirm swagger-jsdoc actually parses the new
route file's JSDoc (not just that it typechecks):
```
application paths: [
  '/api/v1/application',
  '/api/v1/application/create',
  '/api/v1/application/update',
  '/api/v1/application/delete/{id}',
  '/api/v1/application/restore/{id}'
]
has Application schema: true
```

## Acceptance
| Criterion | Evidence |
|---|---|
| `applications` collection CRUD mirrors Education pattern (model/validate/service/controller/route) | Diff table above — every file's shape cross-checked line-by-line against `education.*`/`award.*` during writing |
| `Collections.APPLICATION = 'applications'` added | `src/types/base.type.ts` diff |
| Router registered at `/api/v1/application`, behind `verifyToken` | `src/routers/api/v1/index.ts` diff |
| Ownership enforced via `req.user._id`/`req.body.candidateId`, not client input | Inherited for free from `verifyToken.middleware.ts` (forces `req.body.candidateId = _id`) + `baseUpdateDocument`/`baseDeleteDocument`/`baseRestoreDocument`'s existing owner checks — no new ownership code needed, same as every other section |
| No regressions | `npm test`: "Tests: 99 passed, 99 total", 19/19 suites, 0 failures. No test file was added or removed by this diff — this branch was cut from `staging` after PRs #137/#138 landed (soft-delete-bypass + NoSQL-filter-collapse fixes, each adding their own tests), which is why the baseline is 19/99 here rather than the 18/96 recorded on the last SEALED node's evidence note; the number itself was read back verbatim from this session's own `npm test` run, not assumed |
| Typecheck clean | `npm run build` verbatim output above, no `tsc` errors |
| Swagger spec actually resolves the new route/schema (not just typechecks) | `ts-node` one-off script output above — 5 `application` paths + `Application` schema present in the generated `swaggerSpec` |

## Noticed, not done
- `haven/diagrams/dev-loop.prime-mermaid.md` is now over the 15KB
  `/hub-tokens` archive threshold (25558B before this edit) — out of
  scope for this task, flagging for a future archiving pass per the
  file's own header convention.
- No dedicated unit test file was added for the new `application.*`
  files. Checked precedent first: none of the other 6 CV sections
  (education/experience/award/certificate/project/reference) has a
  section-specific test file either — only `BaseController.test.ts`
  (generic, collection-name-agnostic) and shared `services/index.ts`
  tests exist. Adding one here would be new scope beyond "matches the
  existing pattern," not a smallest-diff fix.
- Vietnamese business labels (`'đơn ứng tuyển'` in
  `application.service.ts`, error messages in `application.validate.ts`/
  `application.model.ts`) chosen by direct analogy with the existing
  Vietnamese strings in every other section — not independently reviewed
  by a native speaker.

## Seal gate
No outward-facing action taken (no commit, no push) — `/todo #132` was
invoked without `--ship`, so per that skill's contract this implementer
pass stops at `sealed_pending_verifier` with the diff shown to the
operator in-session. No approval requested or needed at this stage.
