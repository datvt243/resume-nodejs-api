# 2026-10-18 — fix-public-profile-deleted-entries (verifier SEAL)

Worker: verifier (subagent, dispatched via Agent tool) · Version 0.1.0
Node: `fix-public-profile-deleted-entries` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row)
New PM status: SEALED
Notes audited: `evidence/implementer/2026-10-18/fix-public-profile-deleted-entries-plan.md`, `-diff.md`

## Isolation proof
Spawned fresh via the Agent tool with a task string headed "You are the VERIFIER worker of the agent-hub ... You are a fresh, independent subagent — you did NOT write the diff under review", carrying an adversarial checklist (mutation runs, lint delta, note-vs-disk) the implementer pass never had. No implementation history in this context.

## Reasoning
| Criterion | Evidence |
|---|---|
| Note vs disk | `git diff --stat -- src`: `src/__tests__/candidate_me/index.test.ts \| 24 +`, `src/candidate_me/index.ts \| 6 ++--` — exactly the note's Diff table, no other `src/` file. |
| 1. soft-deleted entries never in public JSON/PDF | `baseQuery = { ...safeCandidateQuery, deletedAt: null }` feeds `sectionQuery` in both branches (with/without profile `_id $in`) inside the single loop over all 7 models (generalInformation, Experience, Education, Reference, Project, Certificate, Award). All 7 models declare `deletedAt: { type: Number, default: null }` (grep `src/models/`); `baseDeleteDocument` sets `deletedAt: Date.now()`, restore sets `null` (`src/services/index.ts:166,196`) — semantics consistent. Public JSON (`index.ts:48`) and public PDF (`public-pdf.ts:76`) both call `handlerGetAboutMe`. Mutation (drop `deletedAt: null`) → `✕ excludes soft-deleted entries from every section, with or without a profile filter`, `Tests: 1 failed, 38 passed, 39 total`. |
| 2. malformed `?profile=` → no Profile query, no 500 | Guard `profileId && /^[a-f\d]{24}$/i.test(profileId)` is the same regex as `resolveVisitProfileId` (`index.ts:287`); both callers narrow `req.query['profile']` to `string` (`index.ts:41`, `public-pdf.ts:73`), so no array/object reaches it, and only 24-hex strings reach `Profile.findOne` (valid ObjectId, no CastError). Mutation (guard → `if (profileId)`) → 3 `✕ treats a malformed profile id (...)`, `Tests: 3 failed, 36 passed, 39 total`. |
| 3. tests + gates | Restored file shasum `a7250bfcaba92ecc81107357adc980aafc012a95` before and after mutations; re-run `npx jest src/__tests__/candidate_me/index.test.ts` → `Tests: 39 passed, 39 total`. Full suite/build from note (verbatim, not truncated): `Tests: 388 passed, 388 total`, `Test Suites: 43 passed, 43 total`, `BUILD_EXIT=0`. Lint re-run `npx eslint . -f json` → total 276 = baseline 276. |
| Command matches doctrine | `npm test`, `npm run build`, `npx jest <file>` — all in `doctrine/MEMORY.md`. |
| comments per code-comments.md | One added `//` single-sentence WHY (`index.ts:118`, CastError 500 vs fallback); no issue refs, no stacked `//`. Note carries the row. |
| Forbidden states | No `CODE_IN_HAVEN` (haven change is the PM row only), no `ADHOC_WORK` (node on active diagram), no `NO_EVIDENCE`, no `EDIT_UNVERIFIED`, no `DIAGRAM_DRIFT` (PENDING → SEALED). |
| Seal gate | No commit/push: HEAD still `29b4257`, changes uncommitted. Note records "none". |
| Proportion (SmallestDiff) | 2 functional lines + 1 comment in src; tests 24 lines covering exactly the two criteria. |

Side effect accepted: owner paths (`fnExportPDF`, `ats-check.ts`) share the helper and now also drop soft-deleted entries — consistent with soft-delete meaning.

## Re-run
partial — re-ran `npx jest src/__tests__/candidate_me/index.test.ts` (two mutations + restored state) and `npx eslint . -f json` count; reason: outward-facing node (public unauthenticated route, data exposure). `npm test`/`npm run build` not re-run (note output verbatim).
