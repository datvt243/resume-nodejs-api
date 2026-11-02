# 2026-11-02 - add-familiar-skills (plan)
- Worker: implementer · Version: 0.1.0
- Node: `add-familiar-skills` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task: "tương tự mainSkills, bổ sung FamiliarSkills không limit" (GitHub #349)

## Hub bytes before: 83521

## Node
No PENDING node matched the task; new node `add-familiar-skills` added (slug absent from active diagram and archive; no other row cites #349). Branch `349-t-ng-t-mainskills` off `staging`. Template: commit ef79e0a (`add-main-skills`, #343).

## Acceptance
1. `familiarSkills: { type: [personalSkills], default: [] }` in `src/models/generalInformation.model.ts`.
2. Joi `familiarSkills` array `{ name }`, no `.max()`, in `src/candidate_profile/general_information/generalInformation.validate.ts`; new test: 20 accepted.
3. `GeneralInformationData.familiarSkills?`, swagger property (no maxItems), `vi`/`en` locale label.
4. `npm test`, `npm run build` pass (pre-existing env failures excepted); `npm run lint` ≤ 274, none in changed files.

## Code anchors
- src/models/generalInformation.model.ts:27
- src/candidate_profile/general_information/generalInformation.validate.ts:34
- src/types/candidate.type.ts:107
- src/config/swagger.config.ts:336
- src/locales/vi.ts:199, src/locales/en.ts:199

## Out of scope
Rendering familiarSkills in PDF/DOCX/ATS exports — not requested (mainSkills isn't rendered either).
