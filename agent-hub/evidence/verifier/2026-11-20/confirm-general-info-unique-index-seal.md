# Verdict — confirm-general-info-unique-index: SEAL

- Date: 2026-11-20 · Worker: verifier · Node: `confirm-general-info-unique-index` (#408)
- Note graded: `evidence/implementer/2026-11-20/confirm-general-info-unique-index-plan.md`

## Isolation proof
Spawn description: "verify_seal confirm-general-info-unique-index" (fresh subagent, blank context).

## Re-run
none — audit-only; ops read-only check, nothing outward-facing by the agent.

## Criteria
1. Prod index: screenshot (viewed directly) shows `davidapi.jhhu4ml.mongodb.net > resume-api > general-informations`, Indexes 2: `_id_` UNIQUE and `candidateId_1` REGULAR UNIQUE. `candidateId_1` is the Mongoose default name for `{candidateId:1}`, matching `src/models/generalInformation.model.ts:14` (`unique: true`). Met.
2. Conditional on a missing index — N/A, correctly skipped.
3. Typecheck (`npm run build`, inside Build per MEMORY.md) exit 0 cited; `npm test` 76/76 suites, 826/826 tests cited; lint skipped, no `src/` diff (`git diff -- src | wc -l` -> 0). Comments row: n/a, no code.
4. Feature doc cited (`general-information.md`), Behavior #3 noted as matched; no doc change. `## Review` present (skipped — no code diff, non-docs but ops check with zero src diff: accepted). `## Supersedes: none`.

## Caveats (accepted, not blocking)
- Screenshot is a Compass view, not literal `getIndexes()` text; the index key definition row is collapsed, so `{candidateId:1}` is inferred from the default name.
- That the cluster is prod rests on the operator's statement; the note says so openly.

## Forbidden states
None hit. Diff is agent-hub only; no code in haven/.

## Ratchet
Row archived to `dev-loop-archive.md`, pointer left on the diagram, pointer cap (20) enforced. No feature-doc status change (not a feat). No doctrine proposal.
