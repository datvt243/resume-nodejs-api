# 2026-11-06 - cv-filename-lang-suffix (plan)
- Worker: implementer · Version: 0.1.0
- Node: `cv-filename-lang-suffix` in `haven/diagrams/dev-loop.prime-mermaid.md` (new, IN_PROGRESS; slug not in archive)
- Task: `/todo #375` — "feat(download): thêm hậu tố ngôn ngữ _VI/_EN vào tên file CV" (issue body = acceptance)

## Hub bytes before: 83637

## Acceptance (from issue #375)
1. `download-pdf?lang=en` → `..._EN.pdf`; no lang / `lang=vi` → `..._VI.pdf`.
2. Same for ATS PDF, public PDF, DOCX.
3. Base already ending `_VI`/`_EN` (any case, after slugify) → not appended again.
4. `cvFilename` tests updated (vi/en, with/without cvFileName, already suffixed). Swagger `cvFileName` description updated.

## Acceptance criteria clarified
none — criteria are concrete; mapped to `npx jest` on the 3 touched test files + `npm test` + `npm run build`.

## Code anchors (grepped)
- `src/services/createPDF.ats.ts:396` `cvFilename` (+ `:481` ATS call)
- `src/services/createPDF.ts:85` classic call — `createCV` has no lang today
- `src/services/createDocx.ts:243` DOCX call — `createCVDocx` has no lang today
- `src/candidate_me/public-pdf.ts:80` public call (lang already resolved)
- `src/candidate_me/index.ts:354,364` controller — lang resolved at :333, not passed to classic/DOCX
- `src/config/swagger.config.ts:155`

## Design
`lang` goes in `cvFilename`'s object arg as a REQUIRED field (not a defaulted 3rd positional as the issue sketches) so tsc forces every caller to pass the resolved lang; `createCV` options + `createCVDocx` gain `lang` defaulting to `vi`.

## Blockers: none
