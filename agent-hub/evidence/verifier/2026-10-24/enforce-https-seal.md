# 2026-10-24 - enforce-https (verdict)

- Worker: verifier (subagent, dispatched via Agent tool) · Node: `enforce-https` in `haven/diagrams/dev-loop.prime-mermaid.md` (GitHub #292) · New PM status: SEALED

## Isolation proof
Spawned as a fresh subagent with description "agent-hub VERIFIER: enforce-https" and a task prompt (run `verify_seal` for this one node; make explicit judgment calls on the reused `npm test` baseline, the cited lint baseline, and security proportion) that the implementer pass did not have. This subagent wrote none of the code under review.

## Verdict
SEAL

## Criteria
| # | Criterion | Evidence cited (from `evidence/implementer/2026-10-24/enforce-https-diff.md`) | Verified |
|---|---|---|---|
| 1 | prod + `x-forwarded-proto: http` → 308 to `https://<host><originalUrl>`, method + body preserved | `✓ 308-redirects a plain-HTTP request to https, keeping host + path + query`, `✓ uses 308 for POST too`, `✓ reads the first value of a multi-hop x-forwarded-proto`; smoke `proto=http /api/me/search=308 location=https://localhost:3399/api/me/search?q=dev`, `POST /api/v1/auth/login=308` | yes |
| 2 | https / no header / non-prod pass through | `✓ passes https and header-less requests through`, `✓ is a no-op outside production`; smoke `no-header 200`, `proto=https 200` | yes |
| 3 | `/health` never redirected | `✓ never redirects /health`; smoke `proto=http /health=200` | yes |
| 4 | Mounted in `server.ts` before body parsing/routes | Diff table: `app.use(httpsRedirect)` right after `requestLogger`, before helmet/body parsing/routes | yes |
| 5 | Real-HTTP test covers 1-3 + HSTS still present | `Tests: 7 passed, 7 total` (ephemeral Express app, real HTTP) incl. `✓ still sends HSTS on https responses`; smoke `Strict-Transport-Security: max-age=31536000; includeSubDomains` | yes |
| 6 | `npm test` + build no new failures vs staging, lint 0 new | Build `BUILD_RC=0`. Test `5 failed, 465 passed, 470 total`, only `tokenExpiry` + `atsPdfIntegration`. Lint `275 problems` = baseline 275; new files `npx eslint` clean. Judgments below. | yes (with judgment) |
| 6b | comments per code-comments.md | Note lists: file JSDoc (WHY header-read vs `trust proxy`), `//` WHY `/health` exempt, `//` WHY 308 not 301, test JSDoc (WHY `redirect: 'manual'`). Note description was sufficient, but per the comments-row exception I also read ONLY the comment lines of `src/middlewares/httpsRedirect.middleware.ts` (grep of comment lines): all WHY, one-sentence `//`, multi-sentence in `/** */`, no `(#N)`, no narrated history. `@author/@see` tags match the sibling-middleware header convention (opt-in is OFF, but not a Delete-list item). | yes |

### Judgment 1 — reused `npm test` baseline
Sufficient. Read-only checks: `staging` = `origin/staging` = `HEAD` = `1aff48c` (the #293 merge), so the baseline the `add-graceful-shutdown` verdict accepted (463 total, 5 failed in the same 2 suites, proven with diff stashed) is exactly this branch's base. Arithmetic holds: 470 = 463 + 7 new tests, 465 = 458 + 7, failures unchanged at 5. Env causes still present: `.env:27 TOKEN_EXP_IN=3h`, repo `.cache/puppeteer` absent. Neither suite touches the redirect middleware. A fresh stash run would prove nothing new.

### Judgment 2 — lint baseline 275 cited, not re-measured
Adequate. The #293 verdict recorded `275` with that diff applied; that diff is now staging (`1aff48c`), and nothing else landed since (staging == HEAD base). So 275 is the current staging count; 275 after this diff = 0 new, corroborated by the clean targeted `npx eslint` on all three touched/new files.

### Judgment 3 — security proportion
Criteria met as written: (1) literally specifies `https://<host><originalUrl>` from `x-forwarded-proto`, and the node explicitly puts `trust proxy` out of scope (own node; logged under "Noticed, not done"). Host-header use: a forged `Host` only produces a redirect on the forger's own request (no cache layer in this app to poison; Render's proxy sets Host to the routed domain), so no criterion-required risk is left unaddressed. Spoofed `x-forwarded-proto: https` only skips the forger's own redirect, and HSTS still covers real browsers. Nothing in the note suggests an unaddressed risk the criteria require.

## Checks
- Command match: `npm test`, `npx jest <file>`, `npm run build`, `npm run lint` from repo root — match `doctrine/MEMORY.md`. Build output present (`BUILD_RC=0`).
- Truncation: summary/PASS-FAIL lines and RC codes excerpted, not redacted; the first failed test run and first failed smoke attempt are disclosed with cause. OK.
- 6b: `grep 292|enforce-https` on diagrams → only this row. Note has `## Supersedes: none`. OK.
- Forbidden states: ADHOC_WORK no (node + worker identity); NO_EVIDENCE no (plan + diff notes); EDIT_UNVERIFIED no (test/build/lint/smoke cited); CODE_IN_HAVEN no (`git status`: only `src/`, evidence, diagram .md); DIAGRAM_DRIFT no (PENDING → SEALED here).
- Seal gate: uncommitted, unpushed (`git status`). None needed.
- Proportion: 1 middleware, barrel export, 1 mount line, 1 test file; HSTS reused from helmet, no `trust proxy` change. Matches the node exactly.
- Diagram: row archived to `haven/diagrams/dev-loop-archive.md`, active row replaced in place with pointer; pointer rows exceeded 20 → oldest (`add-visit-profile-tracking`) pointer removed. Supersedes: none.

## Re-run: none
No test/build/lint re-run. Read-only only: `git status`, `git rev-parse staging origin/staging HEAD`, `grep TOKEN_EXP_IN .env`, `ls .cache/puppeteer`, grep of comment lines in `src/middlewares/httpsRedirect.middleware.ts` (comments-row exception).
