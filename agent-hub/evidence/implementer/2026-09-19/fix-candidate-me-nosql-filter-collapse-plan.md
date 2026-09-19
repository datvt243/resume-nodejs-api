# 2026-09-19 — fix-candidate-me-nosql-filter-collapse (plan)

- Worker: implementer
- Version: 0.1.0
- Node: `fix-candidate-me-nosql-filter-collapse` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- Task: Fix NoSQL-filter-collapse bug in src/candidate_me/index.ts
  (handlerGetAboutMe ~line 58, and handlerRecordVisit ~line 161): when the
  :email/slug identifier from the URL contains a character QuerySafe
  rejects (e.g. "$"), QuerySafe strips it and the resulting filter becomes
  {} instead of failing closed. Candidate.findOne({}) / the visit-record
  equivalent then matches an arbitrary candidate, leaking that unrelated
  candidate's full profile to an anonymous caller on GET /api/me/:email,
  and can record a Visit against the wrong candidateId. Fix: when
  QuerySafe rejects/empties the identifier, the lookup must fail closed
  (404/NotFoundError), never fall through to an unfiltered query. Found
  by /code-review on 2026-09-19 (finding 1 of 10, most severe). GitHub
  issue #135.

## Hub bytes before: 64581

## Root cause
`src/utils/querySafe.ts` `QuerySafe.safeQuery(baseQuery, userInput)`
silently omits any `userInput` key that fails its filters (contains `$`,
contains `javascript:`, empty after trim) — it never throws. Every call
site in `src/candidate_me/index.ts` passes `baseQuery = {}` and assumed
the returned object always carries the field it asked for. When a caller
supplies a rejected value, the "sanitized" query is just `{}`, and the
following `Model.findOne({})` matches the first document in the
collection instead of failing.

## Anchors
- `src/candidate_me/index.ts:58` — `handlerGetAboutMe`, slug lookup
- `src/candidate_me/index.ts:61` — `handlerGetAboutMe`, email fallback
- `src/candidate_me/index.ts:161` — `handlerRecordVisit`, email lookup
- `src/utils/querySafe.ts:14` — `QuerySafe.safeQuery` (root cause, not
  touched — see Noticed, not done)

## Plan
At each of the 3 anchors, check the sanitized query object actually
contains the field key before querying (`'slug' in safeSlugQuery`, etc.)
— if the key is missing, QuerySafe rejected the input, so treat as
not-found without touching the DB. Smallest diff: 3 call sites in one
file, no change to `QuerySafe` itself (its silent-drop behavior is relied
on elsewhere and changing it would be a wider blast radius than this
node's scope).
