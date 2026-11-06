# Profile visits and stats

- Status: draft
- Source: backfill from code
- Issues: -
- Anchors: `src/routers/index.ts`, `src/routers/api/v1/candidate.route.ts`, `src/candidate_me/index.ts`, `src/candidate/candidate.controller.ts`, `src/candidate/candidate.service.ts`, `src/candidate/visitStats.service.ts`, `src/models/visit.model.ts`

## Goal
The frontend records each view of a public profile; the candidate sees
who visited, from where, through which link, and trends over time, and
can wipe it.

## Behavior
1. `POST /api/me/:identifier/visit` (no auth): identifier = slug then
   email; unknown → 404 (same as public profile). Body optional:
   `referrer` (stored as hostname only, `www.`/`m.` stripped; non-http(s),
   invalid or > 2048 chars → `null`), `profile` (stored only if it's a
   non-deleted profile of that candidate, else `null`). IP = first valid
   `X-Forwarded-For` entry, else socket IP; `location` = "city, region,
   country" from a local geoip lookup (empty if unknown). 200, `data: null`.
2. `GET /api/v1/candidate/visits` (auth, self only) → 200, all of the
   caller's visits newest first (with ip, location, referrer, profileId,
   timestamps) + list `meta`.
3. `DELETE /api/v1/candidate/visits` (auth, self only) → hard-deletes
   all the caller's visits, 200 `data: { deletedCount }`.
4. `GET /api/v1/candidate/visits/stats?interval=&from=&to=&tz=` (auth,
   self only): `interval` `day` (default) | `week` (ISO `YYYY-Www`) |
   `month`; `tz` IANA zone, default `Asia/Ho_Chi_Minh`; `from`/`to`
   `YYYY-MM-DD` real dates, default = last 30 days ending today in `tz`.
   Invalid interval/tz/date, `from > to`, or more than 400 buckets → 400.
5. Stats response: `{ interval, tz, from, to, total, series[{ bucket,
   count }] (zero-filled, every bucket in range), countries[{ country |
   null, count }] (last part of location), sources[{ source | null,
   count }], profiles[{ profileId | null, name, deleted, count }] }`,
   breakdowns sorted by count desc.

## Acceptance criteria
- `npx jest src/__tests__/candidate/visitStats.service.test.ts src/__tests__/candidate_me/index.test.ts src/__tests__/candidate/candidate.service.test.ts` passes.
- `GET /candidate/visits/stats?interval=year` → HTTP 400.
- `POST /api/me/<slug>/visit` with `referrer: "https://www.linkedin.com/feed/"` → stored `referrer = "linkedin.com"`.

## Edge cases
- Visits recorded before `referrer`/`profileId` existed → counted under `null`.
- `from=2026-02-30` → 400.

## Out of scope
- Visitor identity beyond IP; bot filtering.

## Open questions
- Visits are recorded for private profiles too (no `isPublic` check), although the profile itself 404s. Intended?
- No dedup or throttle per visitor beyond the global rate limit, so counts can be inflated. Intended?
- The candidate sees raw visitor IP addresses via `GET /candidate/visits`. Is exposing them intended (privacy)?
- `GET /candidate/visits` returns every visit with no pagination. Should it page like other lists?
- Account delete doesn't remove visits (see `candidate-account`).

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
