# 2026-10-19 — add-experience-career-break (verifier REOPEN)

Worker: verifier (subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-experience-career-break` (`haven/diagrams/dev-loop.prime-mermaid.md`, last PM row)
New PM status: REOPEN (PM row left at PENDING — not demoted, not sealed)
Notes audited: `evidence/implementer/2026-10-19/add-experience-career-break-plan.md`, `-diff.md`

## Isolation proof
Spawned fresh via the Agent tool with a task string headed "You are the VERIFIER worker of the agent-hub ... You are a fresh, independent subagent — you did NOT write the diff under review", carrying an adversarial checklist (mutation of `careerBreakType`'s `.when` / the ATS `isCareerBreak` branch, Joi-semantics re-check, PUT/bulk path check, lint total vs 276) the implementer pass never had. No implementation history in this context.

## Reasoning
Audit-only per `recipes/verify_seal.md` "Re-run scope": the note fails structural gates (steps 4-6) before any re-run would add information ("don't spend an `npm ci` confirming a note that's already broken"). The dispatcher's extra requests (read every src hunk, re-run test/build/lint, mutation runs) were therefore not executed; recipe step 2 also forbids opening the diff directly.

| Check | Result |
|---|---|
| Node exists on diagram | Yes — `dev-loop.prime-mermaid.md:152`, PENDING, acceptance (1)-(5). |
| Command matches doctrine (step 4) | `npm test`, `npm run build`, `npx eslint . -f json` — consistent with `doctrine/MEMORY.md`. Build output is a paraphrase ("tsc clean, ends with ...") plus the final `copy` lines — borderline but not the decisive gap. |
| Output not truncated (step 5) | `Test Suites: 44 passed, 44 total` / `Tests: 396 passed, 396 total`; lint `276` = baseline 276. OK. |
| `## Acceptance` table (step 6, evidence/README.md format) | MISSING. The note has no per-criterion table mapping (1)-(5) to specific output lines; criteria (1) model fields, (2) Joi rules incl. "unknown type → 400", (3) classic PDF + DOCX rendering, (4) swagger are asserted in the Diff list only, with no cited test name or output line. Classic PDF and DOCX rendering (crit. 3) have no test cited at all — only the ATS +2 tests. |
| "comments per code-comments.md" row | MISSING. `code-comments.md` Enforcement: "Verifier: that row missing ... → REOPEN." Also required by `agent-hub/CLAUDE.md` "Every diff also (1)" → `EDIT_UNVERIFIED`. |
| PDF/DOCX export standard | MISSING. Diff touches `createPDF.ts`, `createPDF.ats.ts`, `createDocx.ts`; `agent-hub/CLAUDE.md` + `pdf-export-standard.md` Enforcement require the note to confirm each of the 10 invariants (or name the inapplicable ones and why), and rules 1-5 need extracted rendered-PDF text (`pdf-parse`/`pdftotext`) read back — otherwise `EDIT_UNVERIFIED`. The note never mentions the standard and cites no extracted text (e.g. that "Career break — <type>" / "Nghỉ ...", with the date range, actually appears in extracted ATS PDF text). Rule 3 (i18n labels) is also live: classic PDF/DOCX hardcode `'vi'` — acceptable as pre-existing, but must be stated against the rule. |
| `## Seal gate` section | Missing as a section; "Nothing committed/pushed" appears under Noticed. Minor, fix alongside. |
| Forbidden states (step 7) | `ADHOC_WORK`: no (node on diagram, worker identity present). `NO_EVIDENCE`: no (notes exist). `EDIT_UNVERIFIED`: HIT — missing comments row + missing PDF-export-standard confirmation/extracted text. `CODE_IN_HAVEN`: no (haven change is the PM row only, per git status). `DIAGRAM_DRIFT`: no (row PENDING, matches unsealed state). |
| Proportion (step 9) | Diff list matches node files from the plan; no scope creep visible in the note. Not independently checked against `git diff` (step 2). |

## Missing
1. `## Acceptance` table, one row per criterion (1)-(5), each citing a concrete output line or test name — including tests (or extracted output) proving classic PDF and DOCX render the career-break title, and a test/assertion proving an unknown `careerBreakType` is rejected and a career break with omitted `company`/`position` passes.
2. "comments per code-comments.md" row (cite touched comments or "no comments touched").
3. `pdf-export-standard.md` confirmation of all 10 rules (or named N/A with reason), with extracted rendered-PDF text (`pdf-parse`/`pdftotext`) for rules 1-5 showing the career-break entry for both `vi` and `en` ATS output.
4. Verbatim `npm run build` tail (exit code or last lines), not a paraphrase; add a `## Seal gate` section ("none").

## Re-run
none — audit-only; the note is structurally incomplete (steps 4-6), so per "Re-run scope" a re-run would not change the verdict.
