# 2026-11-05 - fix-visit-real-client-ip — SEAL
Worker: verifier · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `fix-visit-real-client-ip` (GitHub #371) · New PM status: SEALED
Note audited: `evidence/implementer/2026-11-05/fix-visit-real-client-ip.md`

## Isolation proof
Fresh subagent spawned via the Agent tool from a `/todo #371` orchestration, task string "You are the agent-hub **verifier** worker ... What to verify - Node: `fix-visit-real-client-ip` ... Operator decisions already made (do not re-litigate)" — differs from the implementer's task (`/todo #371` — "Visit tracking stores the proxy's IP/location, not the visitor's (no trust proxy)"). No memory of the implement pass; diff content not opened (only `git diff --stat`).

## Re-run: partial
Reason: the orchestrator explicitly asked for an independent check of the "5 failures pre-exist on base" claim. Commands re-run (repo root):
- `npx jest src/__tests__/candidate_me/index.test.ts` → `Tests:       49 passed, 49 total`
- `git stash push -m verifier-371-baseline -- src .claude/rules/api.md`, then `npx jest src/__tests__/auth/tokenExpiry.test.ts src/__tests__/services/atsPdfIntegration.test.ts` → `Test Suites: 2 failed, 2 total` / `Tests:       5 failed, 2 passed, 7 total` (same 5 test names as the note), then `git stash pop` — diff sha of `src` + `.claude/rules/api.md` identical before/after (`RESTORED_IDENTICAL`).
- `npm run build` → `build_exit=0` (typecheck inside Build).
- `npm run lint` (`eslint .`) → `✖ 274 problems (274 errors, 0 warnings)` = baseline 274. Changed hunks in `src/candidate_me/index.ts` are lines 9, 253, 266-280; none of its 29 lint lines (58..364) fall in them.
Full `npm test` not re-run (note's verbatim `Tests: 5 failed, 566 passed, 571 total` accepted; the 5 are proven pre-existing above).

## Acceptance
| Criterion | Evidence | Result |
|---|---|---|
| (1) XFF leftmost IP stored + geo on it | note: `✓ stores the leftmost X-Forwarded-For IP and its geo location, not the proxy address` (asserts lookup on `203.0.113.7`); re-run 49/49 pass. Note uses `10.0.0.2` as 2nd hop vs node's `10.0.0.1` — immaterial, leftmost entry is what's tested | met |
| (2) non-IP XFF → `req.ip` | `✓ falls back to req.ip when X-Forwarded-For is not an IP`; re-run 49/49 | met |
| (3) `rateLimit.middleware.ts` untouched | `git diff --stat`: only `.claude/rules/api.md`, diagram, `src/__tests__/candidate_me/index.test.ts`, `src/candidate_me/index.ts` | met |
| (4) test + build green, lint ≤ 274, none in changed files | 5 full-suite failures confirmed pre-existing on base (above); build exit 0; lint 274, 0 on changed lines | met |
| Spoof risk documented + accepted | note: JSDoc on `visitorIp` + api.md visit row; operator decision on the node | met |
| comments per code-comments.md | note row: one `/** */` WHY JSDoc, no issue refs, stale comment removed | met |

## Forbidden states
None hit: node exists on the diagram (no ADHOC_WORK), evidence present (no NO_EVIDENCE), commands match `doctrine/MEMORY.md`, no code in `haven/`, no PM demotion.

## Seal gate
Not outward-facing (no push/PR/deploy) — no approval needed. Note omits the `## Seal gate` section; noted, not blocking.

## Proportionality
4 files, +49/-16 — matches node scope (handler + its tests + api.md row).

## PM update
Row collapsed: full row (state SEALED) appended to `haven/diagrams/dev-loop-archive.md`, active row → pointer. Pointer rows hit 21 → oldest (`set-request-body-limit`, 2026-10-24, full row already in archive) removed; now 20. `## Supersedes: none` — nothing to retire.
