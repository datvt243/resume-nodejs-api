/**
 * Tests for auth.service.ts
 */

import CandidateModel from '@/models/candidate.model';
import { handlerRegister, handlerLogin, isEmailAlreadyExists, handlerForgotPassword, handlerResetPassword } from '@/auth/auth.service';
import * as bcrypt from '@/utils';
import * as jwt from '@/utils';
import { createResetToken, consumeResetToken } from '@/utils/passwordReset';

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
jest.mock('@/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      const mockDoc = { _id: 'new_id', email: 'new@example.com' };

      (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.bcryptGenerateSalt as jest.Mock).mockResolvedValue(mockHash);
      (CandidateModel.create as jest.Mock).mockResolvedValue(mockDoc);

      const result = await handlerRegister({
        email: 'new@example.com',
        password: 'pass123',
        repassword: 'pass123',
      });

      expect(CandidateModel.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(bcrypt.bcryptGenerateSalt).toHaveBeenCalledWith('pass123');
      expect(CandidateModel.create).toHaveBeenCalledWith({
        _id: null,
        email: 'new@example.com',
        password: mockHash,
      });
      expect(result).toEqual({ success: true, message: 'Đăng ký thành công' });
    });

    it('should fail if email already exists', async () => {
      (CandidateModel.findOne as jest.Mock).mockResolvedValue({ email: 'existing@example.com' });

      const result = await handlerRegister({ email: 'existing@example.com', password: 'pass123' });

      expect(result).toEqual({ success: false, message: 'Email đã tồn tại' });
      expect(bcrypt.bcryptGenerateSalt).not.toHaveBeenCalled();
    });
  });

  describe('handlerLogin', () => {
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

      (CandidateModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(mockCompareResult);
      (jwt.jwtSign as jest.Mock).mockReturnValueOnce(mockToken).mockReturnValueOnce(mockRefresh);

      const result = await handlerLogin({ email: 'test@example.com', password: 'correctpass' });

      expect(CandidateModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.bcryptCompareHash).toHaveBeenCalledWith('correctpass', mockUser.password);
      expect(jwt.jwtSign).toHaveBeenNthCalledWith(1, { _id: 'user_id' }, expect.any(String), expect.objectContaining({ expiresIn: expect.any(String) }));
      expect(result).toEqual({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
          },
          token: mockToken,
          tokenRefresh: mockRefresh,
        },
        errors: null,
      });
    });

    it('should fail if user not found', async () => {
      (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await handlerLogin({ email: 'nonexistent@example.com', password: 'pass' });

      expect(result).toEqual({ success: false, message: 'Email không tồn tại' });
      expect(bcrypt.bcryptCompareHash).not.toHaveBeenCalled();
    });

    it('should fail if password incorrect', async () => {
      const mockUser = { _id: 'user_id', email: 'test@example.com', password: 'hash' };

      (CandidateModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.bcryptCompareHash as jest.Mock).mockResolvedValue(false);

      const result = await handlerLogin({ email: 'test@example.com', password: 'wrongpass' });

      expect(result).toEqual({ success: false, message: 'Mật khẩu không chính xác' });
    });
  });

  describe('handlerForgotPassword', () => {
    it('creates a reset token when the email exists', async () => {
      const mockUser = { _id: { toString: () => 'user_id' }, email: 'test@example.com' };
      (CandidateModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (createResetToken as jest.Mock).mockResolvedValue('raw-token');

      const result = await handlerForgotPassword('test@example.com');

      expect(CandidateModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(createResetToken).toHaveBeenCalledWith('user_id');
      expect(result).toEqual({ success: true, message: 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được tạo' });
    });

    it('returns the same generic success message when the email does not exist (no user enumeration)', async () => {
      (CandidateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await handlerForgotPassword('nonexistent@example.com');

      expect(createResetToken).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được tạo' });
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
      expect(result).toEqual({ success: true, message: 'Đặt lại mật khẩu thành công' });
    });

    it('fails without touching the password when the token is invalid/expired', async () => {
      (consumeResetToken as jest.Mock).mockResolvedValue(null);

      const result = await handlerResetPassword({ token: 'bad-token', password: 'NewPass123!' });

      expect(bcrypt.bcryptGenerateSalt).not.toHaveBeenCalled();
      expect(CandidateModel.updateOne).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    });
  });
});
