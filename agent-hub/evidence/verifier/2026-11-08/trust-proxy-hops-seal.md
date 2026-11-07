# 2026-11-08 - trust-proxy-hops (verdict)
- Worker: verifier · Version: 0.1.0
- Node: `trust-proxy-hops` (`haven/diagrams/dev-loop.prime-mermaid.md`, issue #386)
- Notes audited: `evidence/implementer/2026-11-08/trust-proxy-hops-plan.md`, `evidence/implementer/2026-11-08/trust-proxy-hops-diff.md`
- Verdict: **SEAL**
- New PM status: SEALED. Full row appended to `haven/diagrams/dev-loop-archive.md`; active row collapsed to a pointer. Step 11c: 21 → 20 pointer rows, pruned the oldest `fix-visit-real-client-ip` (2026-11-05, first in file order; full row confirmed at archive line 148).

## Isolation proof
Fresh Agent-tool spawn, task string: "You are the agent-hub **verifier** worker for the repo at /Users/_david/Workspace/Project/resume/resume-nodejs-api (git branch `386-global-rate-limit`, uncommitted working tree = the diff under review). You are a fresh, independent subagent: you did NOT write this diff ...". The implementer's task was #386 via `/todo` ("Fix #386 first, then #387"). This context holds none of the implementer's reasoning.

## Reasoning
| Criterion | Cited evidence | Result |
|---|---|---|
| (1) N=1 → `req.ip` = rightmost XFF, forged left entry ignored; unset → socket address | tests "1 hop: req.ip is the rightmost X-Forwarded-For entry…" and "unset: req.ip stays the socket address…" (real Express + http) in `Tests: 10 passed, 10 total` | met |
| (1) unset / `0` / non-numeric → not trusted | `it.each` table '', 0, -1, abc, 1.5 → `undefined`, in the same 10 passed | met |
| (2) test file via `npx jest src/__tests__/config/proxy.config.test.ts` | `Tests:       10 passed, 10 total` | met |
| (3) `npm test` no new failures | `5 failed, 604 passed, 609 total`, 61 suites passed. Prior baseline (`private-cv-storage-diff.md`): `5 failed, 594 passed, 599 total`, 60 suites passed. +10 tests / +1 suite = the new file; same 5 env failures (atsPdfIntegration ×4, tokenExpiry ×1) | met |
| (3) build clean (Typecheck: inside Build) | `npm run build \| grep -c "error TS"` → `0` | met |
| (3) lint ≤ 274, none new in touched files | `✖ 274 problems`; per-file now = base for all 6 touched `src/` files (new files 0) | met |
| (4) live two-client check after deploy | reported **not done**, needs `TRUST_PROXY_HOPS=1` on Render + deploy; the node itself declares it an operator follow-up, not verifiable pre-merge. Honest, not claimed | accepted as declared follow-up |
| comments per code-comments.md | row present: why-comments only, no issue refs in non-test `src/`. Touched comments are listed in the Diff table (httpsRedirect, `visitorIp`), each corrected because it became false | met |
| Feature doc (fix, Behavior #1) | `## Feature doc changed` line with operator answers "Bug — #386" (2026-11-07) and "browser gọi thẳng Render URL, không qua relay" (2026-11-08). Doc read: Behavior #1, open-question answer, and Changelog row match. Fix SEAL, so Status stays `verified` (step 11e) | met |
| Commands vs `doctrine/MEMORY.md` | Test, Test one file, Build, Lint rows match; lint baseline 274 cited | ok |
| Output cut/hidden | no `...`/truncated markers; excerpts are the summary lines, as accepted in prior seals | ok |
| Doctrine proposal | none | n/a |
| Supersedes / Still open | `none` / `none` (grep `#386` → this row only) | ok |
| Forbidden states | ADHOC_WORK no (node on diagram) · NO_EVIDENCE no · EDIT_UNVERIFIED no · CODE_IN_HAVEN no (only `.md` in `haven/`) · DIAGRAM_DRIFT no (status moved here) | ok |
| Seal gate | no outward action in this pass; commit/push via `/ship`, Render env var is a separate operator action | ok |
| Proportionality | config file + 1-line wiring + test + 2 comment corrections made false by the change + CLAUDE.md env row + feature doc. Nothing beyond the node | ok |

Independent spot check (code, not the diff): `grep -rnE "req\.(hostname|host|ips|protocol|secure|subdomains)" src` (non-test) → only a comment in `httpsRedirect.middleware.ts`. So trusting `X-Forwarded-Host`/`-Proto` adds no app-code spoofing path beyond what the note already lists (`express-session` cookie side effect).

Noted, not blocking: `.env.example` still lacks `TRUST_PROXY_HOPS` (implementer could not read it). The fix does nothing until the operator sets `TRUST_PROXY_HOPS=1` on Render, and criterion (4) stays open until then.

## Re-run
none (audit-only: outputs verbatim, commands match `doctrine/MEMORY.md`, not a release gate). No build/lint/test re-run, no diff opened; one read-only `grep` of `src/` as a spot check.
