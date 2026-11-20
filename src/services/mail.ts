/**
 * Transactional email over SMTP (Nodemailer), configured by SMTP_HOST,
 * SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM and APP_URL (the frontend
 * base URL the links point to).
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { createTransport } from 'nodemailer';
import { logger } from '@/logger';
import { t, DEFAULT_LANG } from '@/utils/i18n';

export type AuthMailKind = 'resetPassword' | 'verifyEmail' | 'confirmEmailChange' | 'emailChanged';

/**
 * Emails `<APP_URL><path>` to `to` as plain text, filling `{name}`
 * placeholders in the body from `params`; rejects if the SMTP send fails.
 * Without SMTP_HOST or APP_URL nothing is sent: outside production the
 * link is logged so local dev still works; production logs only a
 * warning, since the link carries a live token.
 */
export const sendAuthLinkEmail = async (
  to: string,
  kind: AuthMailKind,
  path: string,
  lang: string = DEFAULT_LANG,
  params: Record<string, string> = {},
): Promise<void> => {
  // Read per call, not at import, so tests can switch env between cases.
  const { NODE_ENV, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, APP_URL } = process.env;

  if (!SMTP_HOST || !APP_URL) {
    if (NODE_ENV === 'production') logger.warn(`[mail] SMTP_HOST or APP_URL not set, ${kind} email not sent`);
    else logger.info(`[mail] ${kind} link for ${to}: ${APP_URL ?? ''}${path}`);
    return;
  }

  const port = Number(SMTP_PORT) || 587;
  const link = `${APP_URL.replace(/\/+$/, '')}${path}`;
  await createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    // Nodemailer's defaults (2 min connect, 10 min socket) would keep a dead SMTP host's sends pending for minutes.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    ...(SMTP_USER && { auth: { user: SMTP_USER, pass: SMTP_PASS ?? '' } }),
  }).sendMail({
    ...(MAIL_FROM && { from: MAIL_FROM }),
    to,
    subject: t(`mail.${kind}.subject`, lang),
    // One pass, so a value that itself contains `{...}` (braces are legal in an email local part) is never re-substituted.
    text: t(`mail.${kind}.body`, lang).replace(/\{(\w+)\}/g, (placeholder, key: string) => ({ ...params, link })[key] ?? placeholder),
  });
};
