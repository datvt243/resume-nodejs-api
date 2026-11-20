# Analyst spec — account-settings (#412), round 2

## Task (verbatim, from coordinator)
Operator answered your questions for #412: "all defaults" — accept your recommended default for every one of Q1–Q10 exactly as you stated them. Re-run spec_feature with these answers: fill in the change-email Behavior + acceptance criteria, record the decisions in the doc, mark it confirmed per your recipe, update the INDEX row and write a new analyst evidence note for this round. Never edit src/.

## Doc path
`doctrine/features/account-settings.md` (updated) + INDEX row updated.

## Answers applied
Q1–Q10 = the recommended defaults in round 1 (`account-settings-spec.md`), recorded verbatim-in-substance under the doc's Open questions; Behavior rewritten as rules 1–11 (shared 1–4, change-password 5–7, change-email 8–11); acceptance criteria extended for change-email/confirm.

## Status rule
Recipe step 5: a `feat` spec stays `draft` — only the SEAL of its node verifies it. "Confirmed" is recorded as "open questions answered by operator 2026-11-20", Status left `draft`.

## Analyst-derived (not operator-stated, follow existing conventions)
- Account deleted before confirm → 400 `common.idNotFound` (candidate-account rule 7 convention).
- Pending email change survives a password change (nothing in Q1–Q10 cancels it).
- Equal-to-current email check is case-insensitive (model lowercases email).
- Old-address notice uses the same failure/no-SMTP rules as other auth mail.

## Sources read
Same as round 1 (`account-settings-spec.md`); no new code read.

## Isolation proof
Same analyst subagent as round 1; got only the issue text, bundle paths and the coordinator's relay of the operator answer. No implementer reasoning, diff or plan.

## Status
spec_ready
