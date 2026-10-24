---
paths:
  - "src/models/**"
  - "src/services/**"
  - "src/candidate_profile/**"
---

# Models & service layer

Moved verbatim from root `CLAUDE.md`.

## Models

All models use Mongoose with `timestamps: true` and `candidateId` foreign key (except Candidate). Every CV-section model plus `Application` and `Profile` carries a nullable `deletedAt: Number` for soft-delete/restore (`Visit` does not).

| Model | Key Fields |
|---|---|
| Candidate | email, password, firstName, lastName, gender, marital, birthday, address, phone, introduction, socialMedia, slug (vanity public-profile URL), cvFile ({ originalName, uploadedAt } metadata for the uploaded PDF résumé), isPublic (default true — gates whether `GET /api/me/:slug-or-email` returns anything), emailVerified (default false, informational only, doesn't gate login) |
| GeneralInformation | candidateId, position/career, professionalSkills[], personalSkills[], foreignLanguages[], workLocation, workForm |
| Experience | candidateId, company, position, startDate, endDate, isCurrent, description, skills[] |
| Education | candidateId, school, major, startDate, endDate, isCurrent, description |
| Project | candidateId, name, position, description, technology[], startDate, endDate, isWorking, images[], link |
| Certificate | candidateId, name, organization, startDate, endDate, isNoExpiration, link, images[], description |
| Award | candidateId, name, organization, issueDate, link, images[], description |
| Reference | candidateId, fullName, phone, company, position |
| Application | candidateId, company, position, appliedDate, status (`applied`\|`interview`\|`offer`\|`rejected`), note, jobLink, profileId (CV profile sent; must be the candidate's own non-deleted profile on create/update, else 400; `null`/`''` unlinks; kept if the profile is deleted later) |
| Profile | candidateId, name, educationIds[], experienceIds[], projectIds[], certificateIds[], awardIds[], referenceIds[] |
| Visit | candidateId, ip, location, referrer (hostname only, nullable), profileId (owned profile, nullable) (no `_id` override — see comment in `visit.model.ts` on why) |

Free-text fields on several models (e.g. Award/Certificate `description`, GeneralInformation `career`/`careerGoal`, Candidate `introduction`) use `localizedTextSchema` (`{ vi, en }`) resolved per-request by `?lang=`.

**Reusable sub-schemas** (`models/part/index.ts`): `foreignLanguageSchema`, `professionalSkillsSchema`, `personalSkills`, `socialMediaSchema`, `localizedTextSchema`

## Service layer pattern

`services/index.ts` exposes base DB operations used by all feature services:

- `baseFindDocument(props)` — query with NoSQL injection guard; optional `page`/`limit`/`sort`
- `baseCreateDocument(props)` — create with Mongoose validation + optional `hookAfterSave`/`hookHasErrors`
- `baseUpdateDocument(props)` — update with validation
- `basePatchDocument(props)` — partial update
- `baseDeleteDocument(props)` — soft-delete (`deletedAt`) with ownership check
- `baseRestoreDocument(props)` — clears `deletedAt`, same ownership check

`candidate_profile/BaseService.ts` (`createCrudService()`) wraps these into a
`{ handlerGet, handlerCreate, handlerUpdate, handlerDelete, ... }` factory used
by every CV-section service. `BaseController.ts` wraps `baseGetAll()`,
`baseDelete()`, `baseRestore()`, and `baseUploadImages()` (ownership-checked
image attachment) shared across all CV section controllers.
