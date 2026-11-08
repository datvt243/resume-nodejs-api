# 2026-11-08 - ats-check-messages-i18n (diff)
- Worker: implementer · Version: 0.1.0
- Node: `ats-check-messages-i18n` (`haven/diagrams/dev-loop.prime-mermaid.md`, IN_PROGRESS)
- Task: `/todo #407` — "ATS check success message is hard-coded English" (+ comment: every check message)
- Plan: `evidence/implementer/2026-11-08/ats-check-messages-i18n-plan.md`

## Hub bytes before
96348

## Feature doc
`doctrine/features/ats-check.md`

## Feature doc changed: Behavior #6 "Response 200: `data: { … }`" → same + "The response `message` and every check's `message` are localized (vi + en) in the request language (`req.lang`), which may differ from the CV's `lang`; section-heading names are still judged in the CV's `lang`"; + Changelog row — operator: "Bug: i18n — #407" (2026-11-07, doc Open questions) + issue comment "localize every check message (vi + en via `req.lang`)"

## Diff
| file | why |
|---|---|
| `src/locales/en.ts`, `src/locales/vi.ts` | 22 new `atsCheck.*` keys: `completed` + one per check outcome (en text = the old hard-coded strings verbatim, `${…}` → `{{length}}`/`{{headings}}`/`{{fields}}`/`{{pages}}`) |
| `src/services/atsChecks.ts` | every message literal → `msg(input, 'atsCheck.<key>')` (+ `.replace('{{x}}', …)` where it had a value); `msg` = `t(key, input.messageLang ?? input.lang)`; new optional `AtsCheckInput.messageLang` (JSDoc why). `checkStandardHeadings`' heading set still built with `input.lang` (CV language) |
| `src/candidate_me/ats-check.ts` | `message: t('atsCheck.completed', req.lang)`; `messageLang: req.lang` in `checkInput` |
| `src/__tests__/services/atsChecks.test.ts` | every passing + failing check message differs between vi and en and has no leftover `{{`/raw key; `messageLang` wins over the CV `lang` and falls back to it; `atsCheck.completed` in both languages |

## Command
- `npx jest src/__tests__/services/atsChecks.test.ts` (new code; then with `git show HEAD:` of the 4 `src/` files swapped in, then restored); `--verbose -t "request language|template=classic"`
- `npm test`
- `npm run build` (Typecheck: inside Build) — `| grep -c "error TS"`
- `npm run lint`; per touched file `npx eslint <file>` now vs `git show origin/staging:<file> | npx eslint --stdin --stdin-filename <file>`

## Output
```
npx jest src/__tests__/services/atsChecks.test.ts
Tests:       32 passed, 32 total

npx jest src/__tests__/services/atsChecks.test.ts --verbose -t "request language|template=classic"
    ✓ reports standard-headings and metadata as not applicable, with a localized message (2 ms)
    ✓ still judges both checks for the ats template
    ✓ leaves not-applicable checks out of the score (1 ms)
    ✓ every passing message is translated in vi, with its placeholders filled (1 ms)
    ✓ every failing message is translated in vi, with its placeholders filled
    ✓ uses messageLang over the CV lang, falling back to the CV lang
    ✓ has the success message in both languages
Tests:       25 skipped, 7 passed, 32 total

old code + new tests (suite does not compile — `messageLang` doesn't exist):
    src/__tests__/services/atsChecks.test.ts:210:41 - error TS2353: Object literal may only specify known properties, and 'messageLang' does not exist in type 'AtsCheckInput'.
    src/__tests__/services/atsChecks.test.ts:211:41 - error TS2353: Object literal may only specify known properties, and 'messageLang' does not exist in type 'AtsCheckInput'.
    src/__tests__/services/atsChecks.test.ts:219:61 - error TS2353: Object literal may only specify known properties, and 'messageLang' does not exist in type 'AtsCheckInput'.
Tests:       0 total

npm test
FAIL src/__tests__/auth/tokenExpiry.test.ts
FAIL src/__tests__/services/atsPdfIntegration.test.ts
Test Suites: 2 failed, 62 passed, 64 total
Tests:       5 failed, 633 passed, 638 total

npm run build | grep -c "error TS"
0
npm run lint
✖ 274 problems (274 errors, 0 warnings)
per touched file (now | base):
src/services/atsChecks.ts | 0 | 0
src/candidate_me/ats-check.ts | ✖ 5 problems | ✖ 5 problems
src/locales/en.ts | 0 | 0
src/locales/vi.ts | 0 | 0
src/__tests__/services/atsChecks.test.ts | 0 | 0
```
The 5 `npm test` failures are the pre-existing local-env ones (atsPdfIntegration ×4 local Chrome, tokenExpiry ×1 local `.env`), same as `evidence/implementer/2026-11-08/ats-classic-not-applicable-diff.md`; 633 = 629 + 4 new tests (the `it.each` counts 2). `atsPdfIntegration.test.ts` asserts no message text (`grep -n "message" src/__tests__/services/atsPdfIntegration.test.ts` → 0 hits).

## Acceptance
| Criterion | Evidence |
|---|---|
| (1) every check message localized vi/en, placeholders filled | "every passing message is translated in vi…" ✓ + "every failing message…" ✓ (all 10 checks, both outcomes covered by `baseInput`/`failing`) |
| (1) request language over CV language, fallback to CV lang | "uses messageLang over the CV lang, falling back to the CV lang" ✓ |
| (1) success message localized | "has the success message in both languages" ✓; `ats-check.ts` uses `t('atsCheck.completed', req.lang)` |
| (1) headings still judged in CV lang | 25 pre-existing check tests incl. "passes when every heading is a standard localized heading" in `32 passed` |
| (2) file passes, red on old code | `32 passed, 32 total`; old: TS2353 compile errors, `0 total` |
| (3) `npm test` no new failures | `5 failed, 633 passed, 638 total` — same 5 env failures |
| (3) build clean | `0` `error TS` |
| (3) lint ≤ 274, none new in touched files | `✖ 274`; per-file now = base |
| comments per code-comments.md | one 1-sentence JSDoc on `messageLang` (WHY); no issue refs |
| PDF export standard | not triggered — no `createPDF*.ts`/`createDocx.ts` change |

## Supersedes: none
`grep '#407' haven/diagrams/dev-loop.prime-mermaid.md` → only this row.
## Still open: none
## Noticed, not done
- `ats-check.ts` carries 5 pre-existing lint errors, same on staging.
## Seal gate
none in this pass — commit/push/merge are `/ship --merge` (requested by the operator in the `/todo` invocation).
