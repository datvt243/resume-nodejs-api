# Public profile, search and public PDF

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/public-profile-spec.md`
- Source: backfill from code
- Issues: #382, #386, #397
- Anchors: `src/routers/index.ts`, `src/candidate_me/index.ts`, `src/candidate_me/search.ts`, `src/candidate_me/public-pdf.ts`, `src/services/createPDF.ats.ts`, `src/models/candidate.model.ts`

## Goal
Anyone, without signing in, can find a candidate, view their CV online,
and download it as PDF, unless the candidate made their profile private.

## Behavior
1. No authentication on any route here; the global rate limit applies,
   keyed per client IP (`TRUST_PROXY_HOPS` proxy hops trusted; 1 on Render).
2. Identifier `:email` / `:identifier` = vanity slug, checked first, then
   registration email (for old share links).
3. `GET /api/me/:identifier?lang=&profile=` → 200 with only the public
   candidate fields `firstName`, `lastName`, `introduction`, `socialMedia`,
   `slug`, `email`, `phone`, `address` (every other candidate field, incl.
   `_id`, `birthday`, `gender`, `marital`, `cvFile`, `cvFileName`,
   `emailVerified`, `isPublic`, is dropped) plus `generalInformation`
   (object or `{}`), `experiences`, `educations`, `references`,
   `projects`, `certificates`, `awards` (non-deleted only, `_id` and
   `candidateId` removed). Localized fields resolved to `lang` (`en`,
   else `vi`), falling back to the other language.
4. `?profile=<id>`: if it's a 24-hex id of a non-deleted profile of this
   candidate, each of the six list sections is filtered to that profile's
   ids; otherwise (missing, malformed, foreign, deleted) everything is
   returned unfiltered.
5. Unknown identifier and `isPublic: false` → the same 404
   `publicProfile.notFound`.
6. `GET /api/me/search?q=&page=&limit=`: `q` trimmed, 2–100 chars, else
   400. Case-insensitive substring match (regex-escaped) over general
   information `positionDesired` / `professionalSkills.name`, experience
   `company` / `position` / `skills`, education `school` / `major` (vi
   and en), non-deleted rows only, and only entries in at least one of
   the candidate's non-deleted profiles: an experience/education row
   counts only if such a profile of the same candidate lists its id;
   general information (shown in every profile view) counts only if the
   candidate has ≥1 non-deleted profile. Returns only public candidates with a
   non-empty slug, sorted by `_id`, `page` default 1, `limit` default 20
   (max 100); each item is `{ slug, firstName, lastName,
   positionDesired }` + list `meta`. Registered before `/api/me/:email`,
   so a slug literally `search` is unreachable.
7. `GET /api/me/:identifier/download-pdf?lang=&profile=&template=`: only
   `template=ats` (or absent) is allowed, anything else → 400. Same data
   and 404 rules as rule 3–5. 200 PDF attachment (ATS renderer, with
   metadata, filename as in `cv-export` rule 7). Rendered PDFs are cached
   in memory per exact data + lang for 1 hour (max 50 entries, oldest
   evicted; failed renders not cached).
8. Pending #413 (draft): `educations` and `projects` will be ordered by the manual display order, see `cv-section-crud` rules 13–16.

## Acceptance criteria
- `npx jest src/__tests__/candidate_me/index.test.ts src/__tests__/candidate_me/search.test.ts src/__tests__/candidate_me/public-pdf.test.ts` passes.
- `GET /api/me/<slug of a private candidate>` and `GET /api/me/does-not-exist` → both HTTP 404 with identical body.
- `GET /api/me/search?q=a` → HTTP 400.
- `GET /api/me/<slug>/download-pdf?template=classic` → HTTP 400.

## Edge cases
- `?profile=` not a 24-hex string → ignored (no 500).
- Search `q` with regex characters (`c++`) → matched literally.

## Out of scope
- Owner-only data (applications, visits).

## Open questions
- The public payload includes every candidate field except password: email, phone, address, birthday, gender, marital, `cvFile`, `cvFileName`, `emailVerified`, `isPublic`. Should it be an explicit whitelist? → **Answer (operator 2026-11-07):** Bug — #382; fields kept public (operator 2026-11-08): email, phone, address — plus firstName, lastName, introduction, socialMedia, slug
- Lookup by email means anyone who knows an email can confirm it's registered (if the profile is public). Keep the email fallback? → **Answer (operator 2026-11-07):** Intended (old share links)
- Search reveals that a candidate matches a keyword even when the match is in data their `?profile=` views hide. Intended? → **Answer (operator 2026-11-07):** Change: search must only match entries that belong to at least one of the candidate's profiles — #397
- Profiles are public by default (`isPublic` defaults to true). Intended? → **Answer (operator 2026-11-07):** Intended
- The public PDF cache is per process (not shared across instances) and keyed on the full data. OK? → **Answer (operator 2026-11-07):** Intended (single instance today)
- The global rate limiter keys on `req.ip`, and `trust proxy` is never set, so behind Render's proxy every visitor probably shares one 100-requests/15-min bucket. Live 2026-11-06: `x-ratelimit-remaining` fell by 15 more than this reviewer's own requests across about 8 requests. Set `trust proxy` (with the right hop count)? → **Answer (operator 2026-11-07):** Bug — #386; hop count (operator 2026-11-08): browser calls the Render URL directly, no relay → 1

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
| 2026-11-07 | Operator confirmed Behavior + answered all open questions; Status → verified | analyst backfill re-check, see `evidence/analyst/2026-11-07/public-profile-spec.md` | - |
| 2026-11-08 | Behavior 3: explicit public whitelist of candidate fields | operator answer #382 (fields: email, phone, address) | public-profile-field-whitelist |
| 2026-11-08 | Behavior 1: rate limit keyed per real client IP via `TRUST_PROXY_HOPS` | operator answer #386 (browser → Render directly, 1 hop) | trust-proxy-hops |
| 2026-11-09 | Behavior 6: search only matches entries in ≥1 non-deleted profile of the candidate | operator answer #397 (2026-11-07) | search-in-profile-only |
