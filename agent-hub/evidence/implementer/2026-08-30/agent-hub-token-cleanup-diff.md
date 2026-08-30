# 2026-08-30 — agent-hub-token-cleanup

- Worker: implementer
- Version: 0.1.0
- Node: `agent-hub-token-cleanup-20260830` (new node, `IN_PROGRESS` —
  chore, no `src/` code)
- Task (verbatim): operator, in a session working on the sibling
  `vue-resume-web` (frontend) repo, ran that repo's own `/hub-tokens` and
  found this backend repo has the same pattern (flagged, not fixed, in
  that session's `REPORT-TOKENS.md`). Follow-up in this repo: "hãy fix
  luôn cho backend" (go ahead and fix it for backend too).

## Diff
| File | Why |
|---|---|
| `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` | Moved 7 full SEALED rows (dated 2026-08-29/2026-08-30: `add-open-to-work-status`, `consolidate-v1-v2-auth`, `add-json-export-format`, `add-candidate-cv-upload`, `add-public-profile-visibility-toggle`, `add-email-verification`, `add-project-cert-award-image-upload`) to compact pointer rows; updated the header note. |
| `agent-hub/haven/diagrams/dev-loop-archive.md` | Appended the 7 rows' full original text VERBATIM (no rewording, per the archive's own no-rewrite convention) under a new "2nd pass" section + header note. |
| `.claude/skills/boot/SKILL.md` | Step 2: don't explicitly `cat`/`Read` `agent-hub/CLAUDE.md` (harness auto-injects it once step 1 touches `agent-hub/`). Step 7: use `find <dir> -maxdepth 2 -type f -name "*.md" -exec ls -t {} +` instead of `ls -lat <dir>` (this repo's evidence layout uses `<date>/` subfolders, hence `-maxdepth 2` vs the frontend repo's `-maxdepth 1`). Added a Rules bullet about the >15KB archive signal. |

## Why (root cause, found in a different repo, applied here on request)
While working in the sibling `vue-resume-web` frontend repo this same
day, the operator's session found and fixed 2 real duplicate-reading
problems, plus a diagram-bloat issue, and then asked me to also carry the
fix to this repo's `agent-hub-init` template and to check this repo's own
hub. This repo's `/hub-tokens` (run from that session) showed the exact
same 2 symptoms here:
1. Active diagram at 24,649B (>15KB threshold), 7 SEALED entries not
   archived — same recurring-cost problem the frontend repo had.
2. This repo's `.claude/skills/boot/SKILL.md` step 2 explicitly read
   `agent-hub/CLAUDE.md`, and step 7 had no guidance on HOW to list recent
   evidence notes — same latent risk (duplicate CLAUDE.md read via the
   harness's auto-injection; wrong `ls -lat` output observed in the
   frontend repo's own sandbox session).

## Command
```
npm test
npm run build
```
(both from `doctrine/MEMORY.md` — sanity check only; this diff touches no
application code, `.md`/skill files aren't part of either command's
scope.)

## Output (verbatim)
```
Test Suites: 10 passed, 10 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        4.188 s, estimated 5 s
Ran all test suites.
```
```
> nodejs-resume-api@1.1.0 build
> tsc && npm run copy

> nodejs-resume-api@1.1.0 copy
> cp -R ./src/views ./src/public ./dist/
```
Both identical to the pre-diff baseline (54/54 tests, same suite count;
`tsc` clean, no errors) — not caused/affected by this diff.

## Acceptance
| Criterion | Evidence |
|---|---|
| Active diagram back under the 15KB threshold | `wc -c agent-hub/haven/diagrams/dev-loop.prime-mermaid.md` → `9282` (was `24649`) |
| Archive has the 7 rows verbatim, nothing reworded | Diff on `dev-loop-archive.md` — appended text is byte-identical to what was removed from the active file (same edit old/new pair reused) |
| Skill fixes match what was actually observed wrong (in the sibling frontend repo's session, same class of harness/sandbox behavior) | `.claude/skills/boot/SKILL.md` diff — both changes cite the specific observed failure |
| `npm test` still green | `Tests: 54 passed, 54 total` |
| `npm run build` still green | `tsc && npm run copy` completed with no error output |
| No app code touched | `git diff --stat` scope limited to `agent-hub/haven/diagrams/*` and `.claude/skills/boot/SKILL.md` |

## Noticed, not done
None new — this is a follow-on chore from the frontend repo's session,
not an independent audit of this repo's own code.

## Seal gate
No outward-facing action taken (no commit/push) — deferred to the
operator's decision (`/ship` or manual commit), following this repo's own
convention that agent-hub writes still go through the same seal gate as
any other outward-facing action before actually landing in git history.
