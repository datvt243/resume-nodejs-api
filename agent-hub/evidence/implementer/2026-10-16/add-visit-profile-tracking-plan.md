# 2026-10-16 — add-visit-profile-tracking (implementer plan)

Worker: implementer · Version 0.1.0
Node: `add-visit-profile-tracking` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended row, PENDING)
Task (verbatim): `#253 Record which CV profile was viewed on public-profile visits` (invoked via `/todo #253`; issue body is the full task)
Branch: `253-record-which-cv` off `staging` @ `89360fc`

## Hub bytes before: 231949
(measured with `/hub-tokens` per-session formula BEFORE adding the diagram row and this note)

## Node selection
No existing node for #253 → new node appended at the END of the PM status table (AppendOnly). Operator picked #253 via `/todo`.

## Operator decisions (AskUserQuestion, 2026-10-16) — the issue's 2 open questions
1. Input = **request body field `profile` only** (same channel as `referrer`; name mirrors the `?profile=` the SPA passes to `GET /api/me/:identifier`).
2. Soft-deleted later = **keep the id in old visits, flag it**: stats row `{ profileId, name, deleted: true, count }`, name via `$lookup` in the same aggregation.

## Acceptance
1. `Visit` gains optional `profileId: ObjectId` (default null, ref `profile`).
2. `handlerRecordVisit` reads `req.body.profile`: stored only when QuerySafe accepts it as an id AND `Profile.findOne({ _id, candidateId: visited candidate, deletedAt: null })` finds it; non-string / malformed / foreign / deleted / missing → null; never throws or 4xx because of it; no Profile query at all when absent.
3. `/visits/stats` adds `profiles: [{ profileId: string|null, name: string|null, deleted: boolean, count }]` from the same `$facet` (same `$match`, own data only), sorted `count desc, _id asc`; null bucket = default link / legacy visits (name null, deleted false); soft-deleted → deleted true with its name; missing doc → name null, deleted true.
4. No regression: `POST /visit` without body, `GET /visits`, `countries`, `sources`.
5. Tests for capture (valid/foreign/deleted/malformed/absent) + stats facet shape/mapping; `npm test`, `npm run build`, lint delta 0.
6. Docs: root `CLAUDE.md`, README, swagger (`requestBody.profile`, `profiles` schema).
7. comments per code-comments.md.

## Code anchors
- `src/models/visit.model.ts` (schema)
- `src/candidate_me/index.ts:243-270` (`handlerRecordVisit`); profile ownership pattern reused from `handlerGetAboutMe:117-124`
- `src/candidate/visitStats.service.ts` (`$facet`, `VisitStats`, `FacetResult`)
- `src/routers/index.ts:124-156` (visit swagger), `src/routers/api/v1/candidate.route.ts:230-295` (stats swagger)
- tests: `src/__tests__/candidate/visitStats.service.test.ts`, `src/__tests__/candidate_me/index.test.ts`

## Blockers
none — commands in `doctrine/MEMORY.md` have no `<<FILL>>`.
