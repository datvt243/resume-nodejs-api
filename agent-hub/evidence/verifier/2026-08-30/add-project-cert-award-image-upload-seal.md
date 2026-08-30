# 2026-08-30 — add-project-cert-award-image-upload (verdict, round 2)

- Worker: verifier (subagent, dispatched via Agent tool)
- Node: `add-project-cert-award-image-upload` (`haven/diagrams/dev-loop.prime-mermaid.md`)
- New PM status: SEALED (was PENDING; round 1 was REOPEN)
- Evidence read: `evidence/implementer/2026-08-30/add-project-cert-award-image-upload-diff.md`
  (round 1 note), `evidence/implementer/2026-08-30/add-project-cert-award-image-upload-diff-2.md`
  (round 2 note), `evidence/verifier/2026-08-30/add-project-cert-award-image-upload-reopen.md`
  (round 1 verdict) — notes only, did not open the `src/` diff directly, per EvidenceOnly.

## Reasoning

1. **Refuse self-grading**: moot — fresh subagent, no memory of either implementer round.

2. **Node exists on diagram, not ad-hoc.** `add-project-cert-award-image-upload` is present
   in `haven/diagrams/dev-loop.prime-mermaid.md` (was PENDING), description matches both
   notes' summary. No ADHOC_WORK.

3. **Test command matches doctrine.** Both notes cite `npm test` run from
   `/Users/_david/Workspace/Project/ResumeAPI/backend`, copied verbatim from
   `doctrine/MEMORY.md`'s command table — matches exactly.

4. **Output not truncated/redacted.** Both notes show "Output (verbatim, tail)" with full
   pass counts (10 suites / 54 tests, zero regressions in both rounds) — same established
   convention as prior SEALED nodes. Round 2's HTTP response bodies are shown in full
   (`success`/`errorCode`/`message` fields complete); only the stack-trace string itself is
   elided with `...`, which is expected verbosity trimming of a stack, not suppression of the
   fact being proven (the `500` + `"message":"Too many files"` + `errorCode` are all intact).

5. **Round 1's exact named gap, closed with real evidence, not re-assertion.** Round 1's
   REOPEN said: acceptance row 1's "<=5 files, <=5MB each" was untested (no 6th-file or
   oversized-file request was ever made), and the "MulterError mapped to 400" claim only
   covered the fileFilter branch, not multer's own `limits`-driven errors. Round 2's note
   shows, as live curl output:
   - 6-file upload against the **unmodified round-1 code** → real `HTTP 500` +
     `errorCode: INTERNAL_SERVER_ERROR` + stack trace — proving the round-1 REOPEN was
     right to flag this as unproven: it was actually broken, not just untested.
   - Oversized (>5MB) single file against the same unmodified round-1 code → real
     `HTTP 400` + friendly message — confirming that specific claim (the `LIMIT_FILE_SIZE`
     branch) *was* already correct.
   - After the fix: 6-file upload → real `HTTP 400` + `"Quá số lượng file cho phép..."`.
   - After the fix: oversized file re-confirmed unchanged at `HTTP 400`.
   - Boundary case, exactly 5 valid files → real `HTTP 200` + persisted `images[]` with 5
     URLs — proves the fix doesn't regress the success path at the cap.
   This is a live before/after comparison on the real defect, not an inference from reading
   code, and it directly answers every part of round 1's "Missing" section.

6. **Fix is proportionate (SmallestDiff).** Round 2's diff table lists exactly two touched
   files: `BaseController.ts` (one added `err.code === 'LIMIT_FILE_COUNT'` branch, ~2 lines)
   and `en.ts`/`vi.ts` (one new locale key each, matching the existing `images.*` key style).
   No unrelated refactor, no re-touching of the ownership check, persistence, static-serving,
   or cleanup code that round 1 already established. This is the minimal change that fixes
   the newly-found bug — not scope creep.

7. **Other round-1 acceptance rows remain adequately evidenced and untouched.**
   - Ownership/IDOR: round 1's live `HTTP 403` test (account B against account A's project)
     stands; round 2's diff does not touch the ownership-check line at all.
   - `images[]` persistence: round 1's `GET /project` reflecting the upload response stands;
     round 2's boundary test (`5 files → 200 + persisted images[]`) reconfirms this path is
     still intact after the fix.
   - Static serving: round 1's real `Content-Type: image/png` + `file`-confirmed PNG bytes
     stands, untouched by round 2's diff.
   - Self-delete cleanup: round 1's before/after `ls` on a fresh account stands; round 2
     re-ran the same style of before/after `ls` check for its own throwaway account and again
     found the directory empty after delete — reconfirmed, not contradicted.
   - `npm run build` clean and `npm test` all-passing: shown verbatim in both rounds.

8. **Seal gate respected in both rounds.** Both notes' "Seal gate" sections state no
   commit/push has happened — diff shown for operator review only. No outward-facing action
   taken without recorded approval.

9. **No forbidden states triggered.**
   - `ADHOC_WORK`: node exists on diagram, both rounds reference it correctly — none.
   - `NO_EVIDENCE`: both rounds have evidence notes under `evidence/implementer/` — none.
   - `EDIT_UNVERIFIED`: every claim in round 2 (the fix works, the boundary still works, the
     bug was real) is backed by shown, non-truncated live HTTP output and a real `npm test`
     run — none.
   - `CODE_IN_HAVEN`: no runnable code in either evidence note or in this verdict/diagram
     edit — none.
   - `DIAGRAM_DRIFT`: node was PENDING despite code having changed across two rounds; this
     verdict updates it to SEALED to match, closing the drift.

10. **Ratchet respected.** Node moves PENDING → SEALED, a forward step only; nothing
    previously SEALED was touched or demoted.

## Verdict: SEAL

Round 2's evidence closes the exact gap round 1 named — the count-limit path was not just
untested but genuinely broken (raw `500` + stack leak), and round 2 proves the fix with a
real before/after HTTP comparison plus an unregressed boundary case, using a proportionate
2-line-plus-locale-keys diff. All other acceptance criteria remain evidenced from round 1
and are unaffected by round 2's narrow fix. Diagram row updated to SEALED with a summary
sentence covering both rounds.
