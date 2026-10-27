# 2026-10-27 - fix-ats-summary-html (plan)

- Worker: implementer · Version: 0.1.0
- Node: `fix-ats-summary-html` in `haven/diagrams/dev-loop.prime-mermaid.md`
- Task (verbatim, GitHub #326): "ATS PDF template prints raw <p> tags in the summary section" — fix: run the summary (and any other rich-text field) through the same HTML-to-text/render step the experience descriptions use.
- Branch: `326-ats-pdf-template` (from freshly pulled `staging` @ 3fc4c90, linked via `gh issue develop`)

## Hub bytes before: 81191

## Node
No prior node for #326 / slug (grep 0 in active + archive). New row appended, PENDING.

## Findings
- `src/services/createPDF.ats.ts:361` renders `escapeHtml(content.summary)` inside `<p class="summary">` → CKEditor `<p>…</p>` becomes literal text.
- Descriptions use `sanitizeDescription` (`:40`, xss allow-list, rule 6) → render clean.
- `AtsContent.summary` read nowhere else in `src/` (grep).
- Other ATS free-text: `headline` (career, plain input), contact, names — escaped plain text, not rich-text. Only `introduction` is CKEditor-authored in this template.

## Design
`<p class="summary">${escapeHtml(...)}</p>` → `<div class="summary">${sanitizeDescription(...)}</div>` (div: `<p>` inside `<p>` is invalid HTML). One test: summary `<p>…</p><script>` → no `&lt;p&gt;`, no `<script>`, text present.

## Anchors
`src/services/createPDF.ats.ts:361`, `src/__tests__/services/createPDF.ats.test.ts:132-200`.

## Blockers: none
