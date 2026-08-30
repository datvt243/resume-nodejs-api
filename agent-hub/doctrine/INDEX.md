# doctrine/INDEX.md — map of doctrine

> Doctrine is VERIFIED TRUTH. Guesses and half-formed ideas do NOT belong
> here — those belong in an `evidence/` note or a diagram note.

## Read in this order
| File | What it is | When you need it |
|---|---|---|
| `SOUL.md` | Hub agent identity | Before deciding to change anything on your own |
| `MEMORY.md` | Path, stack, exact commands | Every session, right away |
| `domains/PROJECT.md` | Project-specific ground truth | Before implementing |
| `standards/edit-verification.md` | Rule: never claim what you haven't observed | Before reporting "done" |
| `standards/recipes.md` | What a recipe is, when to write one | When repeating a procedure a second time |

## The three kinds of knowledge here
| Kind | Home | Example |
|---|---|---|
| About the hub | `SOUL.md` / `MEMORY.md` | The exact test command (`npm test`) |
| About the domain/project | `domains/PROJECT.md` | CORS `origin: '*'` is a known trap |
| About how to work | `standards/*.md` | The required recipe format |

A fact filed in the wrong place is a fact nobody trusts.

## Growing the doctrine
Only add a file/entry when ALL 3 hold: (1) verified, (2) durable, (3) NOT
INFERABLE — an agent can't derive it from 2 minutes of reading code. Fails
(3) → don't write it — doctrine that just echoes code goes stale silently
and misleads readers.

## Correcting the doctrine
Fix the file, AND record "what I believed / what's actually true" in the
Corrections table in the relevant worker's `MEMORY.md`. Silently deleting a
wrong fact loses the lesson behind it.

## Deliberately absent
No `laws/`, `architecture/`, `uplifts/`, `training/`. Add only once a real
lesson requires it — not preemptively.
