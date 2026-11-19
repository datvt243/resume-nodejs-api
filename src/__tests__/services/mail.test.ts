/**
 * Tests for services/mail.ts — nodemailer is mocked, no real SMTP connection.
 */

import { createTransport } from 'nodemailer';
import { sendAuthLinkEmail } from '@/services/mail';
import { logger } from '@/logger';

const sendMail = jest.fn().mockResolvedValue({});
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail })) }));
jest.mock('@/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

const PATH = '/reset-password?token=raw-token';
const MAIL_ENV = ['NODE_ENV', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'APP_URL'] as const;

const loggedText = () =>
  [logger.info, logger.warn, logger.error].flatMap((fn) => (fn as jest.Mock).mock.calls.flat().map((arg) => JSON.stringify(arg))).join('\n');

describe('sendAuthLinkEmail', () => {
  const saved = Object.fromEntries(MAIL_ENV.map((key) => [key, process.env[key]]));

  beforeEach(() => {
    jest.clearAllMocks();
    MAIL_ENV.forEach((key) => delete process.env[key]);
  });

  afterAll(() => {
    MAIL_ENV.forEach((key) => {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  it('sends a plain-text email with the APP_URL link in the requested language', async () => {
    Object.assign(process.env, { SMTP_HOST: 'smtp.test', SMTP_PORT: '465', SMTP_USER: 'u', SMTP_PASS: 'p', MAIL_FROM: 'Resume <no-reply@test.com>', APP_URL: 'https://app.test/' });

    await sendAuthLinkEmail('a@test.com', 'resetPassword', PATH, 'en');

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.test', port: 465, secure: true, auth: { user: 'u', pass: 'p' }, socketTimeout: 10_000 }),
    );
    expect(sendMail).toHaveBeenCalledWith({
      from: 'Resume <no-reply@test.com>',
      to: 'a@test.com',
      subject: 'Reset your password',
      // Trailing slash on APP_URL dropped, so the frontend route still matches.
      text: expect.stringContaining(`\nhttps://app.test${PATH}\n`),
    });
    expect(sendMail.mock.calls[0][0]).not.toHaveProperty('html');
  });

  it('rejects when the SMTP send fails, so the caller decides how to handle it', async () => {
    Object.assign(process.env, { SMTP_HOST: 'smtp.test', APP_URL: 'https://app.test' });
    sendMail.mockRejectedValueOnce(new Error('smtp down'));

    await expect(sendAuthLinkEmail('a@test.com', 'verifyEmail', PATH)).rejects.toThrow('smtp down');
  });

  it.each([
    ['SMTP_HOST missing', { APP_URL: 'https://app.test' }],
    ['APP_URL missing', { SMTP_HOST: 'smtp.test' }],
  ])('in production with %s: warns without the token and sends nothing', async (_label, env) => {
    Object.assign(process.env, { NODE_ENV: 'production', ...env });

    await sendAuthLinkEmail('a@test.com', 'resetPassword', PATH);

    expect(createTransport).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(loggedText()).not.toContain('raw-token');
  });

  it('outside production with no SMTP configured: logs the full link instead of sending', async () => {
    Object.assign(process.env, { NODE_ENV: 'development' });

    await sendAuthLinkEmail('a@test.com', 'resetPassword', PATH);

    expect(createTransport).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(PATH));
  });
});
