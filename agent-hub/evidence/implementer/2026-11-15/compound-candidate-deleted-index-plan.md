# 2026-11-15 — compound-candidate-deleted-index (plan)
- Worker: implementer · Version 0.1.0
- Node: `compound-candidate-deleted-index` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: `#465 Add compound index { candidateId, deletedAt } on CV-section models` (issue https://github.com/datvt243/resume-nodejs-api/issues/465)

## Hub bytes before: 97414
## Feature doc: doctrine/features/cv-section-crud.md (no Behavior change — index only, query results identical)

## Acceptance
1. Each of the 8 schemas (`education`, `experience`, `project`, `award`, `certificate`, `reference.modal`, `profile`, `application`) declares `{ candidateId: 1, deletedAt: 1 }` and no longer `index: true` on `candidateId` — asserted via `Model.schema.indexes()` in a new test.
2. `npm test` green.
3. `npm run build` 0 errors (Typecheck inside Build).
4. `npm run lint` ≤ 274 baseline, none in touched files.

## Anchors
`src/models/{education,experience,project,award,certificate,profile,application}.model.ts`, `src/models/reference.modal.ts` — line `candidateId: { ..., index: true }`.
Excluded: `generalInformation` (unique `candidateId`, 1 doc/candidate), `visit` (no `deletedAt`), `candidate` (no `candidateId`).

## Blocked by: none
