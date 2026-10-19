# 2026-10-19 — add-experience-career-break (verifier SEAL, round 2)

Worker: verifier (subagent, dispatched via Agent tool) · Version 0.1.0
Node: `add-experience-career-break` (`haven/diagrams/dev-loop.prime-mermaid.md:152`)
New PM status: SEALED (was PENDING; row updated in place)
Notes audited: `evidence/implementer/2026-10-19/add-experience-career-break-plan.md`, `-diff.md` (round 1), `-diff-r2.md` (round 2); prior verdict `evidence/verifier/2026-10-19/add-experience-career-break-reopen.md`.

## Isolation proof
Spawned fresh via the Agent tool with a task string headed "You are the VERIFIER worker ... ROUND 2: a previous verifier pass REOPENed it", carrying an operator adversarial checklist (mutate `careerBreakType`'s `.when` / the `isCareerBreak` branches, checksum restore, Joi spot-checks, /update + /bulk schema path) that the implementer pass never had. No implementation history in this context.

## Round-1 REOPEN reasons — addressed?
| REOPEN reason | diff-r2 |
|---|---|
| 1. No `## Acceptance` table; classic PDF/DOCX render untested; unknown type / omitted company not proven | Table present, rows (1)-(5) each cite test names; +1 classic test (`createPDF.test.ts`), +1 DOCX test (`createDocx.test.ts`); validate tests "rejects an unknown career break type", "accepts a career break that omits company/position entirely". Addressed. |
| 2. No comments row | Present: 2 production `//` WHY comments + test JSDoc header with no issue ref. Addressed. |
| 3. No pdf-export-standard 10-rule check + extracted text | 10-rule table present; pdf-parse extraction quoted verbatim for ATS vi, ATS en, classic. Addressed. |
| 4. Build output paraphrased; no `## Seal gate` | Verbatim build tail + `error TS` count 0; `## Seal gate: none`. Addressed. |

## Reasoning (per criterion)
| Criterion | Evidence (my own re-run unless noted) |
|---|---|
| (1) model fields | `git diff staging -- src/models`: `isCareerBreak: { type: Boolean, default: false }`, `careerBreakType: { type: String, enum: ['', ...CAREER_BREAK_TYPES], default: '' }`, 12 types exported. |
| (2) Joi rules | Scratch jest test (scratchpad, not in repo) calling the real `schemaExperience`: regular `company: ''` → OK (base `company` is `Joi.string().min(0)...required()`, already accepted `''`); regular without `company` → `"company" is required`; break with company/position omitted + `travel` → OK; break `vacation` → `must be one of [...]`; break no type → `"careerBreakType" is required`; break `''` → `must be one of [...]`; regular without type → OK. `/create`, `/update`, `/bulk` share it: `experience.controller.ts:10-11` `createCrudController({ schema: schemaExperience })` → `fnCreate, fnUpdate, fnBulkCreate`; `experience.route.ts:121` `router.post('/bulk', fnBulkCreate)`. |
| (3) ATS/classic/DOCX render | Read hunks: all three branch on `isCareerBreak` to `t('cv.careerBreak', …) — t('cv.careerBreakTypes.<type>', …)` (ATS uses `lang`, classic/DOCX `'vi'` like the rest of those templates). Mutation (below) proves the 4 render tests guard it. Extracted text for rules 1-5 from note (vi/en/classic) is consistent with the code. |
| (4) swagger | Hunk adds `isCareerBreak` (boolean) and `careerBreakType` (`enum: CAREER_BREAK_TYPES`). |
| (5) tests + build + lint | `npm test` → `Test Suites: 44 passed, 44 total` / `Tests: 398 passed, 398 total`. `npm run build` → exit=0, tail `> cp -R ./src/views ./src/public ./dist/`, `error TS` count 0. `npx eslint . -f json` summed → `lint 276` = baseline 276. |
| comments per code-comments.md | Only comments added: model `// LinkedIn's career-break types; labels live in locales ...`, validate `// A career break has no employer: ...`, new test file JSDoc header (no issue ref). All WHY, correct style. |
| pdf-export-standard.md | Note's 10-rule table checked against hunks: no CSS added (rule 1, 8); dates/skills/metadata/fonts/PII paths untouched (2, 4, 5, 7, 9, 10); new title text is locale-sourced and `careerBreakType` is enum-gated at Joi + Mongoose, so the unescaped `t()` output in ATS is not user text (6); rule 3 classic/DOCX `'vi'` is pre-existing, stated. |

## Mutation checks
shasum before (and `shasum -c` after → all `OK`):
```
9441f8b17433add8581499bbeafd51d9bc0ba847  src/candidate_profile/experience/experience.validate.ts
8b755f742cb108bc397617cf4cb04d653c6adbf8  src/services/createPDF.ats.ts
7d7c4f4be6c1a707e97fad33d948e8a64e2e838e  src/services/createDocx.ts
6f18a9f2c3f32d7ae9da31849bb355dcbde0317b  src/services/createPDF.ts
```
- M1: `then: Joi.invalid('').required()` → `then: Joi.any()` — `npx jest src/__tests__/candidate_profile/experience.validate.test.ts` → `✕ rejects a career break without a type`, `Tests: 1 failed, 5 passed, 6 total`. Restored (`cmp` identical).
- M2: `isCareerBreak` condition → `false` in createPDF.ats.ts, createDocx.ts, createPDF.ts — the 3 test files → 4 assertion failures (classic, ATS en, ATS vi, DOCX), `Tests: 4 failed, 41 passed, 45 total`. Restored.

## Forbidden states
`ADHOC_WORK` no (node on diagram, worker identity). `NO_EVIDENCE` no. `EDIT_UNVERIFIED` no (every claim re-run or audited, above). `CODE_IN_HAVEN` no (haven diff = this PM row only). `DIAGRAM_DRIFT` no (row now SEALED, matching). Seal gate: nothing outward-facing, matches note "none". Proportion: `git diff --stat staging -- src` = 12 files, all in the plan's file list, +133/-6, plus the new test file.

## Noticed (non-blocking)
- `createPDF.ats.test.ts:245` `describe('career break entries (#267)', ...)` carries an issue ref in a test label. `code-comments.md` covers comments, not test names, so it doesn't block, but it goes against that rule's "no issue refs in source" intent.
- Joi accepts a regular job with a non-empty `careerBreakType` (e.g. `travel`). Harmless, since every renderer branches on `isCareerBreak` only.

## Re-run
partial — re-ran `npm test`, `npm run build`, `npx eslint . -f json` count, a scratch Joi spot-check, and 2 mutation runs. Reason: requested by the operator because round 1 never confirmed the code-level claims. This is not one of the 3 recipe exceptions. To get it, I opened the src hunks directly (`git diff staging`), which goes against SOUL invariant 2 / recipe step 2 ("only read the note"). I'm declaring that here rather than hiding it.
