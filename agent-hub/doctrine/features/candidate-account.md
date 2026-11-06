# Candidate account

- Status: draft
- Source: backfill from code
- Issues: -
- Anchors: `src/routers/api/v1/candidate.route.ts`, `src/candidate/candidate.controller.ts`, `src/candidate/candidate.service.ts`, `src/candidate/candidate.validate.ts`, `src/models/candidate.model.ts`, `src/config/joi.config.ts`

## Goal
A signed-in candidate reads and edits their own account (personal data,
public visibility, vanity slug, CV file name) and can delete it.

## Behavior
1. All routes require a valid access token (see `auth-session-tokens`).
2. `GET /api/v1/candidate/:email` → 200 with the candidate document for
   that email (password excluded); unknown email → 404.
3. `PUT /api/v1/candidate/update` (full update, `schemaCandidate`):
   `firstName` (≤ 15), `lastName` (≤ 35), `phone` (`phoneRegex`),
   `marital`, `gender` (booleans), `birthday` (number), `address` (≤ 255)
   and `introduction` (localized `{ vi, en }` object) required;
   `socialMedia` optional. Unknown keys → 400. Invalid → 400.
   The updated record is always the caller's own (id taken from the
   token). Success → 200 with the changed fields.
4. `PATCH /api/v1/candidate/update` (`schemaCandidatePatch`): only
   `isPublic`, `slug`, `cvFileName`, `socialMedia`. `slug` is lowercased,
   3–50 chars, must match `slugRegex`; `cvFileName` ≤ 100 chars, no
   `\ / "` or newlines. A slug already used by another candidate → 409.
5. `isPublic` defaults to `true` for every account.
6. `DELETE /api/v1/candidate/` hard-deletes the caller's account and all
   of their general information, education, experience, reference,
   project, certificate, award, application and profile documents, the
   uploaded CV file on disk, and every uploaded section image on disk.
   → 200, `data: null`.
7. Caller's id not found (e.g. account already deleted) on update/delete
   → 400 `common.idNotFound`.

## Acceptance criteria
- `npx jest src/__tests__/candidate/candidate.controller.test.ts src/__tests__/candidate/candidate.service.test.ts src/__tests__/candidate/candidate.validate.test.ts` passes.
- PATCH `slug` to a value another candidate already has → HTTP 409.
- After DELETE, `GET /api/me/<old slug>` → HTTP 404.

## Edge cases
- PATCH with an uppercase slug → stored lowercased.
- Mongoose validation failure on update → 400 `VALIDATION_ERROR` with per-field details.

## Out of scope
- Changing email or password from this route (password: see `auth-password-reset`).

## Open questions
- `GET /candidate/:email` lets any signed-in user read any other candidate's full record (phone, address, birthday, `isPublic`…) by email, even a private one. Intended, or should it be self-only?
- Account delete does not remove the candidate's `Visit` documents and does not revoke their tokens (still-valid tokens hit "id not found"). Intended?
- An unknown/deleted caller id returns 400, not 404. Intended?
- `marital`/`gender` are booleans. Is that the intended data model?
- `GET /candidate/:email` fails open: `candidateQuerySafe` silently drops an email containing `$` (or blank after trim), the query collapses to `{}`, and `findOne({})` returns an arbitrary candidate's record (`candidate.service.ts` `handlerGetInformationByEmail`; the public route guards this with `'email' in safeQuery`, this one doesn't). Should it 404 like the public route?

## Changelog
| Date | Change | Why | Node |
|---|---|---|---|
| 2026-11-06 | Backfilled from code | /spec-backfill | - |
| 2026-11-06 | Reviewer corrections (see `evidence/spec-backfill/2026-11-06/review.md`) | independent review vs code + live | - |
