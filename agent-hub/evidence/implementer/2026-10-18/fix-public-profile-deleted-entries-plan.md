# 2026-10-18 — fix-public-profile-deleted-entries (implementer plan)

Worker: implementer · Version 0.1.0
Node: `fix-public-profile-deleted-entries` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row, PENDING — appended this pass)
Task (verbatim): `/todo #261` → issue #261 "fix(public-profile): exclude soft-deleted CV entries + ignore malformed ?profile= id"

## Hub bytes before: 237127

## pick_next output
- node: `fix-public-profile-deleted-entries`
- diagram: `dev-loop.prime-mermaid.md`
- current_state: PENDING
- acceptance:
  1. All 7 section queries in `handlerGetAboutMe` filter `deletedAt: null` → soft-deleted entries never reach public JSON / public PDF (both go through this helper).
  2. `?profile=<malformed>` (not 24-hex) → no `Profile.findOne`, unfiltered CV, no 500.
  3. Tests cover both; `npm test` + `npm run build` green; lint delta 0.
- files: `src/candidate_me/index.ts` (L117-125 profile lookup, L163-176 section query), `src/__tests__/candidate_me/index.test.ts`
- blocked_by: null (no `<<FILL>>` in doctrine/MEMORY.md)

## Anchors (grep, real)
- `src/candidate_me/index.ts:118` `if (profileId) {` — no shape guard before `Profile.findOne({ _id })` (CastError on `abc`).
- `src/candidate_me/index.ts:174` `sectionQuery` = candidateId (+ `_id $in`) only, no `deletedAt`.
- Precedent: `resolveVisitProfileId` L285 `/^[a-f\d]{24}$/i`; `search.ts:57-59,84` filter `deletedAt: null`.
- Callers of `handlerGetAboutMe`: `fnGetAboutMe` (public JSON), `public-pdf.ts:76` (public PDF), `fnExportPDF` L338 (owner export), `ats-check.ts:44` (owner ATS check). Owner paths also stop showing soft-deleted entries — intended (a deleted entry should not be in the owner's own exported CV either).

## Branch
Linked branch `261-fix-public-profile` already existed (0 own commits, 2 behind staging) → checked out, `git merge --ff-only staging` (local only).
