# 2026-11-10 - profile-section-ids-ownership
- Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `profile-section-ids-ownership` (PENDING)
- Task: GitHub #405 "CV profiles: reject entry ids that don't exist or belong to another candidate" — https://github.com/datvt243/resume-nodejs-api/issues/405 · branch `405-cv-profiles-reject`

## Hub bytes before: 96177
(measured after the src edit, before writing any agent-hub file — see `## Process slip`)

## Feature doc: doctrine/features/cv-profiles.md
Open question answered by operator 2026-11-07: "Change: reject unknown/foreign/deleted ids with 400 — #405". No unanswered open question.
## Feature doc changed: Behavior 2 "arrays of 24-hex ids, default []" → + "every listed id must be a non-deleted entry of the caller in that section, else 400 VALIDATION_ERROR per `<field>.<index>`, nothing written"; + 1 edge case, + 1 acceptance criterion, + Changelog row. Authorized by the operator's explicit answer above.

## Acceptance (node)
1. `npx jest src/__tests__/candidate_profile/profile.service.test.ts` passes incl. new #405 cases.
2. `npm test` no new failures vs `staging`; `npm run build` clean; `npm run lint` ≤ 274, none new in touched lines.
3. `features/cv-profiles.md` Behavior updated per operator answer.
4. Comments per `doctrine/standards/code-comments.md`.

## Anchors
- `src/candidate_profile/profile/profile.service.ts` (service wraps `createCrudService`, same pattern as `project.service.ts` `checkExperienceLink`)
- `src/candidate_profile/profile/profile.controller.ts` (unchanged — `createCrudController` passes `value` (incl. forced `candidateId`) to `service.handlerCreate/handlerUpdate`; thrown `AppError` → `handleError` → `sendError`)
- `src/locales/{en,vi}.ts` (new `profile.entryNotFound`)
- `src/__tests__/candidate_profile/profile.service.test.ts`

## Process slip
`NodeBeforeCode` violated: the src edit was written before the PENDING row was appended to the diagram. Row appended immediately after, before tests were finalized and before any evidence; no state other than PENDING set. Recorded here, not hidden.
