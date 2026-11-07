# 2026-11-08 - public-profile-field-whitelist (plan)
- Worker: implementer · Version: 0.1.0
- Node: `public-profile-field-whitelist` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug grep active + archive: 0 hits; no prior active row for #382
- Task: `/todo #382` — "Public profile payload exposes every candidate field except password"
- Branch: `382-public-profile-payload` (off `staging` @ db07ab7, via `gh issue develop`)

## Hub bytes before
96417

## Feature doc: `doctrine/features/public-profile.md`
Behavior #3 ("the candidate (password, `__v`, timestamps removed)") contradicts the fix. Open question answered 2026-11-07 "Bug — #382" without a field list; the issue asks to decide which personal fields are public → asked the operator (AskUserQuestion, 2026-11-08): "which personal fields should stay public?" — options email / phone / address / birthday+gender+marital → **operator answer: "email, phone, address"**. firstName, lastName, introduction, socialMedia, slug stated as always public in the question. Behavior #3 + Open question answer + Changelog updated in this diff.

## Acceptance
1. `fnGetAboutMe` response `data` keys ⊆ {firstName, lastName, introduction, socialMedia, slug, email, phone, address, generalInformation, experiences, educations, references, projects, certificates, awards}; `_id`, `birthday`, `gender`, `marital`, `cvFile`, `cvFileName`, `emailVerified`, `isPublic` absent.
2. Test in `src/__tests__/candidate_me/index.test.ts` via `npx jest src/__tests__/candidate_me/index.test.ts`.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/candidate_me/index.ts:37-62` `fnGetAboutMe` (fix — public JSON route only)
- `src/candidate_me/index.ts:80` `handlerGetAboutMe` — shared with `index.ts:334` (owner export), `ats-check.ts:40`, `public-pdf.ts:74` → unchanged
- `src/candidate_me/public-pdf.ts:77-80` — uses `cvFileName` only for the attachment filename; PDF templates use no birthday/gender/marital/cvFile (`grep` `src/services/createPDF*.ts createDocx.ts`) → out of the payload, unchanged
