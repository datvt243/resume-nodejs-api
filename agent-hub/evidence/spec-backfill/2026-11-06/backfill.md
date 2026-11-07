# /spec-backfill — 2026-11-06

- Scope: `all` (operator-approved list, branch `chore/agent-hub-analyst`)
- Mode: read code only; no code change, no commit. Every doc `Status: draft`, `Source: backfill from code`.
- Anchors: every `src/...` path in the 13 docs confirmed to exist (`test -e`, 2026-11-06).
- Shared-contract check: the 6 section route files (education, experience, award, certificate, project, reference) plus application and profile were read in full; all are structurally identical (GET / → baseGetAll, /create, /update, /delete/:id, /restore/:id). Differences recorded per section in `cv-section-crud.md`: bulk (education, experience), images (award, certificate, project), experience link (project), boolean default field per section.

## Docs written (13)

- `doctrine/features/auth-register-login.md`
- `doctrine/features/auth-session-tokens.md`
- `doctrine/features/auth-password-reset.md`
- `doctrine/features/candidate-account.md`
- `doctrine/features/cv-section-crud.md`
- `doctrine/features/general-information.md`
- `doctrine/features/cv-profiles.md`
- `doctrine/features/job-applications.md`
- `doctrine/features/cv-export.md`
- `doctrine/features/ats-check.md`
- `doctrine/features/cv-file-upload-import.md`
- `doctrine/features/public-profile.md`
- `doctrine/features/profile-visits.md`

## Skipped

- Already indexed: none (INDEX.md was empty).
- Trimmed by operator: `rate-limit-and-platform` (infrastructure). Merged by operator: bulk create and section images into `cv-section-crud`; v2 auth recorded as an alias inside `auth-register-login`.
- Not documented (not a consumer feature): `/health`, `/api-docs`, `GET /` landing page.

## Open questions per doc

### auth-register-login
- `GET /auth/login` reads credentials from the request body; GET bodies are usually dropped by clients/proxies. Keep it, or remove the GET route?
- Register skips Mongoose model validation before save (TODO in `auth.service.ts`). Intended for now?
- No way to re-send a verification link; tokens live in memory when Redis is down and vanish on restart. Is that acceptable?
- Register success returns no tokens; the client must call login separately. Intended?

### auth-session-tokens
- `/auth/logout` blacklists only the access token; the refresh token stays usable until it expires and can mint new pairs. Intended?
- The `?token=` query parameter is accepted by every protected route (shared extractor), though the Swagger for `/download-pdf` says it is the only endpoint that accepts it. Restrict it to `/download-pdf`?
- An `Authorization` header without the `Bearer` scheme is accepted as a raw token. Intended?
- `/auth/logout` doesn't verify the token (any string gets blacklisted). Fine?

### auth-password-reset
- A successful reset does not revoke existing sessions (no logout-all), so a stolen session survives a password change. Intended?
- Requesting several resets leaves several valid tokens alive at once. Intended?
- forgot-password has no per-email throttle beyond the global auth rate limit. Enough?

### candidate-account
- `GET /candidate/:email` lets any signed-in user read any other candidate's full record (phone, address, birthday, `isPublic`…) by email, even a private one. Intended, or should it be self-only?
- Account delete does not remove the candidate's `Visit` documents and does not revoke their tokens (still-valid tokens hit "id not found"). Intended?
- An unknown/deleted caller id returns 400, not 404. Intended?
- `marital`/`gender` are booleans. Is that the intended data model?

### cv-section-crud
- Deleting an already-deleted entry succeeds again and moves `deletedAt` forward (lookup doesn't exclude deleted). Should it be 404?
- Image upload accepts a soft-deleted entry (`findById` doesn't filter `deletedAt`). Intended?
- Bulk partial success returns 201 with the message `common.createFailed`. Should the message reflect partial success?
- Bulk create runs items sequentially, one DB round-trip each, up to 100. OK?
- Image upload has no automated test. Add one?
- Uploaded images stay on disk when an entry is soft-deleted, and there is no per-entry image cap (5 per request, unlimited requests). Intended?

### general-information
- GET returns an object rather than the `data: []` + `meta` list shape every other list uses. That fits one record per candidate, but should `API-STANDARD.md` record it as an exception?
- Update needs the record's `_id` from the client even though there is only one per candidate. Should it be keyed by candidate instead?
- The one-per-candidate rule is checked in code only (read then create); two concurrent creates could both pass. Is a unique index wanted?

### cv-profiles
- The listed ids aren't checked for ownership or existence on create/update. Public rendering only reads the owner's own entries, so foreign ids just match nothing. Should they be rejected up front?
- The default `Tổng hợp` profile is a snapshot: entries added later aren't added to it. Intended?
- A GET has a write side effect (creates the default profile). Intended?
- Owner export (`GET /download-pdf`) and `POST /cv/ats-check` don't accept `?profile=`. Should they?

### job-applications
- `jobLink` isn't validated as a URL. Intended?
- No status-transition rules (e.g. `rejected` → `applied` is allowed). Intended?

### cv-export
- Classic/modern PDF is always saved to `public/pdf/<email>.pdf`, which `express.static` serves without auth, so anyone who can guess an email can fetch that CV (known trap in `PROJECT.md`). Should the disk write be removed?
- Unknown `format`/`template` values silently fall back instead of returning 400 (the public PDF route does return 400 for a bad template). Make them consistent?
- `?profile=` isn't supported on owner export. Should it be?
- The route is named `download-pdf` but also serves DOCX and JSON. OK?

### ats-check
- With `template=classic`, metadata and section headings are never supplied, so `metadata` always fails and `standard-headings` always passes without checking anything (empty heading list). Is that intended?
- The success message `ATS self-check completed` is hard-coded English, not i18n. Intended?
- The classic render here ignores `lang` (`renderPdfBuffer` takes no options); the data itself is localized. OK?
- `modern` can't be checked. Intended?
- `jobDescription` has no length cap beyond the 1mb body limit. Enough?

### cv-file-upload-import
- The stored CV lives under `public/uploads/cv/<candidateId>-cv.pdf`, which `express.static` serves without auth to anyone who knows the candidate id (known trap in `PROJECT.md`). Move it out of `public/`?
- LinkedIn: an end date that exists but can't be parsed also yields `isCurrent: true`. Intended?
- Upload and download of the stored CV have no automated test. Add one?
- A `cvFile` record whose file is missing on disk: `res.download` errors, and the resulting status isn't defined. What should it return?

### public-profile
- The public payload includes every candidate field except password: email, phone, address, birthday, gender, marital, `cvFile`, `cvFileName`, `emailVerified`, `isPublic`. Should it be an explicit whitelist?
- Lookup by email means anyone who knows an email can confirm it's registered (if the profile is public). Keep the email fallback?
- Search reveals that a candidate matches a keyword even when the match is in data their `?profile=` views hide. Intended?
- Profiles are public by default (`isPublic` defaults to true). Intended?
- The public PDF cache is per process (not shared across instances) and keyed on the full data. OK?

### profile-visits
- Visits are recorded for private profiles too (no `isPublic` check), although the profile itself 404s. Intended?
- No dedup or throttle per visitor beyond the global rate limit, so counts can be inflated. Intended?
- The candidate sees raw visitor IP addresses via `GET /candidate/visits`. Is exposing them intended (privacy)?
- `GET /candidate/visits` returns every visit with no pagination. Should it page like other lists?
- Account delete doesn't remove visits (see `candidate-account`).
