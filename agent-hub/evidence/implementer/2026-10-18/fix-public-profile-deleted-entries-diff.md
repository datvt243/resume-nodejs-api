# 2026-10-18 — fix-public-profile-deleted-entries (implementer diff)

Worker: implementer · Version 0.1.0
Node: `fix-public-profile-deleted-entries` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row, PENDING)
Task (verbatim): `/todo #261` → issue #261 "fix(public-profile): exclude soft-deleted CV entries + ignore malformed ?profile= id"
Plan note: `evidence/implementer/2026-10-18/fix-public-profile-deleted-entries-plan.md`

## Hub bytes before: 237127

## Diff
| File | Why |
|---|---|
| `src/candidate_me/index.ts` L118-119 | `profileId` must match `/^[a-f\d]{24}$/i` (same guard as `resolveVisitProfileId` L285) before `Profile.findOne` — a malformed id now skips the lookup → `profileDoc` null → unfiltered CV, instead of CastError 500. |
| `src/candidate_me/index.ts` L175-176 | `baseQuery = { ...safeCandidateQuery, deletedAt: null }` used by all 7 section `find`s, with or without the profile `_id $in` filter. `deletedAt: null` also matches docs missing the field (Mongo null semantics), same as `search.ts`. |
| `src/__tests__/candidate_me/index.test.ts` +24 | `it.each` 3 malformed ids (`abc`, 23-hex, 24-hex+`z`) → success, no `Profile.findOne`, unfiltered Education query; one test asserting every one of the 7 models' `find` gets `deletedAt: null`, without and with a resolved profile. |

## Command
- `npx jest src/__tests__/candidate_me/index.test.ts` (fix stashed, then restored) — prove new tests fail pre-fix
- `npm test`
- `npm run build` (Typecheck row: tsc inside build)
- `npx eslint . -f json` total count vs baseline 276 (last seal note)

## Output
Pre-fix (`git stash push src/candidate_me/index.ts`):
```
      ✕ treats a malformed profile id (abc) like no profile, without querying Profile
      ✕ treats a malformed profile id (507f1f77bcf86cd79943909) like no profile, without querying Profile (8 ms)
      ✕ treats a malformed profile id (507f1f77bcf86cd799439099z) like no profile, without querying Profile
      ✕ excludes soft-deleted entries from every section, with or without a profile filter (1 ms)
Tests:       4 failed, 35 passed, 39 total
```
Post-fix full run:
```
Test Suites: 43 passed, 43 total
Tests:       388 passed, 388 total
TEST_EXIT=0
> resume-nodejs-api@1.13.0 copy
> cp -R ./src/views ./src/public ./dist/

BUILD_EXIT=0
lint total 276
```
First lint run was 280: the 4 new assertions used `expect(MODEL.X.find)` → `@typescript-eslint/unbound-method` (lines 209,210,218,224). Switched those to `jest.mocked(MODEL.X).find` (pattern already at test L95) → 0 hits in L203-226, total back to 276. `npx tsc --noEmit -p .` printed nothing.

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. soft-deleted entries never in public JSON/PDF | All 7 `find`s receive `deletedAt: null` — test "excludes soft-deleted entries…" ✓, failed pre-fix. Public PDF (`public-pdf.ts:76`) uses the same `handlerGetAboutMe`, so covered by the same query. |
| 2. `?profile=<malformed>` → full CV, no 500 | 3 `it.each` cases ✓ (`success: true`, `Profile.findOne` not called, unfiltered Education query); all 3 failed pre-fix. |
| 3. tests + gates | `Tests: 388 passed, 388 total`, `Test Suites: 43 passed, 43 total`, BUILD_EXIT=0, lint 276 = baseline 276. |
| comments per code-comments.md | One `//` single-sentence WHY added (L118: CastError 500 instead of fallback). No `(#N)` refs. The existing JSDoc above ("an invalid/foreign/deleted profile id is treated the same as no profile") is now accurate, left unchanged. |
| pdf-export-standard | n/a — no export/renderer code touched; only which rows feed the renderer changes. |

## Noticed, not done
- Owner paths (`fnExportPDF` L338, `ats-check.ts:44`) share `handlerGetAboutMe`, so the owner's own export also drops soft-deleted entries now — intended (deleted = not in CV), noted for the verifier.
- Public-PDF in-memory cache is keyed by sha256 of the resolved data, so a cached PDF containing a deleted entry will not be served again: the new data hashes differently. Process-local cache, cleared on restart/deploy anyway.
- Active diagram file is ~161KB, well over the ~15KB archive threshold — separate archive pass, not this node.

## Seal gate
None — no commit/push. Branch `261-fix-public-profile` (pre-existing link) fast-forwarded to staging locally only.
