> "You may not claim an outcome you have not observed." The most-violated
> rule in agent work. Exceptions: none.

## The rule
Only report done once the output has actually been produced and read back
— not once you think the edit is correct.

## Not evidence vs Evidence
| Not evidence | Evidence |
|---|---|
| "This fix should resolve the error" | Ran it again, read the real output |
| "Tests should pass now" | `Tests: 42 passed, 42 total` (verbatim) |

## Why reasoning doesn't count
Reasoning about code isn't running code. Models tend to trust their own
description over an actual check.

## What "read back" means
Copy the EXACT command verbatim from `doctrine/MEMORY.md`, run it, read the
result verbatim, paste it into the evidence note — no paraphrasing, no
summarizing into your own conclusion.

## No exceptions
Can't verify yet → report `blocked`. No "probably fine" exception.

## Failure mode this catches
"Green-by-supposition" — claiming a test passed without actually running
it.

## Enforcement
Implementer: hard rule `TestsBeforeDone`. Verifier: hard rule
`EvidencePerAction` — a claim without enough evidence → REOPEN. Related:
`EDIT_UNVERIFIED`.
