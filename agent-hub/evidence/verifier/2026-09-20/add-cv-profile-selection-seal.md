# 2026-09-20 — add-cv-profile-selection — verifier verdict

- Worker: verifier
- Node: `add-cv-profile-selection`
- New PM status: **SEALED**

## Isolation proof
Dispatched fresh via the Agent tool by a separate coordinating session
that performed the implementation. This subagent has no memory of
writing the diff under review — first tool call in this run was `git
status`/reading the implementer's evidence notes, not any prior
authorship. NeverVerifyOwnWork holds.

## Reasoning
Authorized (per this dispatch's recipe exception) to read the real
diff directly, not just the note, since this is the only uncommitted
work in the repo. Confirmed `git status --short` matches exactly the
file list in the diff note (no extra/missing files).

1. **Model + CRUD routes, same shape as other CV sections** — read
   `src/models/profile.model.ts`, `profile.validate.ts`,
   `profile.service.ts`, `profile.controller.ts`, `profile.route.ts`
   side-by-side with `application.model.ts`/`application.route.ts`:
   structurally identical pattern (`createCrudService`/
   `createCrudController`, same 5 routes, same soft-delete field). MET.
2. **Default "Tổng hợp" profile, no data loss** — `ensureDefaultProfile`
   in `profile.service.ts` calls `ProfileModel.countDocuments(...)`,
   returns early if `> 0`, otherwise queries all 6 section models
   (`Education`/`Experience`/`Project`/`Certificate`/`Award`/`Reference`)
   for `_id`s and creates one profile with all of them. Confirmed via
   `profile.service.test.ts` (2 tests, both read, both pass). MET.
3. **`?profile=` filters sections; omitted → unchanged** — read
   `candidate_me/index.ts` in full. `profileId` only resolves when the
   raw query value is a `string` (non-string → `undefined`, same as
   omitted). Resolution goes through `idQuerySafe.safeQuery` (rejects
   `$`/`javascript:`); only queries `Profile.findOne` when `'_id' in
   safeProfileIdQuery`. Rejected/unresolved id → `profileDoc` stays
   `null` → `sectionQuery` falls back to the unfiltered
   `safeCandidateQuery`, fail-closed not fail-open, consistent with the
   #135 fix pattern this exact file already carries. 4 new tests in
   `candidate_me/index.test.ts` cover: no `Profile` query when omitted,
   correct `$in` filtering when resolved (`generalInformation` stays
   unfiltered), fallback when unresolved, and no `Profile` query for a
   `$`-injected id. All read, all pass. MET.
4. **Ownership enforced (IDOR-safe)** — CRUD: `verifyToken.middleware.ts`
   lines 61-63 force `req.body.candidateId = _id` (authenticated user),
   overwriting client input — read directly, confirmed. Public filter
   path: `Profile.findOne({ ...safeProfileIdQuery, candidateId: _id,
   deletedAt: null })` — `candidateId` here is the just-resolved
   candidate's own ObjectId, not user input, so a foreign candidate's
   profile id can never resolve. MET.
5. **Build clean, tests pass** — did NOT rely on the note alone (its
   prose said "added 2 new suites" while only 1 new suite file exists;
   the actual counts are internally consistent — 21+1=22 suites,
   121+2(profile.service.test.ts)+4(candidate_me)=127 tests — but the
   prose wording was off, so re-ran independently for confidence).
   Independently ran `npm test` from repo root:
   `Test Suites: 22 passed, 22 total` / `Tests: 127 passed, 127 total`
   — matches the note exactly. Independently ran `npm run build`:
   `tsc && npm run copy` exited clean, no errors. MET.
6. **SmallestDiff / proportion** — `git diff --stat` + untracked file
   list matches exactly what the note claims, nothing extra. Confirmed
   `fnExportPDF`/`/download-pdf` path in `candidate_me/index.ts` was
   NOT touched (still calls `handlerGetAboutMe(email, lang)` with no
   3rd arg) — consistent with the issue's own text calling that
   optional/frontend-side. No unrelated files changed. MET.

Forbidden states scanned: no ADHOC_WORK (node existed on the diagram
before this dispatch), no NO_EVIDENCE, no EDIT_UNVERIFIED (re-ran both
commands myself), no CODE_IN_HAVEN (only `.md` touched under
`agent-hub/`), no DIAGRAM_DRIFT (PM status now updated to match).

## Re-run
**Partial** — re-ran `npm test` and `npm run build` myself in the
existing working tree (not audit-only), beyond the default for a
non-outward-facing node, because the note's own prose contained an
internal inconsistency ("2 new suites" vs. the 1 new suite file
actually listed) and this node touches the same public,
unauthenticated route class as the #135 NoSQL-filter-collapse bug.
Did not use an isolated worktree (no concurrent session was mutating
this working tree, unlike the #135 verification).

## Missing
N/A — SEAL.
