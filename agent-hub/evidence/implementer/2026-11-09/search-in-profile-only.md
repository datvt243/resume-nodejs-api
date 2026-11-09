# search-in-profile-only — implement

- Task: #397 Public search should not match entries outside every profile. Branch `397-public-search-should` (base `staging` @ 01fa125)
- Node: `search-in-profile-only` (PENDING, `haven/diagrams/dev-loop.prime-mermaid.md`, last row)
- Plan: `evidence/implementer/2026-11-09/search-in-profile-only-plan.md`
- Status: sealed_pending_verifier

## Hub bytes before: 96170

## Feature doc: agent-hub/doctrine/features/public-profile.md
## Feature doc changed: Behavior 6 now says search only matches entries in ≥1 non-deleted profile of the candidate (experience/education: a same-candidate profile lists the id; general information: candidate has ≥1 non-deleted profile). Changelog row 2026-11-09 (operator answer #397, node search-in-profile-only). Applies the operator's recorded answer to open question 3 ("Change: search must only match entries that belong to at least one of the candidate's profiles — #397").

## Diff (src + docs)
- `src/candidate_me/search.ts` `handlerSearchPublicProfiles`: Experience/Education matches switched from `distinct('candidateId', f)` to `find(f).select({candidateId:1}).lean()` (same filters) so each hit keeps its `_id`. Then one `Profile.find({ deletedAt: null, candidateId: { $in: <all matched candidate ids> } }).select({candidateId, experienceIds, educationIds}).lean()`. A general-info hit survives only if its candidate has a returned profile; an experience/education hit only if `"<entry.candidateId>:<entry._id>"` is in the set built from each profile's `candidateId` × its `experienceIds`/`educationIds`. Candidate `find`/`countDocuments` filter otherwise unchanged (`_id: { $in: matchedIds }`, `.flat()` dropped since the list is already flat). File-overview JSDoc gains one clause.
- Why pair on candidateId: `profile.validate.ts` does not ownership-check `experienceIds`/`educationIds`, so another candidate's profile could list a foreign entry id; pairing makes that never count. (Public view `?profile=` already filters by candidateId too, `src/candidate_me/index.ts:195`.)
- Why general information needs a profile: the Profile model has no general-info id list and `?profile=` views always include general information (Behavior 4), so it belongs to every profile — "in ≥1 profile" ⇔ ≥1 non-deleted profile exists.
- `.claude/rules/api.md:77` `/api/me/search` row: added the profile-membership rule.
- Tests `src/__tests__/candidate_me/search.test.ts`: mocks moved from Experience/Education `distinct` to `find` chains, `Profile.find` mocked; `mockDb` default builds one profile per candidate covering every matched entry so existing cases keep their meaning. New case `only matches entries listed by a non-deleted profile of the same candidate`: general hit with/without profile, listed vs unlisted experience, a foreign profile listing a victim's entry, listed education → asserts the Profile filter and candidate `$in: ['gen-with-profile', 'exp-in', 'edu-in']`.
- Only caller of `handlerSearchPublicProfiles`: `fnSearchPublicProfiles` in the same file (grep of `src/` outside tests).

## Acceptance
| Criterion | Evidence |
|---|---|
| 1. exp/edu hit only if a same-candidate non-deleted profile lists it | new test ✓: `exp-out` (profile lists other id) and `victim` (only `attacker`'s profile lists it) excluded; `exp-in`, `edu-in` kept; `mockProfileFind` called with `{ deletedAt: null, candidateId: { $in: [...] } }` |
| 2. general-info hit only with ≥1 non-deleted profile | same test: `gen-with-profile` kept, `gen-no-profile` excluded |
| 3. excluded candidate not returned nor counted | same filter object feeds `Candidate.find` and `countDocuments` (asserted equal in `only ever asks Mongo…` ✓) |
| Feature doc criterion: `npx jest src/__tests__/candidate_me/index.test.ts …search.test.ts …public-pdf.test.ts` | covered by `npm test` run below (all `candidate_me` suites pass; only 2 unrelated suites fail) |
| `npx jest src/__tests__/candidate_me/search.test.ts` | `Test Suites: 1 passed, 1 total` / `Tests: 15 passed, 15 total` |
| `npm test` | `Test Suites: 2 failed, 64 passed, 66 total` / `Tests: 5 failed, 651 passed, 656 total`. Pre-existing: with `src` + `api.md` stashed, `npx jest src/__tests__/auth/tokenExpiry.test.ts src/__tests__/services/atsPdfIntegration.test.ts` → `Test Suites: 2 failed, 2 total` / `Tests: 5 failed, 2 passed, 7 total` — same 5. Causes: tokenExpiry `Expected: 3600 / Received: 10800` (local `.env` TOKEN_EXP_IN); atsPdfIntegration `Could not find Chrome (ver. 127.0.6533.88)`. Neither touches search. Same set as `paginate-visits` note. |
| Typecheck (`inside Build`) | `npm run build` → exit 0, last lines `> resume-nodejs-api@2.7.2 copy` / `> cp -R ./src/public ./dist/` |
| Lint ≤ 274, none in changed files | `npm run lint` → `✖ 274 problems (274 errors, 0 warnings)`; `grep -E "search\.ts|search\.test\.ts"` on the output → no lines |
| comments per code-comments.md | Added one `/** */` (5 lines, WHY: why general info only needs a profile, why the `candidateId:entryId` key) above the profile check, one test `//` (WHY of the mockDb default) and one test `//` on the foreign-profile fixture. Extended the file-overview JSDoc by one clause. No issue refs, no restating. |

## Supersedes: none
No other not-yet-SEALED row on the active diagram cites #397.

## Still open: none

## Noticed, not done
- `profile.validate.ts` / profile service accept `experienceIds`/`educationIds` of other candidates (no ownership check). Harmless for the public view and now for search (both pair on candidateId), but worth its own node.
- Profile lookup is a second round-trip after the matches; fine at current scale, a `$lookup` aggregation would fold it if search gets hot.

## Design choice for the verifier/operator
General information is treated as belonging to every profile (it has no id list and every `?profile=` view shows it), so a candidate with zero non-deleted profiles is never found via `positionDesired`/`professionalSkills`. Candidates get a default profile on first `GET /api/v1/profile` (`ensureDefaultProfile`), so a candidate who never opened the profile list is unsearchable until they do.
