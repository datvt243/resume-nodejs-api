# Profile visits and stats

- Status: verified — confirmed by operator 2026-11-07, see `evidence/analyst/2026-11-07/profile-visits-spec.md`
- Source: backfill from code
- Issues: #395, #396, #398, #399
- Anchors: `src/routers/index.ts`, `src/routers/api/v1/candidate.route.ts`, `src/candidate_me/index.ts`, `src/candidate/candidate.controller.ts`, `src/candidate/candidate.service.ts`, `src/candidate/visitStats.service.ts`, `src/models/visit.model.ts`

## Goal
The frontend records each view of a public profile; the candidate sees
who visited, from where, through which link, and trends over time, and
can wipe it.

## Behavior
1. `POST /api/me/:identifier/visit` (no auth): identifier = slug then
   email; unknown or private (`isPublic: false`) → 404 with the same
   message as the public profile, nothing stored. Body optional:
   `referrer` (stored as hostname only, `www.`/`m.` stripped; non-http(s),
   invalid or > 2048 chars → `null`), `profile` (stored only if it's a
   non-deleted profile of that candidate, else `null`). IP = the leftmost
   `X-Forwarded-For` entry if it is a valid IP, else `req.ip` / socket
   address; `location` = "city, region,
   country" from a local geoip lookup (empty if unknown). 200, `data: null`.
2. `GET /api/v1/candidate/visits?page=&limit=` (auth, self only) → 200,
   one page of the caller's visits newest first (with ip, location,
   referrer, profileId, timestamps) + list `meta` (`total` = all visits).
   `page` default 1, `limit` default 20, capped at 100; missing/invalid →
   default.
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
- Visits are recorded for private profiles too (no `isPublic` check), although the profile itself 404s. Intended? → **Answer (operator 2026-11-07):** Change: don't record, 404 like the profile — #398
- No dedup or throttle per visitor beyond the global rate limit, so counts can be inflated. Intended? → **Answer (operator 2026-11-07):** Change: dedup, at most one visit per visitor per candidate per 24h — #399
- The candidate sees raw visitor IP addresses via `GET /candidate/visits`. Is exposing them intended (privacy)? → **Answer (operator 2026-11-07):** Intended (owner's own analytics)
- `GET /candidate/visits` returns every visit with no pagination. Should it page like other lists? → **Answer (operator 2026-11-07):** Change: paginate — #396
- Account delete doesn't remove visits (see `candidate-account`). → **Answer (operator 2026-11-07):** covered by #395
- Behavior 1 says "first valid `X-Forwarded-For` entry"; code uses only the leftmost entry if it is a valid IP, else `req.ip`/socket (`src/candidate_me/index.ts:274-279`, test `src/__tests__/candidate_me/index.test.ts:125-127`). Correct Behavior 1 to the code's rule? → **Answer (operator 2026-11-07):** fix the wording to match the code

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-07 | Operator answers recorded; Issues set; stays draft — Behavior 1 misstates the X-Forwarded-For rule, see `evidence/analyst/2026-11-07/profile-visits-spec.md` | analyst backfill re-check | - |
| 2026-11-07 | Behavior 1 IP wording corrected to the code; Status → verified | operator answer round 2, see `evidence/analyst/2026-11-07/profile-visits-spec.md` | - |
| 2026-11-08 | Behavior 1: private profile → 404, no visit stored | operator answer #398 | visit-skip-private |
| 2026-11-09 | Behavior 2: list is paginated (`page`/`limit`, default 20, max 100) | operator answer #396 | paginate-visits |
