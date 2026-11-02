# 2026-11-02 - localize-education-school-major
Worker: implementer · Version: 0.1.0 · Node: `localize-education-school-major` (`haven/diagrams/dev-loop.prime-mermaid.md`) · Task: "phần education, bổ dung EN/VI cho 2 fields Tên trường và Tên chuyên ngành, tạo issue update cho resume-vuejs-website luôn" (#353) · Branch: `353-education-b-sung`

## Hub bytes before: 83513

## Diff
| file | why |
|---|---|
| `src/models/education.model.ts` | school/major → `localizedTextSchema`, default `{}` |
| `src/config/joi.config.ts` | new `localizedName(min)`: `vi` required min/max 255 trim, `en` optional allow '' |
| `src/candidate_profile/education/education.validate.ts` | school `localizedName(1)`, major `localizedName(3)` (keeps prior mins) |
| `src/candidate_me/index.ts` | `resolveLocalizedText` `??` → `||` so an empty variant falls back (its doc comment already promised "whichever variant is non-empty"; without it migrated `en: ''` would blank EN school/major — regression vs today). Educations also resolve school/major inside the existing loop (separate block added +5 no-unsafe-* lint, folded in → 0 new) |
| `src/candidate_me/search.ts` | match `school.vi/.en`, `major.vi/.en` |
| `src/scripts/migrate-localize-text-fields.ts` | comment re-wrapped; TARGETS + Education.school, Education.major (wrap string → `{vi, en:''}`) |
| `src/models/part/index.ts` | comment updated (no longer "school stays plain String") |
| tests: `education.validate.test.ts` (rewritten for object shape + reject cases), `search.test.ts` (dotted paths), `candidate_me/index.test.ts` (+2: resolve per lang, empty-en fallback) | |

Renderers (createPDF/ATS/Docx) untouched: they consume `handlerGetAboutMe` output, now already resolved to strings → `EducationData.school: string` still accurate. pdf-export-standard invariants: no renderer file changed, n/a.

## Command
- `npm test` · `npm run build` · `npm run lint` · `npx tsc --noEmit` (from repo root)
- Baseline: `git stash push -- src` → same commands → `git stash pop`

## Output
- After: `Test Suites: 2 failed, 53 passed, 55 total` / `Tests:       5 failed, 496 passed, 501 total`
- Base (stashed): `Test Suites: 2 failed, 53 passed, 55 total` / `Tests:       5 failed, 490 passed, 495 total`
- The 5 failures are identical on base, environmental: `tokenExpiry.test.ts` `Received: 10800` (local `.env` sets TOKEN_EXP_IN); `atsPdfIntegration.test.ts` ×4 `Could not find Chrome (ver. 127.0.6533.88)`.
- Build: `build exit 0`; `npx tsc --noEmit` → `0` errors.
- Lint after fold: `✖ 274 problems (274 errors, 0 warnings)` (baseline 274). Per touched file after vs base: candidate_me/index.ts 29 vs 29, joi.config.ts 6 vs 6 (lines 21/33, not mine), education.validate.ts 1 vs 1 (line 10 `Joi.object`, pre-existing), index.test.ts 16 vs 16.
- Targeted: `Tests:       82 passed, 82 total` (candidate_me + education.validate).

## Acceptance
| Criterion | Evidence |
|---|---|
| model + Joi localized, vi required | education.validate.test: rejects plain string / missing vi (`school.vi`) / major vi < 3 (`major.vi`); passes |
| resolved per `?lang=` with fallback | index.test "resolves school/major to the requested language", "falls back to vi when the requested language is empty" ✓ |
| search over both langs | search.test updated expectations ✓ |
| migration wraps old strings | TARGETS entries added (same idempotent `$type: string` updateMany) — not run against a DB |
| `npm test` no new failures | 496 passed; 5 failed identical to base |
| typecheck | `build exit 0`, `tsc --noEmit` 0 |
| lint ≤ 274, none new in touched files | 274; per-file counts equal to base |
| comments per code-comments.md | JSDoc on new exported `localizedName` (WHY: vi required because fallback), no issue refs, model/migrate comments updated to stay true |
| frontend issue | `gh issue create -R datvt243/resume-vuejs-website ...` → `https://github.com/datvt243/resume-vuejs-website/issues/386` (contract, form VI/EN, import wrap, deploy order) |

## Supersedes: none · ## Still open: none (grep `#353` in active diagram: only this node)

## Noticed, not done
- **Deploy order**: `npm run migrate:localize-text` must run against prod DB BEFORE deploying (old string docs vs subdoc schema). Re-run safe (idempotent).
- Swagger `components.schemas.Education` still says school/major/description `string` (description was already stale).
- LinkedIn/PDF import parsers still return plain-string school/major — frontend must wrap into `{vi}` before POSTing (put in frontend issue).
- Prettier `--check` warns on touched files; same files were not prettier-clean before; lint doesn't enforce it.
- `.claude/rules/api.md` search row still says "Education `school`/`major`" — still true semantically.

## Seal gate
External action `gh issue create` on resume-vuejs-website (#386): explicitly requested by operator in the task text ("tạo issue update cho resume-vuejs-website luôn"). Backend issue #353 created by `/todo` step 0. No commit/push (no `--ship`).
