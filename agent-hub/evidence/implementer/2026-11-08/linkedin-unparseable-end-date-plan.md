# 2026-11-08 - linkedin-unparseable-end-date (plan)
- Worker: implementer · Version: 0.1.0
- Node: `linkedin-unparseable-end-date` (`haven/diagrams/dev-loop.prime-mermaid.md`, new row, IN_PROGRESS) — slug + `#401` grep active + archive: 0 hits
- Task: `/todo #401` — "LinkedIn import: an unparseable end date is treated as \"current\""
- Branch: `401-linkedin-import-an` (via `gh issue develop`, from `staging` @ d14595a)

## Hub bytes before
96329

## Feature doc: `doctrine/features/cv-file-upload-import.md`
Open question answered by operator 2026-11-07: "Bug: blank endDate + isCurrent false — #401". Behavior #5 said "`isCurrent = true` when there is no end date" → doc updated.

## Acceptance
1. Behavior #5 (updated): present-but-unparseable end date → `endDate: null`, `isCurrent: false`; blank or "Present" → `isCurrent: true` (unchanged).
2. `npx jest src/__tests__/candidate/parseLinkedInExport.service.test.ts` passes; the new test fails on the old parser.
3. `npm test` no new failures vs staging; `npm run build` clean; `npm run lint` ≤ 274, none new in touched files.

## Anchors
- `src/candidate/parseLinkedInExport.service.ts:54-61` (`parseLinkedInDate`, returns null for blank/"Present"/unparseable), `:88-118` (two `isCurrent: !endDate`)
