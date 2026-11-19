# 2026-11-19 - email-auth-links (plan)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `email-auth-links` · Task: `/todo #461` "Password reset / email verify: tokens are written to logs instead of being emailed", labels `enhancement`, `security`

## Hub bytes before: 99127

## Feature doc: doctrine/features/auth-password-reset.md (rules 7–11), doctrine/features/auth-register-login.md (rules 10–11)
Pass 0 analyst ran (spec mode, 2 rounds) → `spec_ready`, evidence `evidence/analyst/2026-11-19/password-reset-email-spec.md`. Q1–Q8 answered by operator. Analyst's two filled-in points confirmed by operator 2026-11-19 (AskUserQuestion, main session): register send failure → still 201; `APP_URL` unset while SMTP set → treated as "not configured" (Q9). No open question left.

## Acceptance (node criteria)
1. auth-password-reset #461 criteria (forgot-password: mail mock called once with registered email + link containing token, not called for unregistered; prod → no logger arg contains `raw-token`; mail failure → still generic success, error log without token; prod + no SMTP_HOST → warn, no send, no token in logs).
2. auth-register-login #461 criteria (register: mail mock called once with new email + link with token; prod → no token in logs; mail failure → still `{ success: true }`).
3. `npx jest src/__tests__/auth/auth.service.test.ts src/__tests__/services/mail.test.ts` pass.
4. `npm test` + `npm run build` green (pre-existing local failures excepted, cited); `npm run lint` ≤ 274, none in touched files.

## Anchors
- `src/auth/auth.service.ts:71` (verify link log), `:138` (reset link log), STUB comments `:50-67`, `:130-131`.
- `src/locales/vi.ts`, `src/locales/en.ts` (mail subject/body per lang).
- New `src/services/mail.ts`; tests `src/__tests__/auth/auth.service.test.ts`, new `src/__tests__/services/mail.test.ts`.
- New dep `nodemailer` (+ `@types/nodemailer` dev) — none present today.
- Env docs: `CLAUDE.md` env block, `.env.example`.
