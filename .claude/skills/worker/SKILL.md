---
name: worker
description: "Become an agent-hub worker (analyst, implementer or verifier) and carry out one task following exactly that worker's recipe. Usage: /worker [analyst|implementer|verifier] \"[task]\" Use when running one loop role by hand instead of /todo."
argument-hint: <analyst|implementer|verifier> "<task>"
---

# /worker <wid> "<task>"

> Runs ONE worker for ONE task. Never works "generically" outside the
> role — every action must trace back to `haven/workers/<wid>/`.

> [added 2026-09-05] For `verifier` only, the task argument can be 1
> evidence note path, SEVERAL paths at once (batch), or the keyword
> `all-pending` (every node in `sealed_pending_verifier` on the active
> diagram) — see "Batch verify" in `recipes/verify_seal.md`. Batching only
> pools the subagent spawn cost (bundle loaded once for the whole batch);
> the verdict is still computed SEPARATELY and INDEPENDENTLY per node.

> **`analyst`** (BA, kit 2026-11-06): MUST run as a **separate subagent**
> (Agent tool, blank context). The subagent loads
> `agent-hub/haven/workers/analyst/` (`manifest.yaml`, `SOUL.md`,
> `recipes/spec_feature.md` — no MEMORY.md) and gets the task (issue title
> + body) plus any operator answers from a previous round. Returns
> `spec_ready` | `needs_input` (relay its questions to the operator
> verbatim, never answer them yourself; re-run with the answers) |
> `no_feature` | `blocked`. Backfill an existing feature by hand:
> `/worker analyst "document <feature>"`.

## Mandatory run loop
1. **Load bundle** — read in exactly this order:
   `agent-hub/haven/workers/<wid>/manifest.yaml` →
   `agent-hub/haven/workers/<wid>/SOUL.md` →
   `agent-hub/haven/workers/<wid>/MEMORY.md` (if present) →
   every file in `agent-hub/haven/workers/<wid>/recipes/`.
2. **Become the worker**:
   - `implementer`: runs right in the current session — reads real code,
     edits `src/`, needs the interactive seal gate with the operator so it
     can't be split into another session.
   - `verifier`: do NOT play the verifier in the current session. Use the
     **Agent tool** to dispatch an independent subagent (foreground,
     `run_in_background: false` — the verdict is needed before
     continuing). The subagent prompt must be fully self-contained: the
     content of the verifier's `manifest.yaml` + `SOUL.md` +
     `recipes/verify_seal.md`, the path of the evidence note to grade, and
     the related node on the diagram. The subagent reads the note +
     diagram + `CLAUDE.md` itself, writes its verdict into
     `evidence/verifier/` itself, and updates PM status itself on SEAL.
     This is how `NeverVerifyOwnWork` is really implemented — the subagent
     has no conversation history of the implement pass. [added
     2026-09-06] No hook actually blocks skipping this spawn step —
     `NeverVerifyOwnWork` is an infrastructure constraint, not a
     self-discipline promise. The real defense is a citeable trace:
     `recipes/verify_seal.md` step 1b makes the verifier record its own
     spawn proof in the `## Isolation proof` line of the verdict note, so
     a later audit can detect a skipped context split. (kit 2026-11-07)
     Spawn it with `model: "sonnet"` (it checks cited evidence against
     criteria, doesn't design). The spawn prompt names the absolute hub
     path, the note path(s) and node slug(s) — never make the subagent
     `ls` around to find its inputs, and never add re-run instructions
     ("re-run the checks yourself") — `verify_seal.md`'s "Re-run scope"
     alone decides. (kit 2026-11-18)
     Only exception to a fresh spawn: `/todo`'s REOPEN rounds resume the
     same verifier subagent (`todo` step 3) — still never the
     implementer's context.
3. **Follow recipe** — pick the recipe matching the worker's `quick_actions`:
   - `implementer`: `pick_next` then `implement` (see
     `recipes/pick_next.md`, `recipes/implement.md`).
   - `verifier`: `verify_seal` (see `recipes/verify_seal.md`) — this recipe
     runs INSIDE the subagent, not in the main session.
   Follow the recipe's numbered Steps exactly — never invent new steps.
4. **Seal gate** — before any outward-facing action (commit, push,
   delete, external API call), STOP, show the diff/action, wait for the
   operator's approval. No approval = don't do it. Applies to `src/` — does
   NOT apply this way to writes into `agent-hub/` (see the Visibility
   section below).
5. **Exit** — the implementer stops at `status: sealed_pending_verifier`
   (never claims `done` itself); the verifier (via subagent) stops at
   `SEAL` or `REOPEN`. Always write an evidence note per
   `agent-hub/evidence/README.md` before finishing — even when running as
   a subagent.

## agent-hub visibility in the session
`agent-hub/` is documentation for the AI to read, not for coders — this
rule applies to EVERY change in `agent-hub/`, whether editing an existing
file (diff) or creating a new one (a new evidence note, the 2nd/3rd note
when REOPEN loops, etc.) — neither may be pasted into chat: no git diff,
no pasting/quoting the content of a file just written, no re-describing
"what it says". After each write print exactly 1 line
`agent-hub content updated`, then on completion report `done` with the
verdict (SEAL/REOPEN/blocked). The `src/` diff (real code) is still shown
in full as the seal gate requires — the suppress rule only applies to
`agent-hub/`.

## Hard constraints (override every other skill text)
- `implementer` has no `seal_actions` — never sets PM status itself.
- `verifier` (subagent) refuses to grade a diff written by the implementer
  session in the same original conversation if invoked the wrong way
  (`NeverVerifyOwnWork`) — report the error and stop if detected; normally
  this can't happen because the subagent is always a fresh context.
- Missing evidence for a claim = may not report completion, even for a
  single criterion (`EDIT_UNVERIFIED`, `NO_EVIDENCE`).
- Test/build commands are always copied verbatim from
  `agent-hub/doctrine/MEMORY.md` — still `<<FILL>>` → report `blocked`,
  don't guess.

## Example
```
/worker implementer "fix CORS origin '*' per the trap in doctrine/domains/PROJECT.md"
/worker verifier "verify node fix-chrome-executable-path"
```
