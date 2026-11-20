# Analyst spec — account-settings (#412)

## Task (verbatim)
Title: Change password and change email for a signed-in candidate
Body:
## Problem
The frontend Account settings page (datvt243/resume-vuejs-website, `/dashboard/account-settings`) shows "Change email" and "Change password" as disabled "coming soon": the API has no endpoint for a signed-in user (only forgot/reset by token).
## Expected
- `POST /api/v1/auth/change-password` `{ currentPassword, password, repassword }`: current password checked, same strength rules as register; success revokes other sessions (cf. #393).
- Change email: endpoint + re-verification flow (to be specified).
The frontend buttons can then be enabled.
---
Decided by the operator while confirming `agent-hub/doctrine/features/account-settings.md` (2026-11-07). (That file did not exist; created now.)

## Doc path
`doctrine/features/account-settings.md` (new; no INDEX row matched — `candidate-account` lists email/password change as out of scope). INDEX row added.

## Sources read
`doctrine/features/INDEX.md`, `candidate-account.md`, `auth-password-reset.md`, `auth-register-login.md`, `doctrine/domains/PROJECT.md` (Invariants, Decisions), `doctrine/MEMORY.md` (test commands), `src/routers/api/v1/auth.route.ts`, `src/auth/auth.validate.ts`, `src/auth/auth.service.ts`, `src/auth/auth.controller.ts` (exports), `src/utils/emailVerification.ts`, `src/utils/sessionRevocation.ts`, `src/utils/authCookies.ts` (exports), `src/services/mail.ts`, `src/models/candidate.model.ts`, `src/routers/index.ts` (email-based public route), `src/__tests__/auth/` listing.

## Key code facts
- `invalidateAllSessions` revokes every token with `iat < now`, including the caller's → "revoke other sessions" needs a fresh pair for the caller (Q2).
- `/api/me/:email` falls back to email → changing email breaks old email links (Q9).
- `services/mail.ts` `AuthMailKind` = resetPassword | verifyEmail only → change-email needs a new kind.

## Questions (open, round 1)
Q1–Q10 as listed in the doc's Open questions, each with a recommended default. No answers yet.

## Isolation proof
Spawned as a separate analyst subagent with only the issue text + bundle paths; no implementer reasoning, diff or plan was provided. Everything above came from files read in this spawn.

## Status
needs_input (round 1)
