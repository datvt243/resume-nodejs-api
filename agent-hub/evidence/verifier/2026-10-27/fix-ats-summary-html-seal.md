# 2026-10-27 - fix-ats-summary-html (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `fix-ats-summary-html` in `haven/diagrams/dev-loop.prime-mermaid.md` (GitHub #326, branch `326-ats-pdf-template`)
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`, pointer left in place)
- Notes graded: `evidence/implementer/2026-10-27/fix-ats-summary-html-plan.md`, `evidence/implementer/2026-10-27/fix-ats-summary-html-diff.md`

## Isolation proof
Fresh Agent-tool subagent spawned by `/todo #326` round 2 with a dispatch prompt titled "agent-hub VERIFIER worker ... You did not write this diff", carrying a PONYTAIL-mode SubagentStart hook context the implementer pass did not have. No implementation history in this context; the diff was never opened (graded from the two notes only).

## Reasoning
- (1) summary via `sanitizeDescription`, no `&lt;p&gt;`: diff table row `src/services/createPDF.ats.ts:361` (`escapeHtml` → `sanitizeDescription`, `<p>` → `<div>`); "createPDF.ats.test.ts: Tests: 19 passed, 19 total"; real `pdf-parse` extraction "after fix" shows `Frontend Developer với hơn 4 năm...` with no `<p>`, "before fix (staging)" shows the literal `<p>...</p>` — bug reproduced and fixed through the real extraction path.
- (2) `<script>` stripped: new test asserts `not.toContain('<script>')`, inside the 19/19 pass.
- (3) new unit test in `createPDF.ats.test.ts`: "renders the CKEditor-authored summary as sanitized HTML"; total test count 476 (staging) → 477 (branch) corroborates exactly one added.
- (4) test/build/lint: `npm test` 472 passed / 5 failed; same 5 fail with src stashed (= staging, 471 passed / 5 failed). Accepted as no-new-failures: the 4 `atsPdfIntegration` failures are a missing Puppeteer Chrome cache and the note shows them passing 4/4 on this branch with system Chrome (`PUPPETEER_EXECUTABLE_PATH`); the 1 `tokenExpiry` failure is Expected 3600 / Received 10800 from local `.env TOKEN_EXP_IN=3h`, in code this diff doesn't touch. Same env-failure acceptance as prior seals (`evidence/verifier/2026-10-25/fix-visit-accepts-slug-seal.md`, `fix-create-returns-created-doc-seal.md`). `npm run build` clean, ends `> cp -R ./src/public ./dist/` (typecheck row). `npm run lint` 274 → 274, baseline compared via stash.
- comments per code-comments.md: "No comment added/changed"; Acceptance row present.
- PDF standard: all 10 rules addressed in the note's `## PDF standard` section; rule 6 is the fix itself; rules 1-5 backed by real text extraction (rule 3: `TÓM TẮT` heading from `t('cv.summary')` in vi extraction); rule 8 `<div>` block, no layout CSS; 9/10 unchanged.
- Commands match `doctrine/MEMORY.md` (`npm test`, `npx jest <file>`, `npm run build`, `npm run lint`); no truncation markers in output.
- Forbidden states: ADHOC_WORK no (node on diagram); NO_EVIDENCE no (plan + diff notes); EDIT_UNVERIFIED no (every claim has run output, extraction done); CODE_IN_HAVEN no (no non-md/yaml files under `haven/`; scratch script not in hub); DIAGRAM_DRIFT resolved by this SEAL.
- Supersedes/Still open (6b): `## Supersedes: none`; active diagram held only this one #326 row. Nothing to retire.
- Seal gate: none (no outward-facing action). Proportion: 1 source line + 1 test, matches node scope; out-of-scope finds (`createDocx.ts` plain-text `<p>`, classic `createPDF.ts:279` unsanitized `introduction`) left in "Noticed, not done", not folded in.

## Re-run
none — audit-only; note output is unredacted, commands match doctrine, every criterion covered; node is not outward-facing or a `/release` gate.
