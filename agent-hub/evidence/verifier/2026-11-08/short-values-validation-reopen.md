# 2026-11-08 - short-values-validation (REOPEN)
- Worker: verifier · Version: 0.1.0
- Node: `short-values-validation` (`haven/diagrams/dev-loop.prime-mermaid.md`, #414)
- New PM status: unchanged (IN_PROGRESS) — REOPEN is a verdict, not a state
- Notes audited: `evidence/implementer/2026-11-08/short-values-validation-plan.md`, `evidence/implementer/2026-11-08/short-values-validation-diff.md`
- Feature doc: `doctrine/features/cv-section-crud.md` (Behavior #12, new)

## Isolation proof
Fresh Agent spawn, task "agent-hub verifier worker … run verify_seal on node short-values-validation … You did NOT write this change" (not the implementer's `/todo #414` task string); no implement-pass reasoning in this context.

## Reasoning
| Criterion | Verdict | Evidence cited in note |
|---|---|---|
| (1) `major.vi: 'IT'` accepted | ok | "accepts a short major IT" ✓, ✕ on old validator |
| (1) empty `major.vi` → 400 on `major.vi` | ok | "rejects an empty major vi" ✓ |
| (1) award link missing / `''` / http / https accepted | ok | 4 "accepts a link that is …" ✓ ("missing" ✕ on old) |
| (1) non-URL / `javascript:` / > 100 → 400 on `link` | ok | 3 "rejects a link that is …" ✓ (non-URL, `javascript:` ✕ on old) |
| (2) both files pass, new cases red on old | ok | `18 passed, 18 total`; old: `5 failed, 13 passed`; restore shown via `git diff --stat` |
| (3) `npm test` no new failures | ok | `5 failed, 645 passed, 650 total` = known env failures (tokenExpiry, atsPdfIntegration); 641 + 9 new |
| (3) Typecheck (inside Build) | ok | `npm run build` — no `error TS`, tail cited |
| (3) lint ≤ 274, none in changed files | MISSING (partial) | `✖ 274 problems` cited; "none in touched files" is inferred from the unchanged total, not measured — no per-file count for the 3 touched src/test files + new `award.validate.test.ts` |
| comments per code-comments.md | MISSING | no row in `## Acceptance` (required by the standard's Enforcement; verifier: row missing → REOPEN) |
| Feature doc changed + operator answer | MISSING (partial) | operator answer = issue #414 body: "`major.vi`: min 1" and "validate as a URL when present". Behavior #12 additionally states (a) `school.vi` needs only 1 char and (b) http(s)-only scheme, both attributed "(operator, #414)" — neither is in the operator's recorded answer, and (a) has no cited test with a 1-char school |
| Supersedes / Still open | ok | none; `#414` grep → only this row |

Forbidden states: none hit (node exists, notes exist, no code in haven/, PM status consistent). Seal gate: none in this pass (ship deferred to `/ship --merge`). Proportionality: 2 validator lines + tests — minimal. Doctrine proposal: none.

## Missing
1. Add the `comments per code-comments.md` row to `## Acceptance` (e.g. "no comments touched", if that is the case).
2. Cite a per-file lint count for every touched file (e.g. `npx eslint <files>` → 0 problems), not an inference from the 274 total.
3. Behavior #12 wording vs operator answer: either drop/reword the parts the operator did not decide (`school.vi` 1-char — pre-existing behavior, not #414; http(s)-only scheme), or record the operator's answer for them. If `school.vi` stays in #12, cite a passing test with a 1-char school.

## Re-run
none — audit-only; REOPEN on missing citations, no re-run per "Re-run scope".
