# 2026-11-05 — add-cv-file-name (verifier verdict)

- Worker: verifier · Version: 0.1.0 (subagent, dispatched via Agent tool)
- Node: `add-cv-file-name` (`haven/diagrams/dev-loop.prime-mermaid.md`), GitHub #363
- New PM status: REOPEN (row left as `PENDING` — RatchetOnly, never advanced)

## Isolation proof
Spawned as a fresh `Agent` with description "Verify add-cv-file-name seal" and a task string
beginning "You are the agent-hub VERIFIER worker for the repo at ..." — no implementer turns in
context; only the implementer's written note (`evidence/implementer/2026-11-05/add-cv-file-name-plan.md`)
was read. Did not write this diff.

## Reasoning
| Criterion | Verdict |
|---|---|
| PATCH accepts `cvFileName`; `/ \ " CR LF` → 400 | cited: `candidate.validate.test.ts` cases (accept '', Vietnamese, dots, 100 chars; reject slash, backslash, quote, CR/LF, 101) |
| One helper `cvFilename()`, sanitised, fallback | cited: `../../etc/passwd` → `etc_passwd.pdf`, quote+CRLF payload case; `atsPdfFilename` grep → none |
| Classic / ATS / public PDF + DOCX use it, no email in DOCX | cited per path (named tests in note) |
| CORS `exposedHeaders: ['Content-Disposition']` | cited: cors test "exposes Content-Disposition …" |
| `cvFileName` in GET, PATCH response, public `/api/me` | note gave code-path reasoning only; independently confirmed: `candidate.controller.ts:31` calls `handlerGetInformationById(id)` with no select → `select('-password')` (`candidate.service.ts:59`); public uses exclusion-only `removeFields` (`candidate_me/index.ts:88`); PATCH (`candidate.service.ts:84`) goes through allow-list, `querySafe.ts:54` has `'cvFileName'` |
| Swagger + models.md + tests | diff rows; 569 total vs 548 baseline |
| `npm test` no new failure | `Tests: 5 failed, 564 passed, 569 total` — same 5 baseline (tokenExpiry, atsPdfIntegration) |
| Typecheck (inside Build) | note `build_exit=0`; re-run `build_exit=0` |
| Lint ≤ 274, none new in touched files | note 274 + before/after stash compare; re-run `✖ 274 problems (274 errors, 0 warnings)` |
| comments per code-comments.md | row present (1-line WHYs, JSDoc on exported `cvFilename`) — no violation cited |
| Supersedes / Still open | `## Supersedes: none`; no other open #363 row on active diagram |
| Seal gate | recorded ("Approve all 4"), ship after SEAL only |
| Proportionality | đ/Đ slugify fix needed for Vietnamese `cvFileName`; classic PDF header required by node — in scope |
| **Project extension: PDF/DOCX export → `pdf-export-standard.md`** | **MISSING** — diff touches `createPDF.ts`, `createPDF.ats.ts`, `createDocx.ts`; note has zero mention of the standard |

Forbidden states: `ADHOC_WORK` no (node on diagram); `NO_EVIDENCE` no; `CODE_IN_HAVEN` no;
`DIAGRAM_DRIFT` no; `EDIT_UNVERIFIED` — triggered by the missing export-standard confirmation
(standard's Enforcement: "no mention of this file should [be treated] as a gap, not assume compliance").

## Missing
1. `agent-hub/CLAUDE.md` Project extension + `doctrine/standards/pdf-export-standard.md` §Enforcement:
   the note must, for each of the 10 rules, either confirm it still holds (grep/re-read as the
   standard says) or name the rule as not applicable and why (e.g. "header-only change, no
   HTML/CSS/date/list/metadata lines touched"). Pay particular attention to rule 10 (no PII in
   on-disk paths — confirm `cvFilename()` output is only used in the HTTP header, never as a
   disk path) and rule 9 (PDF metadata unchanged by the ATS edit).
   Nothing else is missing — once this section is added the rest of the note stands as-is.

## Re-run
`partial` — node is outward-facing (public PDF endpoint, `Content-Disposition` header-injection
sanitisation, CORS config). Re-ran:
- `npx jest src/__tests__/candidate src/__tests__/services/createDocx.test.ts src/__tests__/services/createPDF.test.ts src/__tests__/candidate_me src/__tests__/config/cors.config.test.ts` → `Test Suites: 22 passed, 22 total` / `Tests: 280 passed, 280 total`
- `npm run build` → `build_exit=0`
- `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)`
- read-only check of the GET / public / PATCH select lines cited above.
