# 2026-11-14 - education-project-manual-order (plan)

- Worker: implementer · Version: 0.1.0
- Node: `education-project-manual-order` in `haven/diagrams/dev-loop.prime-mermaid.md` (new row, PENDING, added on branch `413-education-project-store`; slug not in `dev-loop-archive.md` (grep count 0), no other not-yet-SEALED row cites #413)
- Task (verbatim): "#413 Education / Project: store a manual display order used by the CV"
- Issue: https://github.com/datvt243/resume-nodejs-api/issues/413 (label `enhancement`)
- Pass 0 analyst: `evidence/analyst/2026-11-14/cv-section-order-spec.md` → `spec_ready` (round 2, operator answered Q1–Q4 2026-11-14)

## Hub bytes before: 96180

## Feature doc: doctrine/features/cv-section-crud.md
Section "Manual display order" rules 13–16 + 15a; open questions Q1–Q4 answered. Node criteria = the doc's `#413` acceptance criteria (copied below).

## Acceptance criteria (from the feature doc)
1. `npm test` passes, incl. new tests under `src/__tests__/` covering rules 14 + 15 (reorder writes `order`, foreign/deleted id → 400 no write, sort rule incl. entries without `order`).
2. Reorder `{ ids: [B, A] }` → 200; `GET /api/me/<slug>` returns `educations` B, A (same for `projects`).
3. `PUT /project/reorder` with another candidate's id → 400, `details[0].field = "ids.0"`, nothing written.
4. `GET /api/v1/download-pdf?format=json` — same order as the public profile (same `handlerGetAboutMe` aggregation).
5. No `PUT /api/v1/experience/reorder` (404).
6. A, B, C + reorder `{ ids: [B, A] }` → 400, nothing written.
7. After reorder `{ ids: [B, A] }`, `GET /api/v1/education` (no `?sort`) → B, A.
8. `PUT /education/update` with `order: 5` → 200, stored `order` unchanged.
9. `npx jest src/__tests__/services/createPDF.ats.test.ts src/__tests__/candidate_me/index.test.ts` passes unchanged.
10. `npm run build` passes; `npm run lint` ≤ 274, none in changed files; comments per `doctrine/standards/code-comments.md`.

## Code anchors
- Models: `src/models/education.model.ts`, `src/models/project.model.ts`
- Validate (strip `order`): `src/candidate_profile/education/education.validate.ts`, `src/candidate_profile/project/project.validate.ts`
- Reorder + owner list sort: `src/candidate_profile/BaseController.ts` (`baseGetAll`, new `baseReorder`)
- Routes: `src/routers/api/v1/education.route.ts`, `src/routers/api/v1/project.route.ts`
- CV aggregation: `src/candidate_me/index.ts` (`handlerGetAboutMe`)
- Update path keeps `order`: `src/services/index.ts` `baseUpdateDocument` → `updateOne` = `$set` of given keys only

## Blockers: none
