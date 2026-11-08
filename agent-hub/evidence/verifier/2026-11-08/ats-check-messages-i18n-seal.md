# 2026-11-08 - ats-check-messages-i18n (seal)
- Worker: verifier · Version: 0.1.0
- Node: `ats-check-messages-i18n` (`haven/diagrams/dev-loop.prime-mermaid.md`, GitHub #407)
- New PM status: SEALED (row archived to `haven/diagrams/dev-loop-archive.md`; oldest pointer `fix-candidate-email-empty-query` dropped to keep 20)
- Notes audited: `evidence/implementer/2026-11-08/ats-check-messages-i18n-plan.md`, `evidence/implementer/2026-11-08/ats-check-messages-i18n-diff.md`

## Isolation proof
Fresh Agent spawn, description "Verify node ats-check-messages-i18n" — not the implementer's `/todo #407` task string.

## Reasoning
| Criterion | Evidence (diff note) |
|---|---|
| (1) Behavior #6: every check message vi/en, placeholders filled | "every passing message is translated in vi…" ✓, "every failing message…" ✓ |
| (1) `req.lang` over CV lang, fallback | "uses messageLang over the CV lang, falling back to the CV lang" ✓ |
| (1) success message localized | "has the success message in both languages" ✓ |
| (1) headings judged in CV lang | pre-existing heading tests within `32 passed, 32 total` |
| (2) file passes; red on old code | `32 passed, 32 total`; old code: TS2353 ×3, `Tests: 0 total` |
| (3) `npm test` no new failures | `5 failed, 633 passed, 638 total` vs prior note `5 failed, 629 passed, 634 total` — same 2 suites (tokenExpiry, atsPdfIntegration), +4 tests |
| (3) build / typecheck (MEMORY: inside Build) | `npm run build \| grep -c "error TS"` → `0` |
| (3) lint ≤ 274 baseline, none new in touched files | `✖ 274 problems`; per-file now = base (ats-check.ts 5 = 5 pre-existing) |
| comments per code-comments.md | one 1-sentence WHY JSDoc on `messageLang`, no issue refs |
| Feature doc acceptance (`ats-check.md`) | atsChecks file passes; keywordMatcher + candidate_me/index suites not in the `npm test` FAIL list (62 suites passed) |
| Feature doc changed | Behavior #6 edit backed by operator answer "Bug: i18n — #407" (Open questions) + issue comment; Changelog row added |
| PDF export standard | not triggered — no `createPDF*`/`createDocx` change |
- Supersedes / Still open: none; `#407` grep → only this row.
- Forbidden states: none hit (node on diagram, notes present, outputs verbatim, no code in haven, PM status updated here).
- Seal gate: no outward action in the pass; ship is `/ship --merge`.
- Proportionality: 4 src/test files + 2 locales, all within Behavior #6 scope.
- Doctrine proposal: none. Feature doc Status unchanged (fix SEAL proves one Behavior item).

## Re-run
none — audit-only; outputs verbatim, commands match `doctrine/MEMORY.md`, not outward-facing.
