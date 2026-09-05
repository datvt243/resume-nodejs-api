# 2026-09-05 — add-pagination-filtering-cv-sections (plan + diff)

- Worker: implementer
- Version: 0.1.0
- Node: `add-pagination-filtering-cv-sections` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task (verbatim): `/todo "#73"` — GitHub issue #73, "Pagination and
  filtering on CV section list endpoints." Full issue body (problem +
  proposal) passed through as the task text.

## Hub bytes before: 50684

## Investigation (before touching code)
`pick_next` found no PENDING node for this task on the diagram. Grepped
`src/` for the issue's own vocabulary first, to avoid duplicating existing
work:

```
grep -rn "baseFindDocument\|MAX_PAGE_LIMIT\|SORT_FIELD_REGEX" src/services/index.ts src/candidate_profile/BaseController.ts
```

Result: same situation as `add-logout-all-sessions`/#74 — the feature is
**already fully implemented and merged**. `git log --oneline` shows
`1133f1b feat(candidate_profile): add pagination and sort to CV section
list endpoints (#73)`, merged via `33bade6 Merge pull request #106 from
datvt243/feat/issue-73-pagination-filtering` (2026-09-02), currently on
`staging` (`git status`: clean, up to date with `origin/staging`). No
diagram node or evidence note exists for it. `git log -1 --format=%B
1133f1b` includes `Closes #73` — issue was still OPEN on GitHub only
because the merge landed on `staging`, not `main` (same documented
auto-close gap as #74); operator has since closed both #73 and #74
manually via `gh issue close` in this session, ahead of the next
`/release`.

## Diff
No new `src/` changes — the implementation predates this session. Files
already in place (read, not modified, this pass):

| File | Role |
|---|---|
| `src/services/index.ts` | `baseFindDocument` gains `page`/`limit`/`sort` params; opt-in pagination — no `limit` keeps the old full-array behavior; valid `limit` (clamped to `MAX_PAGE_LIMIT = 100`) switches to `{ items, pagination: { page, limit, total, totalPages } }` via `.skip()`/`.limit()` + parallel `countDocuments()` |
| `src/candidate_profile/BaseController.ts` | `baseGetAll` parses `page`/`limit`/`sort` from `req.query`; `sort` validated against `SORT_FIELD_REGEX` (`/^-?[a-zA-Z0-9_.]+$/`) — no `$`, can't smuggle a Mongo operator, invalid value silently dropped rather than erroring |
| `src/config/swagger.config.ts` | Shared `PageParam`/`LimitParam`/`SortParam` + `Pagination` schema |
| `src/routers/api/v1/{education,experience,award,certificate,project,reference}.route.ts` | Wired the new query params into each section's `GET /` + Swagger docs. `generalInformation` excluded on purpose — its `GET /` returns one document per candidate, not a list |
| `src/__tests__/services/baseFindDocument.test.ts`, `src/__tests__/candidate_profile/BaseController.test.ts` | Existing test coverage for pagination/sort behavior |

## Command
```
npx tsc --noEmit
```
Output: clean, no errors (no stdout).

```
npm run build
```
Output:
```
> resume-nodejs-api@1.2.1 build
> tsc && npm run copy

> resume-nodejs-api@1.2.1 copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, no errors.

```
npm test
```
(from `/Users/_david/Workspace/Project/resume/resume-nodejs-api`, copied
verbatim from `doctrine/MEMORY.md`)

Full-suite output (tail):
```
Test Suites: 13 passed, 13 total
Tests:       77 passed, 77 total
Snapshots:   0 total
Time:        4.935 s
Ran all test suites.
```

Targeted re-run of the two files covering this node
(`npx jest src/__tests__/candidate_profile/BaseController.test.ts
src/__tests__/services/baseFindDocument.test.ts`):
```
PASS src/__tests__/services/baseFindDocument.test.ts
  baseFindDocument
    ✓ fails fast when fields is empty (3 ms)
    ✓ findOne: true returns a single document via MODEL.findOne, untouched by pagination (2 ms)
    ✓ findOne: false, no limit -> returns the full array unchanged (backward compatible) (1 ms)
    ✓ findOne: false, with a valid limit -> paginates and wraps data as { items, pagination }
    ✓ clamps limit to the max page size
    ✓ defaults page to 1 when page is missing or invalid
    ✓ applies sort when given, with or without pagination

PASS src/__tests__/candidate_profile/BaseController.test.ts
  baseGetAll
    ✓ passes page/limit/sort through as numbers/string when present (6 ms)
    ✓ omits page/limit/sort when the query string has none (backward compatible) (1 ms)
    ✓ silently drops a sort value that could smuggle a Mongo operator
    ✓ accepts a leading "-" in sort for descending order (1 ms)

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
```

## Acceptance
| Criterion (from issue #73) | Evidence |
|---|---|
| Optional `page`/`limit` on CV section list endpoints, defaulting to returning everything if omitted (backward compatible) | `baseFindDocument`'s `hasPagination` check — no valid `limit` → identical old-behavior `query.exec()` path; test: `'findOne: false, no limit -> returns the full array unchanged (backward compatible)'` |
| `.skip()`/`.limit()` added to the underlying query | `services/index.ts`: `query.skip(skip).limit(safeLimit).exec()` |
| Optional `sort` param | `BaseController.ts` `SORT_FIELD_REGEX` allowlist + `query.sort(sort)`; tests: `'applies sort when given...'`, `'accepts a leading "-" in sort for descending order'`, `'silently drops a sort value that could smuggle a Mongo operator'` |
| No unbounded page size | `MAX_PAGE_LIMIT = 100` clamp; test: `'clamps limit to the max page size'` |
| `npm test` passes | Full suite 77/77, targeted re-run 11/11 — see Command/Output above |
| `npx tsc --noEmit` clean | See Command/Output above |
| `npm run build` clean | See Command/Output above |

## Noticed, not done
- `generalInformation` intentionally has no pagination — it's a
  single-document-per-candidate resource, not a list; matches the
  original proposal's scope (list endpoints only), not a gap.
- This node is a documentation/evidence backfill, not new code — same
  situation as `add-logout-all-sessions`, flagging for the verifier that
  "diff" here means "confirmed pre-existing," per `NodeBeforeCode`'s
  intent even though the code came first in real history.
- GitHub issue #73 was already closed manually by the operator (via
  `gh issue close`) before this backfill note was written — not this
  node's action, recorded here only for the timeline.

## Seal gate
No outward-facing action taken this pass — no `commit`/`push` (nothing to
commit; only `agent-hub/` was written, not outward-facing per
`CLAUDE.md`). The `src/` code itself was already committed and merged in
a prior, separate session (PR #106) — that seal-gate approval, if any,
predates this note and is not re-litigated here.
