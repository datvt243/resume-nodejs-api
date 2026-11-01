# 2026-11-01 - add-main-skills (plan)
- Worker: implementer · Version: 0.1.0
- Node: `add-main-skills` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: "phần thông tin skill, tôi muốn thêm Main Skills, có tối đa 5 skill (skill này giống với persional skill)" (GitHub #343)

## Hub bytes before: 83545

## Node
No PENDING node matched the task; new node `add-main-skills` added (slug not present in active diagram or archive). Branch `343-ph-n-th-ng` off `staging`.

## Acceptance
1. `mainSkills: { type: [personalSkills], default: [] }` in `src/models/generalInformation.model.ts`.
2. Joi `mainSkills` array `{ name }` with `.max(5)` in `src/candidate_profile/general_information/generalInformation.validate.ts`; new test: 5 accepted, 6 rejected.
3. `GeneralInformationData.mainSkills?`, swagger property, `vi`/`en` locale label.
4. `npm test`, `npm run build` pass; `npm run lint` ≤ 274, none in changed files.

## Code anchors
- src/models/generalInformation.model.ts:26
- src/candidate_profile/general_information/generalInformation.validate.ts:31
- src/types/candidate.type.ts:106
- src/config/swagger.config.ts:335
- src/locales/vi.ts:197, src/locales/en.ts:197

## Out of scope
Rendering mainSkills in PDF/DOCX/ATS exports — not requested.
