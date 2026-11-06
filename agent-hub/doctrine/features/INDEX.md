# doctrine/features/INDEX.md — feature docs

> One row per feature. Look a feature up here by area/files, then open
> only that one doc. `status`: `draft` = not yet confirmed (intent, not
> truth) · `verified` = a SEALED node implemented it, or the operator
> confirmed a backfilled doc (every open question answered).
> Every `<slug>.md` here uses the format below exactly — whoever writes
> it (analyst, or another agent doing a bulk backfill: always `Status:
> draft`, `Source: backfill from code`).

| Feature | Doc | Status | Area / anchors | Issues |
|---|---|---|---|---|
| Register, login and email verification | auth-register-login.md | draft | auth / `src/auth/`, `src/routers/api/v1/auth.route.ts`, `src/routers/api/v2/auth.route.ts` | - |
| Session tokens: refresh, logout, logout-all | auth-session-tokens.md | draft | auth / `src/middlewares/verifyToken.middleware.ts`, `src/utils/tokenBlacklist.ts`, `src/utils/sessionRevocation.ts`, `src/utils/csrf.ts` | - |
| Password reset | auth-password-reset.md | draft | auth / `src/auth/auth.service.ts`, `src/utils/passwordReset.ts` | - |
| Candidate account | candidate-account.md | draft | candidate / `src/candidate/candidate.service.ts`, `src/routers/api/v1/candidate.route.ts` | - |
| CV section CRUD (education, experience, award, certificate, project, reference) | cv-section-crud.md | draft | cv sections / `src/candidate_profile/BaseController.ts`, `src/candidate_profile/BaseService.ts`, `src/services/index.ts` | - |
| General information | general-information.md | draft | cv sections / `src/candidate_profile/general_information/` | - |
| CV profiles (named subsets) | cv-profiles.md | draft | cv sections / `src/candidate_profile/profile/` | - |
| Job application tracker | job-applications.md | draft | cv sections / `src/candidate_profile/application/` | - |
| CV export (PDF / DOCX / JSON) | cv-export.md | draft | export / `src/candidate_me/index.ts`, `src/services/createPDF.ts`, `src/services/createPDF.ats.ts`, `src/services/createDocx.ts` | - |
| ATS check | ats-check.md | draft | export / `src/candidate_me/ats-check.ts`, `src/services/atsChecks.ts`, `src/services/keywordMatcher.ts` | - |
| CV file upload and import | cv-file-upload-import.md | draft | candidate / `src/candidate/parseCvPdf.service.ts`, `src/candidate/parseLinkedInExport.service.ts`, `src/middlewares/uploadCV.middleware.ts` | - |
| Public profile, search and public PDF | public-profile.md | draft | public / `src/routers/index.ts`, `src/candidate_me/` | - |
| Profile visits and stats | profile-visits.md | draft | public / `src/candidate/visitStats.service.ts`, `src/candidate_me/index.ts` | - |

## Doc format — `doctrine/features/<slug>.md`
~~~markdown
# <Feature name>

- Status: draft | verified — verified by `<verdict note path>` | verified —
  confirmed by operator <date>, see `<analyst note path>`
- Source: feature request | backfill from code
- Issues: #<n>[, #<n>...]
- Anchors: `<path>`, `<path>` (real paths, grep-confirmed)

## Goal
<1-3 lines: who needs this and why>

## Behavior
<numbered, observable rules: "when X, the system does Y". This is the
spec a fix is checked against.>

## Acceptance criteria
<each one measurable: a test command from doctrine/MEMORY.md, or an exact
observable result. Copied onto the diagram node by pick_next.>

## Edge cases
<input/state → expected result>

## Out of scope
<what this feature deliberately does NOT do>

## Open questions
<none, or each question + the operator's answer once given>

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
~~~
