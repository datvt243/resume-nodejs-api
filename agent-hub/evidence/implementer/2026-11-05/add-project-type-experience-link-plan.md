# 2026-11-05 - add-project-type-experience-link
- Worker: implementer · Version: 0.1.0
- Node: `add-project-type-experience-link` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: GitHub #361 "feat(project): phân loại project company/personal và liên kết với Experience" — via `/todo "fix hết 4 issues"`, branch `361-feat-project-phân` (off staging @ fdbabf7, after #364 merged)

## Hub bytes before: 84361
(measured after adding this node's own PENDING row)

## Decisions (issue said "chốt khi implement")
- `companyId` replaced by `experienceId` (ref `experience`, default null) — `companyId` had no reader/writer anywhere: `grep -rl companyId` across sibling repos (`resume-vuejs-website`, `datvt243.github.io`) found no client sending it.
- Foreign / deleted / missing experience → one 400 `BadRequestError` (no 403/404 distinction, so existence of another candidate's id isn't leaked) — mirrors the `application.profileId` precedent in `application.service.ts`.
- Personal project: service always writes `experienceId: null` (an update switching company→personal unlinks).

## Diff
| File | Why |
|---|---|
| `src/models/project.model.ts` | export `PROJECT_TYPES`; `type` enum default `personal` (default also fills legacy docs on hydrate); `experienceId` ObjectId ref `experience` default null; drop unused `companyId` |
| `src/candidate_profile/project/project.validate.ts` | `type` valid(PROJECT_TYPES) default personal; `experienceId` when type=company → 24-hex required, otherwise only null/'' |
| `src/candidate_profile/project/project.service.ts` | `checkExperienceLink` before crud create/update: `idQuerySafe.safeQuery` + `ExperienceModel.exists({ _id, candidateId, deletedAt: null })`, else `BadRequestError(t('project.experienceNotFound'))`. Bulk create calls `service.handlerCreate` (`BaseController.ts` fnBulkCreate) so it is covered too |
| `src/locales/{vi,en}.ts` | `project.experienceNotFound`, `fieldLabels.experienceId` |
| `src/config/swagger.config.ts` | Project schema: `type`, `experienceId` |
| `.claude/rules/models.md` | Project fields row |
| `src/__tests__/candidate_profile/project.service.test.ts` | new, 18 tests (Joi rules, ownership on create+update, QuerySafe short-circuit, personal → null, legacy hydrate) |

## Command
- `npx jest src/__tests__/candidate_profile/project`
- `npm test` · `npm run build` · `npm run lint` · `npx eslint <touched files>`

## Output
```
# npx jest src/__tests__/candidate_profile/project
    ✓ defaults type to personal (2 ms)
    ✓ accepts {"experienceId": "64b7f0c2a1b2c3d4e5f60799", "type": "company"}
    ✓ accepts {"type": "personal"}
    ✓ accepts {"experienceId": null, "type": "personal"}
    ✓ accepts {"experienceId": "", "type": "personal"}
    ✓ rejects company without experienceId
    ✓ rejects company with a malformed id
    ✓ rejects company with an operator object (1 ms)
    ✓ rejects personal with an experienceId
    ✓ rejects an unknown type
    ✓ stores an id that is a non-deleted experience of the same candidate (1 ms)
    ✓ rejects another candidate's, a deleted or a missing experience with 400 on create, writing nothing
    ✓ rejects another candidate's, a deleted or a missing experience with 400 on update, writing nothing
    ✓ never queries Experience when the candidate id is rejected by QuerySafe
    ✓ stores null for a personal project (experienceId "") without a lookup
    ✓ stores null for a personal project (experienceId null) without a lookup
    ✓ stores null for a personal project (experienceId undefined) without a lookup
    ✓ reads a legacy project without type back as personal (3 ms)
    ✓ accepts a missing link (1 ms)
    ✓ accepts link ""
    ✓ accepts link "   "
    ✓ accepts link "https://github.com/datvt243"
    ✓ rejects a link longer than 100 characters (1 ms)
Tests:       23 passed, 23 total
# npm test (staging baseline after #364 merge = 516 total, same 5 failures — see fix-project-link-optional-plan.md)
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 56 passed, 58 total
Tests:       5 failed, 529 passed, 534 total
# npm run build
build_exit=0
# npm run lint
✖ 274 problems (274 errors, 0 warnings)
# npx eslint touched files
src/candidate_profile/project/project.validate.ts
  11:3  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
```
Pre-existing: the 5 failures are the same `tokenExpiry` (local `.env` TOKEN_EXP_IN) + `atsPdfIntegration` (no Chrome) as baseline. The single lint error in a touched file is the unchanged `_id` line (was 10:3, now 11:3 after one import line) — `joi.config.ts:33` `objectIdValidator` is `any`-typed, same in all 11 section validators.

## Acceptance
| Criterion | Evidence |
|---|---|
| Model + Joi have `type` and `experienceId` | diff rows above; "defaults type to personal", "accepts …company…", "rejects company without experienceId", "rejects personal with an experienceId", "rejects an unknown type" |
| Other candidate's Experience → 4xx, not stored | "rejects another candidate's, a deleted or a missing experience with 400 on create/update, writing nothing" (mockCrudCreate/Update not called; query includes `candidateId`) |
| Missing / deleted Experience → 4xx | same tests (query includes `deletedAt: null`; `exists` → null) |
| NoSQL injection via QuerySafe | "rejects company with an operator object", "never queries Experience when the candidate id is rejected by QuerySafe" |
| GET returns `type` + `experienceId`; legacy → `personal` | "reads a legacy project without type back as personal" (hydrate → `{ type: 'personal', experienceId: null }`); GET uses exclusion-only projection (`candidate_me/index.ts:88`, `baseFindDocument`), so new paths are returned |
| models.md + tests updated | diff rows above; 534 total vs 516 baseline (+18) |
| npm test no new failure | 5 failed = baseline 5 |
| Typecheck (inside Build) | build_exit=0 |
| Lint ≤ 274, none new in touched files | 274; only pre-existing `_id` line |
| comments per code-comments.md | JSDoc WHY on `checkExperienceLink`, 1-line WHY on model default and Joi `experienceId`; no issue refs/history |

## Supersedes: none
## Noticed, not done
- Soft-deleting an Experience leaves a company project pointing at it (no cascade) — out of #361 scope.
- No `fieldLabels.type` (Joi falls back to key `type`) — generic key, would label every `type` field.
## Seal gate: covered by operator "Approve all 4" (AskUserQuestion, this session) — ship after SEAL only
