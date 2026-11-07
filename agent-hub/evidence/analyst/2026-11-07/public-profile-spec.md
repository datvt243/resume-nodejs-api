# analyst — public-profile — 2026-11-07

## Task (verbatim)
document public-profile

## Doc
`agent-hub/doctrine/features/public-profile.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/index.ts`
- `src/candidate_me/index.ts`
- `src/candidate_me/search.ts`
- `src/candidate_me/public-pdf.ts`
- `src/services/createPDF.ats.ts` (`cvFilename`, `renderAtsPdfBuffer`)
- `src/models/candidate.model.ts`
- `src/server.ts`, `src/middlewares/rateLimit.middleware.ts`, `src/middlewares/httpsRedirect.middleware.ts` (grep: no `trust proxy`)

## Re-check vs code
Behavior 1–7 match code. Slug→email lookup with fail-closed key check (`index.ts:100-105`); password deleted, `__v`/timestamps projected out, sections drop `_id`/`candidateId` (`index.ts:89,150,177`); `?profile=` 24-hex + own + non-deleted else unfiltered (`index.ts:118-125`); private → same 404 (`index.ts:58`). Search: trim, 2–100, escaped regex, `isPublic $ne false` + non-empty slug, sort `_id`, limit ≤100 (`search.ts`); registered before `/api/me/:email` (`routers/index.ts:78,121`). PDF: template ≠ ats → 400, cache 1h/50 entries, failed renders evicted (`public-pdf.ts`). `isPublic` default true (`candidate.model.ts:50`). No discrepancy.

## Questions + answers
Operator (2026-11-07): "Behavior đúng" (Behavior section confirmed correct).
- Public payload includes every candidate field except password. Explicit whitelist? → **Answer (operator 2026-11-07):** Bug — #382
- Email fallback lets anyone confirm an email is registered. Keep it? → **Answer (operator 2026-11-07):** Intended (old share links)
- Search matches data hidden by `?profile=` views. Intended? → **Answer (operator 2026-11-07):** Change: search must only match entries that belong to at least one of the candidate's profiles — #397
- Profiles public by default. Intended? → **Answer (operator 2026-11-07):** Intended
- Public PDF cache per process, keyed on full data. OK? → **Answer (operator 2026-11-07):** Intended (single instance today)
- Rate limiter keys on `req.ip` without `trust proxy` → shared bucket. Set it? → **Answer (operator 2026-11-07):** Bug — #386

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/public-profile-spec.md` set in doc + INDEX row; Issues #382, #386, #397. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "Behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
