# search-in-profile-only — verify: SEAL

- Node: `search-in-profile-only` (#397, branch `397-public-search-should`)
- Note graded: `evidence/implementer/2026-11-09/search-in-profile-only.md` (plan: `...-plan.md`)
- Verdict: **SEAL**

## Isolation proof
Spawned via Agent tool, description "verify_seal search-in-profile-only #397", 2026-11-09 by /todo pass 2, spawn=fresh. Did not write the diff; read the note only, not the diff.

## Re-run: none
Audit-only (default). Outputs in the note are verbatim summary lines, no truncation markers, commands match `doctrine/MEMORY.md`.

## Criteria
| Criterion | Evidence in note | OK |
|---|---|---|
| 1. exp/edu hit only if a same-candidate non-deleted profile lists it | new test `only matches entries listed by a non-deleted profile of the same candidate`: `exp-out`, `victim` (foreign profile) excluded; `exp-in`, `edu-in` kept; Profile filter `{ deletedAt: null, candidateId: { $in } }` asserted | yes |
| 2. general info only with ≥1 non-deleted profile | same test: `gen-with-profile` kept, `gen-no-profile` excluded | yes |
| 3. excluded candidate not returned nor counted | same filter feeds `find` + `countDocuments` (asserted equal) | yes |
| 4. one-file test | `Tests: 15 passed, 15 total` | yes |
| `npm test` no new failures | 2 suites / 5 tests failed, reproduced identically with changes stashed (tokenExpiry local `.env`, atsPdfIntegration no Chrome); same set as `paginate-visits` | yes |
| Typecheck (`inside Build`) | `npm run build` exit 0, copy step ran | yes |
| Lint ≤ 274 baseline, none in changed files | `274 problems`, grep for changed files → none | yes |
| comments per code-comments.md | row present: WHY-only `/** */` + 2 test `//`, no issue refs | yes |
| Feature doc criterion (3 candidate_me suites) | covered by `npm test` (only 2 unrelated suites fail) | yes |

## Feature doc
`doctrine/features/public-profile.md` — Behavior 6 updated; `## Feature doc changed` backed by the operator's recorded answer to open question 3 (2026-11-07, "#397"); Changelog row present. Doc is already `verified` (not draft) → Status left as is (step 11e n/a).

## Forbidden states
ADHOC_WORK no (node on diagram) · NO_EVIDENCE no · EDIT_UNVERIFIED no (outputs cited) · CODE_IN_HAVEN no · DIAGRAM_DRIFT no (PM updated here).

## Seal gate / proportionality
Not outward-facing (no deploy/push). Diff limited to `search.ts`, its test, `api.md` row, feature doc — proportional.

## Supersedes / Still open
none / none — no other active row cites #397.

## Doctrine proposal
none.

## For the operator (not a REOPEN reason)
Design choice: a candidate with zero non-deleted profiles is not searchable at all (general info counts only with ≥1 profile; default profile is created on first `GET /api/v1/profile`). Consistent with the operator answer and plan criterion 2, but worth confirming. Noticed-not-done: profile writes don't ownership-check `experienceIds`/`educationIds` — candidate for its own node.

## Collapse
Row archived to `haven/diagrams/dev-loop-archive.md`; active row → pointer; oldest pointer (`atomic-token-consume`) trimmed to keep 20.
