# owner-export-profile-filter — plan (pick_next)

- Task: #400 Support `?profile=` on owner export (`GET /download-pdf`) and `POST /cv/ats-check` — https://github.com/datvt243/resume-nodejs-api/issues/400
- Branch: `400-support-profile-on` (from `staging` @ d685d0c)
- Node: `owner-export-profile-filter` (new, PENDING, appended to `haven/diagrams/dev-loop.prime-mermaid.md` before any code edit; slug not in `dev-loop-archive.md`, no other row cites #400).

## Hub bytes before: 96166

## Feature doc: agent-hub/doctrine/features/cv-export.md
Also touched: `ats-check.md`, `cv-profiles.md`. All verified. The open question on cv-export ("`?profile=` isn't supported on owner export. Should it be?") and on cv-profiles were answered by the operator (2026-11-07): "Change: support it — #400". The doc Behavior that contradicts the change (cv-export rule 2 "without `?profile=` filtering") is therefore updated by this node, with a Changelog row. Pass 0 (analyst) was skipped: the doc exists and every question in it is answered.

## Acceptance criteria clarified: "both accept `?profile=<id>` with the same rule as the public routes" → concrete:
1. `fnExportPDF` reads `req.query.profile` (string only) and passes it as `profileId` to `handlerGetAboutMe`, for every format (json/docx/pdf/ats).
2. `fnAtsCheck` reads `req.query.profile` the same way and passes it as `profileId`.
3. The filter rule itself is the existing one in `handlerGetAboutMe` (Profile lookup scoped to `candidateId` of the caller + `deletedAt: null`; malformed / QuerySafe-rejected / unresolved id → unfiltered), already covered by the `handlerGetAboutMe — profile filtering (issue #133)` tests — not re-implemented.
4. New tests in `src/__tests__/candidate_me/index.test.ts`: for both handlers, `?profile=<own id>` → `Profile.findOne` called with the caller's `candidateId` and `deletedAt: null`, and a section `find` filtered by `_id: { $in }`; no `?profile` → `Profile.findOne` not called.
5. Swagger: `profile` query param documented on `/api/v1/download-pdf` and `/api/v1/cv/ats-check`.
6. Verified by `npx jest src/__tests__/candidate_me/index.test.ts`, then `npm test`, `npm run build`, `npm run lint` (≤ 274, none in changed files).

## Anchors
- `src/candidate_me/index.ts` `fnExportPDF`, `handlerGetAboutMe` (comment saying the fallback exists "since this is a public route")
- `src/candidate_me/ats-check.ts` `fnAtsCheck`
- `src/routers/api/v1/index.ts` swagger `/api/v1/download-pdf`
- `src/routers/api/v1/cv.route.ts` swagger `/api/v1/cv/ats-check`
- `.claude/rules/api.md` (endpoint rows, if they list query params)

## Blocked by: none
