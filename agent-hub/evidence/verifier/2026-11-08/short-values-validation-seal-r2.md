# 2026-11-08 - short-values-validation (SEAL, round 2)
- Worker: verifier · Version: 0.1.0
- Node: `short-values-validation` (`haven/diagrams/dev-loop.prime-mermaid.md`, #414)
- New PM status: SEALED — row archived to `haven/diagrams/dev-loop-archive.md`; oldest pointer (`logout-revokes-refresh`, already in archive) trimmed to keep 20
- Notes audited (re-read from disk): `evidence/implementer/2026-11-08/short-values-validation-plan.md`, `evidence/implementer/2026-11-08/short-values-validation-diff.md`
- Feature doc: `doctrine/features/cv-section-crud.md` (Behavior #12) — fix SEAL, doc Status left as is
- Previous round: `evidence/verifier/2026-11-08/short-values-validation-reopen.md`

## Isolation proof
Resumed round 2 via coordinator message "Round 2: re-read … short-values-validation-diff.md (and -plan.md) plus … cv-section-crud.md Behavior #12 from disk, re-run verify_seal steps 2-12"; this context holds only my round-1 verdict, no implement-pass reasoning.

## Reasoning
| Criterion | Verdict | Evidence cited in note |
|---|---|---|
| (1) `major.vi: 'IT'` accepted | ok | "accepts a short major IT" ✓, ✕ on old |
| (1) empty `major.vi` → 400 on `major.vi` | ok | "rejects an empty major vi" ✓ |
| (1) award link missing / `''` / http / https accepted | ok | 4 "accepts a link that is …" ✓ ("missing" ✕ on old) |
| (1) non-URL / `javascript:` / > 100 → 400 on `link` | ok | 3 "rejects …" ✓ (non-URL, `javascript:` ✕ on old) |
| (2) files pass, red on old | ok | `18 passed, 18 total`; old `5 failed, 13 passed` |
| (3) `npm test` no new failures | ok | `5 failed, 645 passed, 650 total` = known env failures; 641 + 9 new |
| (3) Typecheck (inside Build) | ok | `npm run build` — no `error TS` |
| (3) lint ≤ 274, none new in touched files | ok (fixed r1 #2) | `✖ 274`; per file now = staging (1 pre-existing `_id` 10:3 in each validate file, both test files 0), verbatim output cited |
| comments per code-comments.md | ok (fixed r1 #1) | 0 added comment lines in `src` diff; the 3 grep hits in the new test are URL literals |
| Feature doc changed + operator answer | ok (fixed r1 #3) | #12 now matches issue #414 body ("`major.vi`: min 1", "validate as a URL when present"); `school.vi` dropped; http(s)-only explicitly marked as implementation choice, not operator's |
| Supersedes / Still open | ok | none; `#414` → only this row |

Forbidden states: none hit. Seal gate: none in this pass (commit/push via `/ship --merge`). Proportionality: 2 validator lines + tests + doc item — minimal. Doctrine proposal: none.
Non-blocking: doc `## Changelog` has no row for Behavior #12 (sibling fixes #403/#404 added one); not a recipe criterion.

## Missing
none

## Re-run
none — audit-only, note output verbatim and complete.
