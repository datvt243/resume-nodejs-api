# analyst spec_feature — #413 manual display order (education / project)

- Date: 2026-11-14
- Branch: 413-education-project-store (no code touched, nothing committed)
- Status: spec_ready (round 2, after operator answers; round 1 was needs_input)

## Task (verbatim)
GitHub issue #413 "Education / Project: store a manual display order used by the CV"

## Problem
The frontend lets the candidate drag-and-drop Education and Project entries, but the order is kept only in the browser's `localStorage`, so the public profile, PDF/DOCX export and other devices ignore it.

## Expected
- `education` and `project` get an `order` field (integer) and a bulk reorder endpoint, e.g. `PUT /api/v1/<section>/reorder` `{ ids: [...] }` (caller's own non-deleted ids only).
- Public profile + exports sort these two sections by `order` (entries without one: after, by start date desc).
- **Experience is excluded**: it always sorts by date (operator decision).

Frontend: datvt243/resume-vuejs-website (drag-and-drop → this endpoint).

Decided by the operator while confirming `agent-hub/doctrine/features/cv-timeline-sections.md` (2026-11-07).

## Doc path
- `doctrine/features/cv-section-crud.md` — new subsection "Manual display order" (rules 13–16), acceptance criteria, edge cases, out of scope, open questions Q1–Q4, changelog row.
- Cross-reference lines only: `doctrine/features/public-profile.md` (rule 8), `doctrine/features/cv-export.md` (rule 10); INDEX row for cv-section-crud updated (#413, anchor).
- `cv-timeline-sections.md` named in the issue: not on disk, no git history (`git log --all -S cv-timeline-sections` empty), no reference in INDEX or evidence. The CV-section feature for education/project is `cv-section-crud.md`, so the spec lands there (no 2nd doc).

## Sources read
- `agent-hub/haven/workers/analyst/{manifest.yaml,SOUL.md,recipes/spec_feature.md}`
- `agent-hub/doctrine/domains/PROJECT.md`, `agent-hub/doctrine/MEMORY.md`, `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/features/{cv-section-crud,public-profile,cv-export,cv-profiles}.md`
- `src/models/education.model.ts`, `src/models/project.model.ts`
- `src/routers/api/v1/education.route.ts`, `src/routers/api/v1/project.route.ts`
- `src/candidate_profile/education/education.validate.ts`, `src/utils/valid.ts` (Joi default: unknown key → error), `src/config/joi.config.ts` (`startDate` required)
- `src/candidate_me/index.ts` (shared aggregation, `model.find` with no sort, `_id: 0` projection)
- `src/services/createPDF.ats.ts` (only sort site: experience by startDate desc), `src/services/createPDF.ts`, `src/services/createDocx.ts`
- `grep -rn '.sort(' src` — confirms no ordering of education/project anywhere today

## Questions + answers
1. Q1 — `ids` full list vs subset. → Operator 2026-11-14: full list; anything missing → 400
2. Q2 — owner `GET /api/v1/education|project` default order. → Operator: yes, rule-15 order (explicit `?sort` still wins, rule 2)
3. Q3 — `order` in create/update body. → Operator: accept and ignore (not stored, no 400)
4. Q4 — experience sorting. → Operator: leave exactly as it is

Analyst choices, kept by the operator 2026-11-14: duplicate/empty ids → 400; tie on `order` → startDate desc; success → 200 `data: null`; foreign/deleted id → 400 at `ids.<i>` (follows `cv-profiles` #405 precedent).

## Isolation proof
Spawned as a fresh analyst subagent with only the task text (issue body + branch + the note that `cv-timeline-sections.md` is missing). No implementer reasoning, diff, or diagram node was seen; no implementation exists yet for #413. All anchors above were grep/read-confirmed in this spawn.

## Round 2 (2026-11-14)
Operator answers relayed by the coordinator; doc rules 14, 15, 15a, 16, acceptance criteria and edge cases updated, Q1–Q4 closed, changelog + INDEX row updated. No open questions remain. Status of the doc section stays draft until its node is SEALED.
