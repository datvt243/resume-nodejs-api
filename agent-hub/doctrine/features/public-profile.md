# Public profile, search and public PDF

- Status: draft
- Source: backfill from code
- Issues: -
- Anchors: `src/routers/index.ts`, `src/candidate_me/index.ts`, `src/candidate_me/search.ts`, `src/candidate_me/public-pdf.ts`, `src/services/createPDF.ats.ts`, `src/models/candidate.model.ts`

## Goal
Anyone, without signing in, can find a candidate, view their CV online,
and download it as PDF, unless the candidate made their profile private.

## Behavior
1. No authentication on any route here; the global rate limit applies.
2. Identifier `:email` / `:identifier` = vanity slug, checked first, then
   registration email (for old share links).
3. `GET /api/me/:identifier?lang=&profile=` → 200 with the candidate
   (password, `__v`, timestamps removed) plus `generalInformation`
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
   and en), non-deleted rows only. Returns only public candidates with a
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
- The public payload includes every candidate field except password: email, phone, address, birthday, gender, marital, `cvFile`, `cvFileName`, `emailVerified`, `isPublic`. Should it be an explicit whitelist?
- Lookup by email means anyone who knows an email can confirm it's registered (if the profile is public). Keep the email fallback?
- Search reveals that a candidate matches a keyword even when the match is in data their `?profile=` views hide. Intended?
- Profiles are public by default (`isPublic` defaults to true). Intended?
- The public PDF cache is per process (not shared across instances) and keyed on the full data. OK?
- The global rate limiter keys on `req.ip`, and `trust proxy` is never set, so behind Render's proxy every visitor probably shares one 100-requests/15-min bucket. Live 2026-11-06: `x-ratelimit-remaining` fell by 15 more than this reviewer's own requests across about 8 requests. Set `trust proxy` (with the right hop count)?

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
