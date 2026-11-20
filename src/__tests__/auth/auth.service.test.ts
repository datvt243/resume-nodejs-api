/**
 * Tests for auth.service.ts
 */

import CandidateModel from '@/models/candidate.model';
import {
  handlerRegister,
  handlerLogin,
  isEmailAlreadyExists,
  handlerForgotPassword,
  handlerResetPassword,
  handlerVerifyEmail,
  handlerChangePassword,
  handlerChangeEmail,
  handlerConfirmEmailChange,
} from '@/auth/auth.service';
import * as bcrypt from '@/utils';
import * as jwt from '@/utils';
import { createResetToken, consumeResetToken } from '@/utils/passwordReset';
import { createVerificationToken, consumeVerificationToken } from '@/utils/emailVerification';
import { invalidateAllSessions, getSessionsInvalidatedAt } from '@/utils/sessionRevocation';
import { ErrorCode } from '@/errors';
import { sendAuthLinkEmail } from '@/services/mail';
import { logger } from '@/logger';

// Mock modules
jest.mock('@/models/candidate.model');
jest.mock('@/utils');
jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils'),
  bcryptGenerateSalt: jest.fn(),
  bcryptCompareHash: jest.fn(),
  jwtSign: jest.fn(),
}));
jest.mock('@/utils/passwordReset', () => ({
  createResetToken: jest.fn(),
  consumeResetToken: jest.fn(),
}));
jest.mock('@/utils/emailVerification', () => ({
  createVerificationToken: jest.fn(),
  consumeVerificationToken: jest.fn(),
}));
jest.mock('@/utils/sessionRevocation', () => ({
  invalidateAllSessions: jest.fn().mockResolvedValue(true),
  getSessionsInvalidatedAt: jest.fn().mockResolvedValue(null),
  isSessionRevoked: jest.requireActual('@/utils/sessionRevocation').isSessionRevoked,
}));
jest.mock('@/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@/services/mail', () => ({ sendAuthLinkEmail: jest.fn().mockResolvedValue(undefined) }));

// The send is fire-and-forget; let its .catch handler run before asserting on logs.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const loggedText = () =>
  [logger.info, logger.warn, logger.error].flatMap((fn) => (fn as jest.Mock).mock.calls.flat().map((arg) => JSON.stringify(arg))).join('\n');

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createVerificationToken as jest.Mock).mockResolvedValue('verify-token');
  });

  describe('isEmailAlreadyExists', () => {
    it('should return true if email exists', async () => {
      (CandidateModel.findOne as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      const result = await isEmailAlreadyExists('test@example.com');

      expect(CandidateModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await isEmailAlreadyExists('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('handlerRegister', () => {
    it('should register successfully with new email', async () => {
      const mockHash = '$2b$10$hashedpassword';
      // CandidateModel.create() keeps `_id: null` as explicitly passed
      // (a pre-existing Mongoose quirk — see the comment in
      // auth.service.ts's handlerRegister) — handlerRegister re-fetches
      // by email afterward to get the real, MongoDB-assigned `_id`.
      const mockSavedDoc = { _id: 'new_id', email: 'new@example.com' };

      (CandidateModel.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // existence check
        // issue #120 — generateUniqueCandidateSlug's uniqueness check
        // (`.findOne(...).select('_id').exec()`), no collision on 1st try
        .mockReturnValueOnce({ select: () => ({ exec: () => Promise.resolve(null) }) })
        .mockResolvedValueOnce(mockSavedDoc); // re-fetch after create
      (bcrypt.bcryptGenerateSalt as jest.Mock).mockResolvedValue(mockHash);
      (CandidateModel.create as jest.Mock).mockResolvedValue({ _id: null, email: 'new@example.com' });

      const result = await handlerRegister({
        email: 'new@example.com',
        password: 'pass123',
        repassword: 'pass123',
      });

      expect(CandidateModel.findOne).toHaveBeenNthCalledWith(1, { email: 'new@example.com' });
      expect(bcrypt.bcryptGenerateSalt).toHaveBeenCalledWith('pass123');
      expect(CandidateModel.create).toHaveBeenCalledWith({
        _id: null,
        email: 'new@example.com',
        password: mockHash,
        slug: expect.stringMatching(/^new-[a-z0-9]+$/),
      });
      expect(CandidateModel.findOne).toHaveBeenNthCalledWith(3, { email: 'new@example.com' });
      expect(createVerificationToken).toHaveBeenCalledWith('new_id');
      expect(sendAuthLinkEmail).toHaveBeenCalledTimes(1);
      expect(sendAuthLinkEmail).toHaveBeenCalledWith('new@example.com', 'verifyEmail', expect.stringContaining('verify-token'), 'vi', {});
      expect(result).toEqual({ success: true, message: 'Đăng ký thành công' });
    });

    it('never logs the verification token in production and still succeeds when the email fails', async () => {
      const prevEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
      (CandidateModel.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockReturnValueOnce({ select: () => ({ exec: () => Promise.resolve(null) }) })
        .mockResolvedValueOnce({ _id: 'new_id', email: 'new@example.com' });
      (CandidateModel.create as jest.Mock).mockResolvedValue({ _id: null, email: 'new@example.com' });
      (sendAuthLinkEmail as jest.Mock).mockRejectedValueOnce(new Error('smtp down'));

      try {
        const result = await handlerRegister({ email: 'new@example.com', password: 'pass123' });
        await flushPromises();

        expect(result).toEqual({ success: true, message: 'Đăng ký thành công' });
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('smtp down'));
        expect(loggedText()).not.toContain('verify-token');
      } finally {
        process.env['NODE_ENV'] = prevEnv;
      }
    });

    it('should fail if email already exists', async () => {
      (CandidateModel.findOne as jest.Mock).mockResolvedValue({ email: 'existing@example.com' });

      await expect(handlerRegister({ email: 'existing@example.com', password: 'pass123' })).rejects.toMatchObject({
        errorCode: ErrorCode.EMAIL_EXISTS,
        statusCode: 409,
        message: 'Email đã tồn tại',
      });
      expect(bcrypt.bcryptGenerateSalt).not.toHaveBeenCalled();
    });
  });

  describe('handlerLogin', () => {
    // Login reads the hash via `.findOne(...).select('+password')`, so the mock has to chain.
    const mockLoginFind = (user: unknown) => {
      const select = jest.fn().mockResolvedValue(user);
      (CandidateModel.findOne as jest.Mock).mockReturnValue({ select });
      return select;
    };

    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        _id: 'user_id',
        email: 'test@example.com',
        password: '$2b$10$storedhash',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockCompareResult = true;
      const mockToken = 'access_token';
      const mockRefresh = 'refresh_token';

      const select = mockLoginFind(mockUser);
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(mockCompareResult);
      (jwt.jwtSign as jest.Mock).mockReturnValueOnce(mockToken).mockReturnValueOnce(mockRefresh);

      const result = await handlerLogin({ email: 'test@example.com', password: 'correctpass' });

      expect(CandidateModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(select).toHaveBeenCalledWith('+password');
      expect(bcrypt.bcryptCompareHash).toHaveBeenCalledWith('correctpass', mockUser.password);
      expect(jwt.jwtSign).toHaveBeenNthCalledWith(1, {
        data: { _id: 'user_id' },
        secretKey: expect.any(String),
        props: expect.objectContaining({ expiresIn: expect.any(String) }),
      });
      expect(jwt.jwtSign).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: { _id: 'user_id' } }));
      expect(result).toEqual({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            email_verified: false,
          },
          token: mockToken,
          tokenRefresh: mockRefresh,
        },
        errors: null,
      });
    });

    it('should fail if user not found', async () => {
      mockLoginFind(null);

      await expect(handlerLogin({ email: 'nonexistent@example.com', password: 'pass' })).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
        statusCode: 401,
        message: 'Email hoặc mật khẩu không chính xác',
      });
      expect(bcrypt.bcryptCompareHash).not.toHaveBeenCalled();
    });

    it('should fail if password incorrect', async () => {
      const mockUser = { _id: 'user_id', email: 'test@example.com', password: 'hash' };

      mockLoginFind(mockUser);
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(false);

      // Same error as the unknown-email case, so login can't enumerate registered emails.
      await expect(handlerLogin({ email: 'test@example.com', password: 'wrongpass' })).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
        statusCode: 401,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    });

    it('localizes the invalid-credentials message to the request lang', async () => {
      mockLoginFind(null);

      await expect(handlerLogin({ email: 'nonexistent@example.com', password: 'pass' }, 'en')).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_CREDENTIALS,
        message: 'Incorrect email or password',
      });
    });
  });

  describe('handlerForgotPassword', () => {
    const GENERIC = { success: true, message: 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được tạo' };

    beforeEach(() => {
      (CandidateModel.findOne as jest.Mock).mockResolvedValue({ _id: { toString: () => 'user_id' }, email: 'test@example.com' });
      (createResetToken as jest.Mock).mockResolvedValue('raw-token');
    });

    it('creates a reset token and emails the link when the email exists', async () => {
      const result = await handlerForgotPassword('test@example.com', 'en');

      expect(CandidateModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(createResetToken).toHaveBeenCalledWith('user_id');
      expect(sendAuthLinkEmail).toHaveBeenCalledTimes(1);
      expect(sendAuthLinkEmail).toHaveBeenCalledWith('test@example.com', 'resetPassword', '/reset-password?token=raw-token', 'en', {});
      expect(result).toEqual({ success: true, message: 'If the email exists, a password reset link has been generated' });
    });

    it('returns the same generic success message when the email does not exist (no user enumeration)', async () => {
      (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await handlerForgotPassword('nonexistent@example.com');

      expect(createResetToken).not.toHaveBeenCalled();
      expect(sendAuthLinkEmail).not.toHaveBeenCalled();
      expect(result).toEqual(GENERIC);
    });

    it('never logs the reset token in production, only the candidate id', async () => {
      const prevEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
      try {
        await handlerForgotPassword('test@example.com');

        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('user_id'));
        expect(loggedText()).not.toContain('raw-token');
        expect(loggedText()).not.toContain('test@example.com');
      } finally {
        process.env['NODE_ENV'] = prevEnv;
      }
    });

    it('responds without waiting for the SMTP send, so a registered email is not slower to answer', async () => {
      (sendAuthLinkEmail as jest.Mock).mockReturnValueOnce(new Promise(() => undefined));

      await expect(handlerForgotPassword('test@example.com')).resolves.toEqual(GENERIC);
    });

    it('still returns the generic message when sending fails, logging the error without the token', async () => {
      (sendAuthLinkEmail as jest.Mock).mockRejectedValueOnce(new Error('smtp timeout'));

      const result = await handlerForgotPassword('test@example.com');
      await flushPromises();

      expect(result).toEqual(GENERIC);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('smtp timeout'));
      expect(loggedText()).not.toContain('raw-token');
    });
  });

  describe('handlerResetPassword', () => {
    it('updates the password when the reset token is valid', async () => {
      const mockHash = '$2b$10$newhashedpassword';
      (consumeResetToken as jest.Mock).mockResolvedValue('user_id');
      (bcrypt.bcryptGenerateSalt as jest.Mock).mockResolvedValue(mockHash);
      (CandidateModel.updateOne as jest.Mock).mockResolvedValue({ acknowledged: true });

      const result = await handlerResetPassword({ token: 'raw-token', password: 'NewPass123!' });

      expect(consumeResetToken).toHaveBeenCalledWith('raw-token');
      expect(bcrypt.bcryptGenerateSalt).toHaveBeenCalledWith('NewPass123!');
      expect(CandidateModel.updateOne).toHaveBeenCalledWith({ _id: 'user_id' }, { password: mockHash });
      expect(invalidateAllSessions).toHaveBeenCalledWith('user_id');
      expect(result).toEqual({ success: true, message: 'Đặt lại mật khẩu thành công' });
    });

    it('fails without touching the password when the token is invalid/expired', async () => {
      (consumeResetToken as jest.Mock).mockResolvedValue(null);

      await expect(handlerResetPassword({ token: 'bad-token', password: 'NewPass123!' })).rejects.toMatchObject({
        errorCode: ErrorCode.BAD_REQUEST,
        statusCode: 400,
        message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      });

      expect(bcrypt.bcryptGenerateSalt).not.toHaveBeenCalled();
      expect(CandidateModel.updateOne).not.toHaveBeenCalled();
      expect(invalidateAllSessions).not.toHaveBeenCalled();
    });
  });

  describe('handlerVerifyEmail', () => {
    it('marks emailVerified true when the verification token is valid', async () => {
      (consumeVerificationToken as jest.Mock).mockResolvedValue('user_id');
      (CandidateModel.updateOne as jest.Mock).mockResolvedValue({ acknowledged: true });

      const result = await handlerVerifyEmail('raw-token');

      expect(consumeVerificationToken).toHaveBeenCalledWith('raw-token');
      expect(CandidateModel.updateOne).toHaveBeenCalledWith({ _id: 'user_id' }, { emailVerified: true });
      expect(result).toEqual({ success: true, message: 'Xác thực email thành công' });
    });

    it('fails without touching the candidate when the token is invalid/expired', async () => {
      (consumeVerificationToken as jest.Mock).mockResolvedValue(null);

      await expect(handlerVerifyEmail('bad-token')).rejects.toMatchObject({
        errorCode: ErrorCode.BAD_REQUEST,
        statusCode: 400,
        message: 'Token xác thực email không hợp lệ hoặc đã hết hạn',
      });

      expect(CandidateModel.updateOne as jest.Mock).not.toHaveBeenCalled();
    });
  });

  // Plain mock properties, so asserting on them doesn't trip @typescript-eslint/unbound-method.
  const candidateMock = CandidateModel as unknown as Record<'findOne' | 'findById' | 'updateOne', jest.Mock>;

  describe('handlerChangePassword', () => {
    const input = { currentPassword: 'OldPass123!xyz', password: 'NewPass123!xyz' };
    const mockFindByIdWithPassword = (doc: unknown) => (CandidateModel.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(doc) });

    beforeEach(() => {
      mockFindByIdWithPassword({ _id: 'user_id', email: 'me@example.com', password: '$2b$12$oldhash' });
      (jwt.jwtSign as jest.Mock).mockReturnValueOnce('new-access').mockReturnValueOnce('new-refresh');
    });

    it('rejects a wrong current password without changing anything', async () => {
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(false);

      await expect(handlerChangePassword('user_id', input)).rejects.toMatchObject({
        errorCode: ErrorCode.BAD_REQUEST,
        statusCode: 400,
        message: 'Mật khẩu hiện tại không đúng',
      });
      expect(candidateMock.updateOne).not.toHaveBeenCalled();
      expect(invalidateAllSessions).not.toHaveBeenCalled();
    });

    it('rejects a new password equal to the current one', async () => {
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(true);

      await expect(handlerChangePassword('user_id', { ...input, password: input.currentPassword })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
      });
      expect(candidateMock.updateOne).not.toHaveBeenCalled();
    });

    it('answers 400 idNotFound when the signed-in candidate no longer exists', async () => {
      mockFindByIdWithPassword(null);

      await expect(handlerChangePassword('user_id', input)).rejects.toMatchObject({ statusCode: 400, message: 'ID không tồn tại' });
    });

    it('stores a new hash, revokes every session and returns a fresh pair', async () => {
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(true);
      (bcrypt.bcryptGenerateSalt as jest.Mock).mockResolvedValue('$2b$12$newhash');

      const result = await handlerChangePassword('user_id', input, 'en');

      expect(candidateMock.findById).toHaveBeenCalledWith('user_id');
      expect(candidateMock.updateOne).toHaveBeenCalledWith({ _id: 'user_id' }, { password: '$2b$12$newhash' });
      expect(invalidateAllSessions).toHaveBeenCalledTimes(1);
      expect(invalidateAllSessions).toHaveBeenCalledWith('user_id');
      expect(result.data).toEqual({ token: 'new-access', tokenRefresh: 'new-refresh' });
      expect(result.message).toBe('Password changed. Other devices have been logged out');
    });
  });

  describe('handlerChangeEmail + handlerConfirmEmailChange', () => {
    const caller = { _id: 'user_id', email: 'old@example.com', password: '$2b$12$hash' };
    const input = { currentPassword: 'OldPass123!xyz', email: 'New@Example.com' };

    // Requests an email change and returns the token the confirm link carries.
    const requestChange = async (): Promise<string> => {
      (CandidateModel.findById as jest.Mock).mockReturnValueOnce({ select: jest.fn().mockResolvedValue(caller) });
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(true);
      (CandidateModel.findOne as jest.Mock).mockResolvedValueOnce(null);
      await handlerChangeEmail('user_id', input);
      const path = (sendAuthLinkEmail as jest.Mock).mock.calls[0][2] as string;
      jest.clearAllMocks();
      return path.split('token=')[1] ?? '';
    };

    it('rejects a wrong current password without sending anything', async () => {
      (CandidateModel.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(caller) });
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(false);

      await expect(handlerChangeEmail('user_id', input)).rejects.toMatchObject({ statusCode: 400, message: 'Mật khẩu hiện tại không đúng' });
      expect(sendAuthLinkEmail).not.toHaveBeenCalled();
    });

    it('rejects an email taken by another candidate (409) or equal to the current one, case-insensitively (400)', async () => {
      (CandidateModel.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(caller) });
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(true);
      (CandidateModel.findOne as jest.Mock).mockResolvedValue({ _id: 'other_id' });

      await expect(handlerChangeEmail('user_id', input)).rejects.toMatchObject({ errorCode: ErrorCode.EMAIL_EXISTS, statusCode: 409 });
      expect(candidateMock.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      await expect(handlerChangeEmail('user_id', { ...input, email: 'OLD@example.com' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Email mới trùng với email hiện tại',
      });
      expect(sendAuthLinkEmail).not.toHaveBeenCalled();
    });

    it('emails the confirm link to the new address without changing the stored email', async () => {
      (CandidateModel.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(caller) });
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(true);
      (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await handlerChangeEmail('user_id', input, 'en');

      expect(sendAuthLinkEmail).toHaveBeenCalledTimes(1);
      expect(sendAuthLinkEmail).toHaveBeenCalledWith('new@example.com', 'confirmEmailChange', expect.stringMatching(/^\/confirm-email-change\?token=[0-9a-f]{64}$/), 'en', {});
      expect(candidateMock.updateOne).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'A confirmation link has been sent to the new email' });
    });

    it('never logs the change-email token in production, even when the send fails', async () => {
      const prevEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
      try {
        (CandidateModel.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(caller) });
        (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(true);
        (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);
        (sendAuthLinkEmail as jest.Mock).mockRejectedValueOnce(new Error('SMTP down'));

        await handlerChangeEmail('user_id', input);
        await flushPromises();

        const token = ((sendAuthLinkEmail as jest.Mock).mock.calls[0][2] as string).split('token=')[1] ?? '';
        expect(token).toHaveLength(64);
        expect(logger.error).toHaveBeenCalled();
        expect(loggedText()).not.toContain(token);
      } finally {
        process.env['NODE_ENV'] = prevEnv;
      }
    });

    it('confirm sets the new email + emailVerified, notices the old address and keeps sessions', async () => {
      const token = await requestChange();
      (CandidateModel.findById as jest.Mock).mockResolvedValue(caller);
      (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await handlerConfirmEmailChange(token, 'en');

      expect(candidateMock.updateOne).toHaveBeenCalledWith({ _id: 'user_id' }, { email: 'new@example.com', emailVerified: true });
      expect(sendAuthLinkEmail).toHaveBeenCalledWith('old@example.com', 'emailChanged', '', 'en', { newEmail: 'new@example.com' });
      expect(invalidateAllSessions).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Email changed successfully' });
    });

    it('confirm rejects a token used twice, or an unknown one', async () => {
      const token = await requestChange();
      (CandidateModel.findById as jest.Mock).mockResolvedValue(caller);
      (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);
      await handlerConfirmEmailChange(token);

      await expect(handlerConfirmEmailChange(token)).rejects.toMatchObject({ statusCode: 400, message: 'Token đổi email không hợp lệ hoặc đã hết hạn' });
      await expect(handlerConfirmEmailChange('')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('confirm answers 409 without updating when the new email was taken meanwhile', async () => {
      const token = await requestChange();
      (CandidateModel.findById as jest.Mock).mockResolvedValue(caller);
      (CandidateModel.findOne as jest.Mock).mockResolvedValue({ _id: 'other_id' });

      await expect(handlerConfirmEmailChange(token)).rejects.toMatchObject({ errorCode: ErrorCode.EMAIL_EXISTS, statusCode: 409 });
      expect(candidateMock.updateOne).not.toHaveBeenCalled();
    });

    it('confirm rejects a change requested before the sessions were revoked (password reset/change, logout-all)', async () => {
      const token = await requestChange();
      (getSessionsInvalidatedAt as jest.Mock).mockResolvedValueOnce(Math.floor(Date.now() / 1000) + 1);

      await expect(handlerConfirmEmailChange(token)).rejects.toMatchObject({ statusCode: 400, message: 'Token đổi email không hợp lệ hoặc đã hết hạn' });
      expect(getSessionsInvalidatedAt).toHaveBeenCalledWith('user_id');
      expect(candidateMock.updateOne).not.toHaveBeenCalled();
    });

    it('confirm answers 400 idNotFound when the account was deleted meanwhile', async () => {
      const token = await requestChange();
      (CandidateModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(handlerConfirmEmailChange(token)).rejects.toMatchObject({ statusCode: 400, message: 'ID không tồn tại' });
      expect(candidateMock.updateOne).not.toHaveBeenCalled();
    });
  });
});
