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
| Register, login and email verification | auth-register-login.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/auth-register-login-spec.md` | auth / `src/auth/`, `src/routers/api/v1/auth.route.ts`, `src/routers/api/v2/auth.route.ts` | #385, #387, #389, #390 |
| Session tokens: refresh, logout, logout-all | auth-session-tokens.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/auth-session-tokens-spec.md` | auth / `src/middlewares/verifyToken.middleware.ts`, `src/utils/tokenBlacklist.ts`, `src/utils/sessionRevocation.ts`, `src/utils/csrf.ts` | #391, #392 |
| Password reset | auth-password-reset.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/auth-password-reset-spec.md` | auth / `src/auth/auth.service.ts`, `src/utils/passwordReset.ts` | #385, #387, #393 |
| Candidate account | candidate-account.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/candidate-account-spec.md` | candidate / `src/candidate/candidate.service.ts`, `src/routers/api/v1/candidate.route.ts` | #380, #394, #395 |
| CV section CRUD (education, experience, award, certificate, project, reference) | cv-section-crud.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-section-crud-spec.md` | cv sections / `src/candidate_profile/BaseController.ts`, `src/candidate_profile/BaseService.ts`, `src/services/index.ts`, `src/candidate_me/index.ts` | #381, #402, #403, #404, #413 (manual order, verified by `evidence/verifier/2026-11-14/education-project-manual-order-seal.md`) |
| General information | general-information.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/general-information-spec.md` | cv sections / `src/candidate_profile/general_information/` | #408 |
| CV profiles (named subsets) | cv-profiles.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-profiles-spec.md` | cv sections / `src/candidate_profile/profile/` | #400, #405 |
| Job application tracker | job-applications.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/job-applications-spec.md` | cv sections / `src/candidate_profile/application/` | #409, #410 |
| CV export (PDF / DOCX / JSON) | cv-export.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-export-spec.md` | export / `src/candidate_me/index.ts`, `src/services/createPDF.ts`, `src/services/createPDF.ats.ts`, `src/services/createDocx.ts` | #383, #400 |
| ATS check | ats-check.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/ats-check-spec.md` | export / `src/candidate_me/ats-check.ts`, `src/services/atsChecks.ts`, `src/services/keywordMatcher.ts` | #406, #407 |
| CV file upload and import | cv-file-upload-import.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/cv-file-upload-import-spec.md` | candidate / `src/candidate/parseCvPdf.service.ts`, `src/candidate/parseLinkedInExport.service.ts`, `src/middlewares/uploadCV.middleware.ts` | #383, #384, #388, #401, #402 |
| Public profile, search and public PDF | public-profile.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/public-profile-spec.md` | public / `src/routers/index.ts`, `src/candidate_me/` | #382, #386, #397 |
| Profile visits and stats | profile-visits.md | verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/profile-visits-spec.md` | public / `src/candidate/visitStats.service.ts`, `src/candidate_me/index.ts` | #395, #396, #398, #399 |

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
