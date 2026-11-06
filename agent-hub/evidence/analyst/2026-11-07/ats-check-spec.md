# analyst — ats-check — 2026-11-07

## Task (verbatim)
document ats-check

## Doc
`agent-hub/doctrine/features/ats-check.md` (existing bulk-backfill draft, re-checked per recipe step 4, not rewritten)

## Sources read
- `agent-hub/haven/workers/analyst/SOUL.md`
- `agent-hub/haven/workers/analyst/recipes/spec_feature.md`
- `agent-hub/doctrine/features/INDEX.md`
- `agent-hub/doctrine/domains/PROJECT.md`
- `agent-hub/doctrine/MEMORY.md`
- `src/routers/api/v1/index.ts` (`/cv` behind `verifyToken`), `src/routers/api/v1/cv.route.ts`
- `src/candidate_me/ats-check.ts`
- `src/services/atsChecks.ts`, `src/services/keywordMatcher.ts`, `src/services/createPDF.ts` (`renderPdfBuffer(data)`, no options)
- `src/config/body.config.ts` (`REQUEST_BODY_LIMIT = '1mb'`)

## Re-check vs code
Behavior 1–6 match code. Own CV only via `req.user._id`, nothing persisted (`ats-check.ts`); `lang` en else vi, `template` classic else ats, `jobDescription` string-only; 10 checks in `runAtsChecks` order, all `error` except `page-count` `warning` (≤2), weights 2/1, `Math.round` (`atsChecks.ts`); classic path passes no headings/metadata (open Q1); `matchKeywords` alias-aware whole-word lowercase, coverage 0 when no JD keyword; response shape incl. conditional `keywordMatch`. Hard-coded message `'ATS self-check completed'` (open Q2). No discrepancy.

## Questions + answers
Operator (2026-11-07): "behavior đúng" (Behavior section confirmed correct).
- With `template=classic`, metadata and section headings are never supplied, so `metadata` always fails and `standard-headings` always passes without checking anything (empty heading list). Is that intended? → **Answer (operator 2026-11-07):** Bug: report both as not applicable for classic, excluded from score — #406
- The success message `ATS self-check completed` is hard-coded English, not i18n. Intended? → **Answer (operator 2026-11-07):** Bug: i18n — #407
- The classic render here ignores `lang` (`renderPdfBuffer` takes no options); the data itself is localized. OK? → **Answer (operator 2026-11-07):** Intended
- `modern` can't be checked. Intended? → **Answer (operator 2026-11-07):** Intended
- `jobDescription` has no length cap beyond the 1mb body limit. Enough? → **Answer (operator 2026-11-07):** Intended

## Result
status: verified — every open question answered + operator confirmed Behavior.
`Status: verified — confirmed by operator 2026-11-07, see evidence/analyst/2026-11-07/ats-check-spec.md` set in doc + INDEX row; Issues #406, #407. Behavior unchanged (describes code today; changes tracked by the issues).

## Isolation proof
Separate spawned agent (Agent tool), blank context. Received only the
dispatch prompt (task, operator's "behavior đúng" confirmation, the
operator's answers + issue numbers). No implementer reasoning, no main
session transcript. All Behavior items re-checked by reading code myself.
