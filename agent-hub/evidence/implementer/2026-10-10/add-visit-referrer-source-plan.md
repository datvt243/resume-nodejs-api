# 2026-10-10 — add-visit-referrer-source (implementer plan)

Worker: implementer · Version 0.1.0
Node: `add-visit-referrer-source` (`haven/diagrams/dev-loop.prime-mermaid.md`, appended row, PENDING)
Task (verbatim): `#248 Referrer/source tracking for public-profile visits (follow-up to #164)` (invoked via `/todo "#248"`; issue body is the full task)

## Hub bytes before: 229877
(measured with `/hub-tokens` per-session formula BEFORE adding the diagram row and this note)

## Node selection
No existing node for #248 → new node appended at the END of the PM status table (AppendOnly). The 2 older PENDING nodes (`fix-candidate-password-leak`, `fix-refresh-token-expiry-unused`) are unrelated; the operator explicitly picked #248 via `/todo`.

## Operator decisions (AskUserQuestion, 2026-10-10) — resolve the issue's 2 open questions
1. Source = **request body field `referrer` only**. Reason found while planning: both frontends fire the visit POST as XHR/fetch after load (`resume-vuejs-website/src/pages/public/PagePublicResume.vue:82`, `datvt243.github.io/plugins/VisitTracker.client.ts`), so the request's own `Referer` header is the CV page itself, not the external source — header-reading would record the CV site as the source of almost every visit.
2. Normalize = lowercase (URL parser) + strip one leading `www.` or `m.`.

## Acceptance
1. `Visit` gains optional `referrer: String` (default null); hostname only — never path/query.
2. `handlerRecordVisit` reads `req.body.referrer`: non-string, empty, unparsable, non-http(s), or oversized → stored null, never throws / never 4xx.
3. `/visits/stats` adds `sources: [{ source: string|null, count }]` from the same `$facet`, sorted like `countries`; visits without `referrer` → null. Still own-data-only (same `$match`).
4. No regression to `POST /api/me/:email/visit` (still succeeds w/o body) or `GET /visits`.
5. Tests for normalization + capture + stats facet; `npm test`, `npm run build`, lint delta 0.
6. Docs: root `CLAUDE.md` rows / swagger mention `referrer` + `sources`.

## Code anchors
- `src/models/visit.model.ts` (schema)
- `src/candidate_me/index.ts:243-270` (`handlerRecordVisit`)
- `src/candidate/visitStats.service.ts` (`$facet`, `VisitStats`, `FacetResult`)
- tests: `src/__tests__/candidate/visitStats.service.test.ts`, `src/__tests__/candidate_me/index.test.ts`

## Blockers
none — commands in `doctrine/MEMORY.md` have no `<<FILL>>`.
