# 2026-09-14 — add-vanity-slug-public-profile

- **Worker**: implementer
- **Version**: 0.1.0
- **Node**: `add-vanity-slug-public-profile` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- **Task** (verbatim): `/todo #120` → "Implement GitHub issue #120: Vanity
  slug for public profile (/api/me/:slug) —
  https://github.com/datvt243/resume-nodejs-api/issues/120"

## Hub bytes before

64755 — reconstructed, not measured strictly before the diagram edit: the
node row was appended first (per the DRAFT→pick_next loop in
`dev-loop.prime-mermaid.md`'s own flowchart), then `/hub-tokens` was run
(total 65720 B). 64755 = 65720 minus the 965 B the new row itself added
(measured directly from the file). Process note for my own `MEMORY.md`:
run `/hub-tokens` *before* appending the draft row next time, not after +
subtract.

## Diff

| File | Why |
|---|---|
| `src/models/candidate.model.ts` | New `slug` field — unique, sparse, lowercase, URL-safe, same convention as the existing `email` field |
| `src/utils/slug.ts` (new) | `slugify()` + `generateUniqueCandidateSlug()` — DB-uniqueness-checked with bounded retries |
| `src/auth/auth.service.ts` | `handlerRegister` auto-generates the slug (from email local-part — no name is collected at register) |
| `src/config/regex.config.ts` | New `slugRegex`, matching the model's own pattern |
| `src/config/joi.config.ts` | New `slug` Joi schema (lowercased before pattern check) |
| `src/candidate/candidate.validate.ts` | `slug` added to `schemaCandidatePatch` — editable via existing `PATCH /api/v1/candidate/update` |
| `src/utils/querySafe.ts` | `slug` added to `candidateQuerySafe`'s allow-list (needed for both the lookup query and `whitelistSelect` on the update response) |
| `src/candidate_me/index.ts` | `handlerGetAboutMe` resolves by `slug` first, falls back to `email` (backward-compat with existing shared links) |
| `src/routers/index.ts` | Swagger doc text updated (route path/param name unchanged — `:email` still accepts either) |
| `src/__tests__/auth/auth.service.test.ts` | Updated the register test's `CandidateModel.findOne` mock to account for the new slug-uniqueness lookup — this genuinely failed red first (see Output) |

Conflict-on-duplicate-slug during PATCH needed **no new code**: the
existing generic Mongo duplicate-key (`code 11000`) → `ConflictError`
path in `src/utils/helper.ts::handleError` already covers it, since
`slug` now carries a real unique index. `fnExportPDF`/download-pdf
untouched — already keyed off `req.user._id`.

## Command

```
npm run build
npm test
```
(from `doctrine/MEMORY.md` — repo-root path note: the doc says
`/Users/_david/Workspace/Project/ResumeAPI/backend`, which does not exist
on this machine; the actual repo root is
`/Users/_david/Workspace/Project/resume/resume-nodejs-api` (matches `git
remote get-url origin` → `github.com/datvt243/resume-nodejs-api`, the same
repo `doctrine/domains/PROJECT.md` already documents). Commands run
verbatim from that real root. Flagging as a correction, not guessing
around it — see `doctrine/MEMORY.md`'s "What this is" section, which
needs its path updated.)

## Output

`npm run build` (verbatim tail):
```
> resume-nodejs-api@1.4.0 build
> tsc && npm run copy


> resume-nodejs-api@1.4.0 copy
> cp -R ./src/views ./src/public ./dist/
```

`npm test` — 1st run, genuinely RED (before the test-mock fix, verbatim):
```
FAIL src/__tests__/auth/auth.service.test.ts
  ● auth.service › handlerRegister › should register successfully with new email

    TypeError: candidate_model_1.default.findOne(...).select is not a function

      36 |   for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      37 |     const candidate = `${baseSlug}-${randomSuffix()}`;
    > 38 |     const exists = await CandidateModel.findOne({ slug: candidate }).select('_id').exec();
         |                                                                      ^
      39 |     if (!exists) return candidate;
      40 |   }

Test Suites: 1 failed, 13 passed, 14 total
Tests:       1 failed, 82 passed, 83 total
```

`npm test` — 2nd run, after fixing the mock (verbatim tail):
```
PASS src/__tests__/auth/auth.service.test.ts
  auth.service
    isEmailAlreadyExists
      ✓ should return true if email exists (2 ms)
      ✓ should return false if email does not exist
    handlerRegister
      ✓ should register successfully with new email (1 ms)
      ✓ should fail if email already exists
    ...

Test Suites: 14 passed, 14 total
Tests:       83 passed, 83 total
Snapshots:   0 total
Time:        3.563 s, estimated 5 s
Ran all test suites.
```

## Acceptance

| Criterion (from issue #120) | Evidence |
|---|---|
| `slug` field on `Candidate` — unique, sparse, lowercase, URL-safe, auto-generated | `src/models/candidate.model.ts` diff above; `src/auth/auth.service.ts` calls `generateUniqueCandidateSlug` in `handlerRegister`; test assertion `slug: expect.stringMatching(/^new-[a-z0-9]+$/)` passing in `Tests: 83 passed, 83 total` |
| `GET /api/me/:slug` (or extend existing handler) resolves by slug first, falls back to email | `src/candidate_me/index.ts::handlerGetAboutMe` diff above (slug query first, email query only if slug lookup returns no document) |
| Slug editable via `PATCH /api/v1/candidate/update`, uniqueness → `ConflictError` on collision | `schemaCandidatePatch` diff (`candidate.validate.ts`); conflict path is the pre-existing `handleError` `code 11000` branch, unmodified, now reachable because `slug` has a real unique index — reasoned, not live-DB-tested (no Mongo instance in this pass, see Noticed below) |
| `fnExportPDF`/download-pdf unaffected | No changes made to `fnExportPDF`; it still calls `handlerGetAboutMe(email, lang)` with the authenticated user's real email — functionally identical (slug-lookup miss + email-lookup hit), confirmed by reading the unchanged call site |
| Build clean | `npm run build` output above — no tsc errors |
| Tests pass | `Tests: 83 passed, 83 total` (2nd run output above) |

## Noticed, not done

- `POST /api/me/:email/visit` (visit tracking) left email-only — not in
  the issue's proposal bullets. A slug-only shared link won't record a
  visit. Flagged as a follow-up, own node if picked up.
- The `slug`-unique-index / `ConflictError` path was reasoned from
  existing, unmodified code (`handleError`'s `code 11000` branch already
  has its own test coverage elsewhere in the suite) rather than
  live-exercised against a real MongoDB unique-index violation in this
  pass — no Mongo instance was started. If the verifier has DB access,
  worth a live PATCH-to-a-taken-slug check.
- `doctrine/MEMORY.md`'s repo-root path is stale (points to a directory
  that no longer exists on this machine) — see Command section above.
  Recommend updating it separately; not touched here since it's a
  doctrine correction, not part of issue #120's scope.
- `haven/diagrams/dev-loop.prime-mermaid.md` is now 19412 B, over the
  hub-tokens 15KB archive threshold (7 real SEALED rows not yet moved to
  `dev-loop-archive.md`, pre-existing before this task, not caused by it —
  this task's own new row is PENDING, not SEALED, so it isn't itself an
  archive candidate). Separate explicit action, not done here.

## Seal gate

Operator approved the `src/` diff shown in-session before this note was
written ("approve, go ahead"). No other outward-facing action (no
commit/push) taken.
