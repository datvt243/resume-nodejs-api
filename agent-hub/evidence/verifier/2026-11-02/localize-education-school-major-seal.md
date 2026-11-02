# 2026-11-02 - localize-education-school-major (verdict: SEAL)

- Worker: verifier (subagent, dispatched via Agent tool) · Version: 0.1.0
- Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `localize-education-school-major` (#353)
- Graded: `evidence/implementer/2026-11-02/localize-education-school-major-diff.md` (plan: `localize-education-school-major-plan.md` alongside)
- New PM status: SEALED (collapsed: full row appended to `haven/diagrams/dev-loop-archive.md`, active row replaced in place by a pointer row; oldest pointer row `unified-error-envelope` (2026-10-21) dropped to keep 20, its full row is already in the archive)

## Isolation proof
Spawned via the Agent tool with description "verify_seal localize-education-school-major", token VS-353-20261102. The implementer pass did not have that token. This context has no implementation history and did not write the diff.

## Reasoning
| # | Criterion | Cited evidence | Result |
|---|---|---|---|
| 1 | Model + Joi localized, `vi` required with old min 1/3, `en` may be empty | Diff rows: model `localizedTextSchema`; `localizedName(min)` (`vi` required, `en` allow ''); school `localizedName(1)`, major `localizedName(3)`. education.validate.test rejects a plain string, a missing `school.vi`, and `major.vi` < 3. Targeted run: `Tests: 82 passed, 82 total` | Covered |
| 2 | Resolved per `?lang=` with empty-variant fallback | `??` → `||` in `resolveLocalizedText`; index.test has "resolves school/major to the requested language" and "falls back to vi when the requested language is empty" | Covered |
| 3 | Search matches `school.vi/.en`, `major.vi/.en` | search.ts row; search.test expectations updated, inside the 82 passed | Covered |
| 4 | `migrate:localize-text` wraps old strings | TARGETS gets Education.school and Education.major, reusing the idempotent `$type: string` updateMany. Not run against a DB. That is correct: local `.env` points at the real-data cluster, so a run is an outward action. The note's Noticed section flags the deploy order. No runtime evidence exists for this item; it is carried forward (see below) | Covered (code-level, not executed) |
| 5 | `npm test` green (pre-existing env failures excepted) | After `5 failed, 496 passed, 501 total` vs stashed base `5 failed, 490 passed, 495 total`. Base has the same 5 (`tokenExpiry` TOKEN_EXP_IN, `atsPdfIntegration` ×4 no Chrome), the same pair accepted at the `add-main-skills`/`add-familiar-skills` seals | Covered (pre-existing only) |
| 6 | `npm run build` 0 errors (Typecheck inside Build) | `build exit 0`; `npx tsc --noEmit` 0 errors | Covered |
| 7 | Lint ≤ 274, none (new) in touched files | `✖ 274 problems (274 errors, 0 warnings)` = baseline. Per-file after vs stashed base are equal: index.ts 29/29, joi.config.ts 6/6, education.validate.ts 1/1, index.test.ts 16/16. Same reading the prior seals used for "none in changed files" (no new errors from this diff) | Covered |
| 8 | Frontend issue on resume-vuejs-website | `https://github.com/datvt243/resume-vuejs-website/issues/386`. Independently confirmed: `gh issue view 386` returns state OPEN with the title "education: form EN/VI cho Tên trường (school) và Tên chuyên ngành (major)" | Covered |
| — | Comments per code-comments.md | Row present: JSDoc on the new exported `localizedName` (WHY), no issue refs, model/migrate/part comments updated to stay true | Covered |

- Commands match `doctrine/MEMORY.md` (`npm test`, `npm run build` with Typecheck inside Build, `npm run lint` with the count cited against `baseline: 274`), all run from the repo root. Output has no `...` or "truncated" markers.
- Step 6: `## Supersedes: none`, `## Still open: none`. A grep of the active diagram for `#353` found only this node.
- Forbidden states (5): none hit. The node exists and was PENDING, not set by the implementer. Evidence exists. No code in `haven/`. The diagram is updated by this pass. The diff was not self-graded.
- Seal gate: the one outward action was `gh issue create` on resume-vuejs-website (#386). The operator's own task text asked for it: "tạo issue update cho resume-vuejs-website luôn". That is a recorded, scoped approval for this exact action. No commit or push happened.
- Proportion: `git status --short src/` shows exactly the 10 files in the Diff table. The `??` → `||` change affects every localized field, but the node requires "empty-variant fallback", and the change makes the existing doc comment's promise true. The comment edits only keep comments accurate. Renderers are untouched, so pdf-export-standard does not apply.
- Carried forward (non-blocking, operator to act): run `npm run migrate:localize-text` against prod BEFORE deploying, or old string docs will not match the subdoc schema. Swagger `Education` schema is still `string`.

## Re-run
partial. Only `gh issue view 386 -R datvt243/resume-vuejs-website`, because the node includes an outward-facing action (the "outward-facing" exception in Re-run scope). Build, lint and test were not re-run. `git status --short src/` was also run, to confirm the file list.
