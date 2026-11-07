# analyst — cv-section-crud — 2026-11-07

## Task (verbatim)
document cv-section-crud

## Doc
`agent-hub/doctrine/features/cv-section-crud.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/index.ts` (all section routers behind `verifyToken`)
- `src/routers/api/v1/{education,experience,award,certificate,project,reference}.route.ts`
- `src/candidate_profile/BaseController.ts` (`baseGetAll`, `baseDelete`, `baseRestore`, `baseUploadImages`, `createCrudController`)
- `src/candidate_profile/BaseService.ts`
- `src/services/index.ts` (`baseFindDocument`, `baseDeleteDocument`, `baseRestoreDocument`, `baseUpdateDocument`, `baseCreateDocument`, `baseCheckDocumentById`)
- `src/middlewares/uploadImages.middleware.ts`
- `src/candidate_profile/*/*.controller.ts` (`booleanDefaultField`), `*.validate.ts` (localized fields)
- `src/candidate_profile/project/project.service.ts` (`checkExperienceLink`)
- `src/utils/helper.ts` (`formatReturn`: failure default 400)

## Re-check vs code
Behavior 1–11 match code. List: `deletedAt: null`, limit cap 100, sort regex, no limit → `listMeta(total)` (`services/index.ts`, `BaseController.ts` `baseGetAll`); create/update validation failure → `formatReturn` default 400 (`helper.ts:164-167`); update excludes deleted → 404, foreign → 403; delete/restore lookup doesn't exclude deleted, foreign → 403, restore `modifiedCount 0` → 404 `restoreFailed`; `booleanDefaultField` per controller (education/experience `isCurrent`, award/certificate `isNoExpiration`, project `isWorking`, reference none); `/bulk` only on education/experience routes, cap 100, all fail → `ValidationError` with `items.<i>.<field>`, partial → 201 with `common.createFailed`; `/:id/images` only on award/certificate/project, `findById` (no `deletedAt` filter) + ownership before multer, 5 files × 5MB, ext list + `image/*`; project `type !== 'company'` → `experienceId: null`, else owned non-deleted experience or 400 (`project.service.ts:26-34`). No discrepancy.

## Questions + answers
Operator (2026-11-07): "behavior đúng" (Behavior section confirmed correct).
- Deleting an already-deleted entry succeeds again and moves `deletedAt` forward (lookup doesn't exclude deleted). Should it be 404? → **Answer (operator 2026-11-07):** Bug: 404 — #403
- Image upload accepts a soft-deleted entry (`findById` doesn't filter `deletedAt`). Intended? → **Answer (operator 2026-11-07):** Bug: 404 — #403
- Bulk partial success returns 201 with the message `common.createFailed`. Should the message reflect partial success? → **Answer (operator 2026-11-07):** Bug: partial-success message — #404
- Bulk create runs items sequentially, one DB round-trip each, up to 100. OK? → **Answer (operator 2026-11-07):** Intended
- Image upload has no automated test. Add one? → **Answer (operator 2026-11-07):** Change: add tests — #402
- Uploaded images stay on disk when an entry is soft-deleted, and there is no per-entry image cap (5 per request, unlimited requests). Intended? → **Answer (operator 2026-11-07):** Intended (restore needs them)
- `DELETE /delete/:id` and `POST /restore/:id` fail open on an id containing `$`: `idQuerySafe` drops it, `baseCheckDocumentById` runs `findOne({})` and acts on the collection's first document: 403 if it's someone else's, deleted/restored if it's the caller's (`services/index.ts`). Should a dropped id be 404? → **Answer (operator 2026-11-07):** Bug — #381

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/cv-section-crud-spec.md` set in doc + INDEX row; Issues #381, #402, #403, #404. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
