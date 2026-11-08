# 2026-11-08 - short-values-validation (plan)
- Worker: implementer · Version: 0.1.0
- Node: `short-values-validation` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#414` grep active + archive: 0 hits
- Task: `/todo #414` — "Validation: allow short education majors ("IT") and awards without a link"
- Branch: `414-validation-allow-short` (via `gh issue develop`, from `staging` @ fee5291)

## Hub bytes before
96341

## Feature doc: `doctrine/features/cv-section-crud.md`
The issue names `doctrine/features/cv-simple-sections.md` — no such file (`ls doctrine/features/ | grep -i simple` → empty); education + award CRUD is documented in `cv-section-crud.md`. Issue text is the operator's decision ("Decided by the operator while confirming … (2026-11-07)"): `major.vi` min 1; `award.link` optional (empty allowed), ≤ 100 chars, validated as a URL when present. Added as Behavior #12 + acceptance line. (Round 2: http(s)-only scheme marked as an implementation choice; `school.vi` not claimed.)

## Acceptance
1. Behavior #12 (new): `major: { vi: 'IT' }` accepted; `major.vi: ''` still 400 on `major.vi`; award `link` missing / `''` / http(s) URL accepted; non-URL, `javascript:`, > 100 chars → 400 on `link`.
2. `npx jest src/__tests__/candidate_profile/education.validate.test.ts src/__tests__/candidate_profile/award.validate.test.ts` passes; the new cases fail on the old validators.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/candidate_profile/education/education.validate.ts:12` (`major: localizedName(3)`)
- `src/candidate_profile/awards/award.validate.ts:14` (`link: _stringDefault({ min: 0, … })` → `.required()`, `src/config/joi.config.ts:110`)
- `src/models/award.model.ts:17` (`link` default `''`, not required — read only)
- `src/candidate_profile/project/project.validate.ts:26` (existing optional-link idiom — read only)
- swagger `src/config/swagger.config.ts` Award/Education — no length/required constraints declared, no change
