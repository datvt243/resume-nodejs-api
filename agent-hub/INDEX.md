# INDEX.md — agent-hub inventory

> Doesn't repeat content — just points to it. Read the source file for
> detail.

## Root
| File | Purpose |
|---|---|
| `NORTHSTAR.md` | What "done" means, 3-month success picture |
| `CLAUDE.md` | Agent contract — forbidden states, seal gate, 4 lenses |
| `BOOT.md` | 5 orienting truths for `/boot` |
| `README.md` | Entry point for readers |
| `.gitignore` | Excludes scratch — does NOT ignore `evidence/` |

## doctrine/ — verified truth
| File | Purpose |
|---|---|
| `doctrine/INDEX.md` | Map of doctrine |
| `doctrine/SOUL.md` | Hub agent identity + 7 invariants |
| `doctrine/MEMORY.md` ★ | Path, stack, EXACT COMMANDS — highest authority |
| `doctrine/domains/PROJECT.md` ★ | Resume API ground truth: invariants, traps, decisions |
| `doctrine/standards/edit-verification.md` | Rule: never claim what you haven't observed |
| `doctrine/standards/recipes.md` | What a recipe is, required format |

## haven/ — memory + convention (NEVER contains code)
| File | Purpose |
|---|---|
| `haven/diagrams/dev-loop.prime-mermaid.md` ★ | Single source of truth for every task's state |
| `haven/workers/implementer/` | manifest, SOUL, MEMORY, recipes (`pick_next`, `implement`) |
| `haven/workers/verifier/` | manifest, SOUL, recipes (`verify_seal`) |

## evidence/ — audit trail
| File | Purpose |
|---|---|
| `evidence/README.md` | Note format + the directory's 3 rules |

## .claude/skills/ — harness (outside `agent-hub/`, at repo root)
| File | Purpose |
|---|---|
| `.claude/skills/boot/SKILL.md` | `/boot` command |
| `.claude/skills/worker/SKILL.md` | `/worker <implementer\|verifier> "<task>"` command |
| `.claude/skills/todo/SKILL.md` | `/todo "<task>"` command |

★ = load-bearing file — reading these 4 covers 80% of the mechanism.
