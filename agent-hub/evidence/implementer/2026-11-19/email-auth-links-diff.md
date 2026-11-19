# 2026-11-19 - email-auth-links (diff)
Worker: implementer · Version: 0.1.0 · Node: `haven/diagrams/dev-loop.prime-mermaid.md` → `email-auth-links` · Task: `/todo #461` (labels `enhancement`, `security`) · Branch: `feature/461-password-reset-email` (cut from `staging` @ 7e704be)
Plan: `evidence/implementer/2026-11-19/email-auth-links-plan.md`

## Hub bytes before: 99127

## Feature doc: doctrine/features/auth-password-reset.md (rules 7–11), doctrine/features/auth-register-login.md (rules 10–11)
Written by the analyst pass 0 (`evidence/analyst/2026-11-19/password-reset-email-spec.md`), all open questions answered by the operator; Q9 (`APP_URL` unset with SMTP set → "not configured") and "register send failure → still 201" confirmed by the operator 2026-11-19 in the main session (AskUserQuestion). Implementation follows the doc; doc not edited by the implementer.

## Diff
- `src/services/mail.ts` (new): `sendAuthLinkEmail(to, kind, path, lang)` — env read per call (`SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`, `APP_URL`, `NODE_ENV`). `SMTP_HOST` or `APP_URL` unset → production: `logger.warn` without link, no send; otherwise `logger.info` with the link (rule 11 / Q9). Else Nodemailer `createTransport` (`secure` iff port 465, 10s connection/greeting/socket timeouts, auth only if `SMTP_USER`) → `sendMail` plain `text` only, subject/body from `t('mail.<kind>.*', lang)`, link = `APP_URL` (trailing `/` stripped) + path, inserted with a replacer function. Rejects on send failure.
- `src/auth/auth.service.ts`: local `emailAuthLink` = fire-and-forget `sendAuthLinkEmail(...).catch(logger.error(message only))`. `handlerRegister`: token log line → `emailAuthLink(email,'verifyEmail','/verify-email?token=…',lang)`. `handlerForgotPassword`: token log line → `logger.info('Reset requested for candidate <id>')` + `emailAuthLink(email,'resetPassword','/reset-password?token=…',lang)`. STUB comments removed/rewritten.
- `src/locales/vi.ts`, `src/locales/en.ts`: `mail.resetPassword|verifyEmail.{subject,body}` (body has `{link}`).
- `src/utils/passwordReset.ts`, `src/utils/emailVerification.ts`: stale "no email infra" header NOTE → one line pointing at `services/mail.ts`.
- `src/routers/api/v1/auth.route.ts`: two swagger `summary` lines no longer say "stub".
- Tests: `src/__tests__/auth/auth.service.test.ts` (mail module mocked, logger mock gains `warn`, `loggedText()`/`flushPromises()` helpers; register: send asserted + prod/no-token/failure test; forgot-password: send asserted with exact path + `en`, not sent for unknown email, prod logs only candidate id and never token/email, does not wait for send, failure → generic message + error log without token). New `src/__tests__/services/mail.test.ts` (nodemailer mocked: transport opts + plain text + lang + trailing slash; send failure rejects; prod with SMTP_HOST / APP_URL missing → warn once, no transport, no token; dev no SMTP → link logged).
- Deps: `nodemailer@^10.6.0`, dev `@types/nodemailer@^8.0.2`. First installed `nodemailer@6.10.1` → `npm audit` listed 22 advisories on `nodemailer <=10.1.3` (high) → upgraded to 10.6.0 (`engines node >=20`, CJS main) → `npm audit`: nodemailer clean.
- Docs: `.env.example` (SMTP_*, MAIL_FROM, APP_URL, empty values), root `CLAUDE.md` env block, `.claude/rules/api.md` (forgot/verify rows), `README.md` feature line. `.env.development`/`.env.production` not touched (hold real values).

## Command
From `/Users/_david/Workspace/Project/resume/resume-nodejs-api` (copied from `doctrine/MEMORY.md`):
- `npx jest src/__tests__/auth/auth.service.test.ts src/__tests__/services/mail.test.ts`
- `npm test`
- `npm run build` (Typecheck = `inside Build`)
- `npm run lint`; touched files `npx eslint <files>` vs base (`git stash`)
- Red-before: `git stash push -- src/auth/auth.service.ts` → `npx jest src/__tests__/auth/auth.service.test.ts` → `git stash pop`

## Output
Targeted (post-review):
```
    ✓ sends a plain-text email with the APP_URL link in the requested language (4 ms)
    ✓ rejects when the SMTP send fails, so the caller decides how to handle it (4 ms)
    ✓ in production with SMTP_HOST missing: warns without the token and sends nothing (1 ms)
    ✓ in production with APP_URL missing: warns without the token and sends nothing
    ✓ outside production with no SMTP configured: logs the full link instead of sending (1 ms)
      ✓ should register successfully with new email (1 ms)
      ✓ never logs the verification token in production and still succeeds when the email fails (1 ms)
      ✓ creates a reset token and emails the link when the email exists
      ✓ returns the same generic success message when the email does not exist (no user enumeration) (1 ms)
      ✓ never logs the reset token in production, only the candidate id
      ✓ responds without waiting for the SMTP send, so a registered email is not slower to answer
      ✓ still returns the generic message when sending fails, logging the error without the token
Tests:       23 passed, 23 total
```
Full:
```
BUILD_EXIT=0
Test Suites: 76 passed, 76 total
Tests:       801 passed, 801 total
✖ 273 problems (273 errors, 0 warnings)
```
Touched files lint: `✖ 10 problems (10 errors, 0 warnings)`, all `10 @typescript-eslint/unbound-method` in `src/__tests__/auth/auth.service.test.ts`; base (stashed) same 2 files: `✖ 10 problems (10 errors, 0 warnings)`, same rule (`expect(CandidateModel.findOne)` pattern, pre-existing). New files 0.
Red-before (base `auth.service.ts`, new tests):
```
      ✕ should register successfully with new email (1 ms)
      ✕ never logs the verification token in production and still succeeds when the email fails (1 ms)
      ✕ creates a reset token and emails the link when the email exists
      ✕ never logs the reset token in production, only the candidate id (1 ms)
      ✕ still returns the generic message when sending fails, logging the error without the token (2 ms)
Tests:       5 failed, 13 passed, 18 total
```
("responds without waiting" passes on base trivially — base sends nothing; it is red against the intermediate awaited version, which is what it guards.)

## Acceptance
| Criterion | Evidence |
|---|---|
| reset: mail mock called once with registered email + link containing token; not for unregistered | `✓ creates a reset token and emails the link…` (`toHaveBeenCalledTimes(1)`, `('test@example.com','resetPassword','/reset-password?token=raw-token','en')`); `✓ returns the same generic…` (`not.toHaveBeenCalled`) |
| reset: prod → no logger arg contains `raw-token` | `✓ never logs the reset token in production, only the candidate id` (also no email address; info has `user_id`) |
| reset: mail rejects → generic success, error log without token | `✓ still returns the generic message when sending fails…` |
| reset: prod + no SMTP_HOST → no send, warn, no token | mail.test `✓ in production with SMTP_HOST missing…` (+ APP_URL missing, Q9) |
| register: mail called once with new email + link with token | `✓ should register successfully with new email` (`expect.stringContaining('verify-token')`, `'vi'`) |
| register: prod → no token in logs; mail rejects → still success | `✓ never logs the verification token in production and still succeeds when the email fails` |
| mail module mockable, no real SMTP in `npm test` | `jest.mock('@/services/mail')` / `jest.mock('nodemailer')`; full run 801 passed, no network |
| plain text only, `?lang=` language, `From`=`MAIL_FROM` | mail.test `✓ sends a plain-text email…` (subject `Reset your password` for `en`, `from`, `not.toHaveProperty('html')`) |
| dev no SMTP → link logged as today | mail.test `✓ outside production with no SMTP configured…` |
| `npm test` + `npm run build` green | `Tests: 801 passed`, `BUILD_EXIT=0` |
| lint ≤ 274, none new in touched files | `273`; touched before = after (10, same rule), new files 0 |
| comments per code-comments.md | `mail.ts`: file overview JSDoc + `/** */` on exported fn (WHY: never logs link in prod), `//` WHY on per-call env read and on timeouts; `auth.service.ts`: `/** */` WHY on `emailAuthLink` (timing + failure), rewritten register comment, STUB text removed; utils headers trimmed to 1 pointer line; tests: `//` WHY on `flushPromises` and trailing slash. No `(#N)` refs. |

## Supersedes: none
`grep "#461"` on the active diagram → only this node.

## Still open: none

## Review
`/code-review medium` (forked; it could not run `git diff`, reviewed files directly) — 8 findings:
1. forgot-password awaited SMTP → registered emails slower (timing enumeration) → **fixed**: `emailAuthLink` is fire-and-forget; new test `✓ responds without waiting…`.
2. No SMTP timeouts → **fixed** (10s connection/greeting/socket).
3. register awaited SMTP → **fixed** by #1.
4. Link logged whenever `NODE_ENV !== 'production'` (staging with NODE_ENV unset would log live tokens) → per spec rule 11 (operator Q7 answer) → kept; `## Noticed, not done` #1.
5. `String.replace` `$`-pattern expansion → **fixed** (replacer function).
6. Trailing slash on `APP_URL` → **fixed** (stripped; asserted in mail.test).
7. Transport built per email → not done (sends off the request path, low volume) → Noticed #2.
8. Stale "no email infra" comments → **fixed** in `utils/passwordReset.ts`, `utils/emailVerification.ts`; `auth.forgotPasswordRequested` text ("has been generated") left — many tests pin the exact string, Noticed #3.
`/security-review` (issue labeled `security`, subagent on the working-tree diff): no finding ≥ 8. Closest (7): the same timing gap as #1 → fixed. Rejected candidates: tokens in prod logs (only dev fallback logs link; Nodemailer errors carry SMTP reply, not body), CRLF via `to` (Joi email + TLD allow-list, exact DB match), host injection (`APP_URL` env only), `lang` keys (fixed by `kind` union), STARTTLS not required on 587 (hardening) → Noticed #4; SMTP reject reply may quote the address in the error log → Noticed #5.
Step 5 re-run after fixes — Output above is the post-fix run.

## Noticed, not done
1. Non-production fallback logs the live link for any `NODE_ENV` other than `production` (e.g. a staging deploy with SMTP unset). Per spec rule 11; if staging deploys exist, set `NODE_ENV=production` there or add SMTP.
2. One Nodemailer transport per send (new TCP/TLS each time). Cache it if volume grows.
3. `auth.forgotPasswordRequested` still says "link has been generated" / "đã được tạo" — could say "sent"; pinned by several tests.
4. `requireTLS` not set: on 587 a network attacker could strip STARTTLS and read the link. `requireTLS: true` would break plain local SMTP catchers (Mailpit) — operator call.
5. Nodemailer error messages can quote the recipient address (e.g. `550 <addr> rejected`) → `logger.error` in prod may contain an email address (no token). Rule 7 is about forgot-password's own log line; flag if strict.
6. `createResetToken` still runs only for registered emails (one Redis write) — pre-existing, small timing difference.

## Seal gate
No outward-facing action (no commit/push). `npm install` (local deps) ran; `gh issue develop` (branch) ran as `/todo` Step 0.
