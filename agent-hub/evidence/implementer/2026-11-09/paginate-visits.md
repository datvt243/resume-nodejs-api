# paginate-visits — implement

- Task: #396 Paginate `GET /candidate/visits`. Branch `396-paginate-get-candidate` (base `staging` @ 17164b3)
- Node: `paginate-visits` (PENDING, `haven/diagrams/dev-loop.prime-mermaid.md`, last row)
- Plan: `evidence/implementer/2026-11-09/paginate-visits-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 96902

## Feature doc: agent-hub/doctrine/features/profile-visits.md
## Feature doc changed: Behavior 2 now describes the paged list (`page`/`limit`, default 20, max 100, `meta.total` = all visits). Changelog row added 2026-11-09 (operator answer #396, node paginate-visits). This applies the operator's recorded answer in `## Open questions` ("Change: paginate — #396").

## Diff (src + docs)
- `src/services/index.ts`: `MAX_PAGE_LIMIT` is now exported. `parsePositiveInt` moved here unchanged (with a JSDoc) from `src/candidate_me/search.ts`.
- `src/candidate_me/search.ts`: removed the local `parsePositiveInt` and now imports it from `@/services`. No behavior change.
- `src/candidate/candidate.service.ts` `handlerGetVisits(candidateId, { page, limit }, lang)`: `find({candidateId}).sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit)` runs in parallel with `countDocuments({candidateId})`, and the function returns `meta: listMeta(total, page, limit)`. The query filter is unchanged (candidateId from the JWT only).
- `src/candidate/candidate.controller.ts` `fnGetVisits`: `page = parsePositiveInt(page) ?? 1`, `limit = min(parsePositiveInt(limit) ?? VISITS_DEFAULT_LIMIT(20), MAX_PAGE_LIMIT)`, and passes the service `meta` through to `ok()`. The unused `listMeta` import was dropped.
- `src/routers/api/v1/candidate.route.ts`: swagger `page`/`limit` query params added; 200 description now says "one page".
- `.claude/rules/api.md`: `/visits` row updated.
- Tests: `src/__tests__/candidate/candidate.service.test.ts` adds a `handlerGetVisits` case (filter, sort with tiebreak, skip/limit, meta over the total). `src/__tests__/candidate/candidate.controller.test.ts` adds `GET /visits paging` (4 cases: defaults, explicit values, invalid → default, cap at 100).
- Only caller of `handlerGetVisits`: `src/candidate/candidate.controller.ts:192` (grep of `src/` outside tests).

## Acceptance
| Criterion | Evidence |
|---|---|
| page/limit; default 1/20; invalid → default; cap 100 | `npx jest src/__tests__/candidate/candidate.service.test.ts src/__tests__/candidate/candidate.controller.test.ts src/__tests__/candidate_me` → `Test Suites: 5 passed, 5 total` / `Tests: 110 passed, 110 total`; cases `query {} … {"limit": 20, "page": 1}`, `{"limit": "5", "page": "3"} … {5,3}`, `{"limit": "abc", "page": "0"} … {20,1}`, `{"limit": "1000", "page": "-2"} … {100,1}` all ✓ |
| newest first, stable | service test asserts `sort({ createdAt: -1, _id: -1 })`, `skip(2)`, `limit(2)` for page 2 / limit 2 |
| same meta shape, total = all visits | service test: `meta: { page: 2, limit: 2, total: 5, totalPages: 3 }` from `countDocuments({ candidateId: 'cand1' })` |
| search unchanged after the helper move | `src/__tests__/candidate_me` suites pass in the same run above |
| `npm test` | `Test Suites: 2 failed, 64 passed, 66 total` / `Tests: 5 failed, 650 passed, 655 total`. The 5 failures are pre-existing: with the diff stashed (`git stash push -u`), `npx jest src/__tests__/auth/tokenExpiry.test.ts src/__tests__/services/atsPdfIntegration.test.ts` → `Tests: 5 failed, 2 passed, 7 total`, the same as with the diff. Causes: `tokenExpiry` reports `Expected: 3600 / Received: 10800` (local `.env` sets TOKEN_EXP_IN). `atsPdfIntegration` reports `Could not find Chrome (ver. 127.0.6533.88)`. Neither touches visits. |
| Typecheck (`inside Build`) | `npm run build` → exit 0 (`tsc && npm run copy`; last lines `> resume-nodejs-api@2.7.2 copy` / `> cp -R ./src/public ./dist/`) |
| Lint ≤ 274, none in changed files | `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)`. Base with the diff stashed: `✖ 274 problems`. The first run showed 275, one new `no-unnecessary-type-assertion` from my `as any` in the controller test. I removed it and re-ran: 274. A per-file/rule diff of `eslint -f json .` before vs after showed that one finding as the only delta. |
| comments per code-comments.md | Added: `// \`_id\` breaks createdAt ties so a visit never shows on two pages.` (service, WHY), `// Visits grow without bound, so the list pages by default (same default as /api/me/search).` (controller, WHY), and a `/** */` JSDoc on exported `parsePositiveInt`. None has an issue ref, all are single-sentence `//` or JSDoc. The swagger block is functional doc. |

## Supersedes: none
No other not-yet-SEALED row on the active diagram cites #396.

## Still open: none

## Noticed, not done
- `src/candidate_me/search.ts` keeps its own `MAX_LIMIT = 100` (it duplicates `MAX_PAGE_LIMIT`, now exported). It was left alone to keep the diff small.
- Pre-existing local test failures (tokenExpiry with the `.env` TOKEN_EXP_IN, ATS integration with no Chrome) are outside this node.

## Design choice for the verifier/operator
"Like other list endpoints" is ambiguous. CRUD lists (`baseFindDocument`) page only when `limit` is passed, while `/api/me/search` pages by default (20/100). The issue's problem is "returns every visit in one response", so this diff pages by default the way search does. This is a contract change: a client that relied on getting every visit now gets 20 unless it passes `limit`. `meta.total` still gives the full count.
