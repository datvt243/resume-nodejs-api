# 2026-11-02 - localize-education-school-major
Worker: implementer · Version: 0.1.0 · Node: `localize-education-school-major` (`haven/diagrams/dev-loop.prime-mermaid.md`) · Task: "phần education, bổ dung EN/VI cho 2 fields Tên trường và Tên chuyên ngành, tạo issue update cho resume-vuejs-website luôn" (#353)

## Hub bytes before: 83513

## Anchors
- `src/models/education.model.ts:14-15` (school/major plain String)
- `src/candidate_profile/education/education.validate.ts:11-12`
- `src/candidate_me/index.ts:27-32` (resolveLocalizedText, `??` does not skip '' despite its doc comment), `:199-204`
- `src/candidate_me/search.ts:61`
- `src/scripts/migrate-localize-text-fields.ts` TARGETS
- `src/models/part/index.ts:41-45`, `src/config/joi.config.ts` comments ("school stays plain String")
- Tests: `src/__tests__/candidate_profile/education.validate.test.ts`, `src/__tests__/candidate_me/search.test.ts`

## Context
Supersedes operator decision B in `evidence/implementer/2026-11-01/check-education-i18n-plan.md` (#340) — operator now explicitly asks for localized school/major.

## Blockers: none
