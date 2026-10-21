/**
 * Tests for auth.controller.ts
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authRegister, authLogin, authRefreshToken, authLogout, authLogoutAll, authCreateRefreshToken } from '@/auth/auth.controller';
import * as validateSchema from '@/utils';
import * as formatReturn from '@/utils';
import * as tokenBlacklist from '@/utils/tokenBlacklist';
import * as jwt from '@/utils';
import * as helperAuth from '@/utils/helper-auth';
import * as sessionRevocation from '@/utils/sessionRevocation';
import { handlerRegister, handlerLogin } from '@/auth/auth.service';

// Mock modules
jest.mock('@/utils');
jest.mock('@/utils/tokenBlacklist');
jest.mock('@/utils/helper-auth');
jest.mock('@/utils/sessionRevocation');
jest.mock('@/auth/auth.service');
jest.mock('@/auth/auth.validate', () => ({
  schemaAuthRegister: {},
  schemaAuthLogin: {},
}));

// Mock Request/Response
const mockRequest = (body: any = {}, headers: any = {}, query: any = {}) =>
  ({
    body,
    headers,
    query,
    cookies: {},
  }) as Request;

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext = jest.fn() as NextFunction;

describe('auth.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // no logout-all in effect by default
    (sessionRevocation.getSessionsInvalidatedAt as jest.Mock).mockResolvedValue(null);
    (sessionRevocation.isSessionRevoked as jest.Mock).mockImplementation(jest.requireActual('@/utils/sessionRevocation').isSessionRevoked);
  });

  describe('authRegister', () => {
    it('should register successfully', async () => {
      const req = mockRequest({ email: 'test@example.com', password: 'pass123', repassword: 'pass123' });
      const res = mockResponse();

      (validateSchema.validateSchema as jest.Mock).mockReturnValue({
        isValidated: true,
        value: { email: 'test@example.com', password: 'pass123' },
      });
      (handlerRegister as jest.Mock).mockResolvedValue({ success: true, message: 'Đăng ký thành công' });

      await authRegister(req, res, mockNext);

      expect(validateSchema.validateSchema).toHaveBeenCalled();
      expect(handlerRegister).toHaveBeenCalledWith({ _id: null, email: 'test@example.com', password: 'pass123' }, undefined);
      expect(formatReturn.formatReturn).toHaveBeenCalledWith(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Đăng ký thành công',
        errors: null,
        data: null,
      });
    });

    it('should fail on validation error', async () => {
      const req = mockRequest({ email: 'invalid' });
      const res = mockResponse();

      (validateSchema.validateSchema as jest.Mock).mockReturnValue({
        isValidated: false,
        errors: ['Invalid email'],
        message: 'Validation failed',
      });

      await authRegister(req, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Validation failed',
        errors: ['Invalid email'],
      });
    });

    it('answers a duplicate email with 409 EMAIL_EXISTS via errorsMiddleware', async () => {
      const req = mockRequest({ email: 'taken@example.com', password: 'pass123', repassword: 'pass123' });
      const res = mockResponse();
      const next = jest.fn();

      (validateSchema.validateSchema as jest.Mock).mockReturnValue({ isValidated: true, value: { email: 'taken@example.com', password: 'pass123' } });
      (handlerRegister as jest.Mock).mockResolvedValue({ success: false, message: 'Email đã tồn tại' });

      await authRegister(req, res, next);

      expect(formatReturn.formatReturn).not.toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 409, errorCode: 'EMAIL_EXISTS', message: 'Email đã tồn tại' });
    });

    // issue #159 — the fallback message (`message || t('auth.registerSuccess', lang)`)
    // resolves through the real, unmocked `t()` and must respect req.lang.
    it('localizes the fallback success message to English when req.lang is en', async () => {
      const req: any = mockRequest({ email: 'test@example.com', password: 'pass123', repassword: 'pass123' });
      req.lang = 'en';
      const res = mockResponse();

      (validateSchema.validateSchema as jest.Mock).mockReturnValue({
        isValidated: true,
        value: { email: 'test@example.com', password: 'pass123' },
      });
      (handlerRegister as jest.Mock).mockResolvedValue({ success: true, message: undefined });

      await authRegister(req, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ message: 'Registration successful' }),
      );
    });
  });

  describe('authLogin', () => {
    it('should login successfully', async () => {
      const req = mockRequest({ email: 'test@example.com', password: 'pass123' });
      const res = mockResponse();

      (validateSchema.validateSchema as jest.Mock).mockReturnValue({
        isValidated: true,
        value: { email: 'test@example.com', password: 'pass123' },
      });
      (handlerLogin as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Đăng nhập thành công',
        data: { user: { email: 'test@example.com' }, token: 'token', tokenRefresh: 'refresh' },
      });

      await authLogin(req, res, mockNext);

      expect(handlerLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'pass123' }, undefined);
      expect((jwt as any).setAuthCookies).toHaveBeenCalledWith(res, { token: 'token', tokenRefresh: 'refresh' });
      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: StatusCodes.OK,
          success: true,
        }),
      );
    });

    it('should fail on validation error', async () => {
      const req = mockRequest({ email: 'invalid' });
      const res = mockResponse();

      (validateSchema.validateSchema as jest.Mock).mockReturnValue({ isValidated: false, message: 'Invalid data' });

      await authLogin(req, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: StatusCodes.BAD_REQUEST,
          success: false,
        }),
      );
    });

    it('answers a failed login with 401 INVALID_CREDENTIALS via errorsMiddleware', async () => {
      const req = mockRequest({ email: 'test@example.com', password: 'wrong' });
      const res = mockResponse();
      const next = jest.fn();

      (validateSchema.validateSchema as jest.Mock).mockReturnValue({ isValidated: true, value: { email: 'test@example.com', password: 'wrong' } });
      (handlerLogin as jest.Mock).mockResolvedValue({ success: false, message: 'Email hoặc mật khẩu không chính xác' });

      await authLogin(req, res, next);

      expect(formatReturn.formatReturn).not.toHaveBeenCalled();
      expect((jwt as any).setAuthCookies).not.toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401, errorCode: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không chính xác' });
    });

    // issue #159 — same fallback-through-t() proof as authRegister, for the
    // `_result.message || t('auth.invalidCredentials', lang)` branch.
    it('localizes the fallback failure message to English when req.lang is en', async () => {
      const req: any = mockRequest({ email: 'test@example.com', password: 'wrong' });
      req.lang = 'en';
      const res = mockResponse();

      (validateSchema.validateSchema as jest.Mock).mockReturnValue({
        isValidated: true,
        value: { email: 'test@example.com', password: 'wrong' },
      });
      (handlerLogin as jest.Mock).mockResolvedValue({ success: false, message: undefined });
      const next = jest.fn();

      await authLogin(req, res, next);

      expect(next.mock.calls[0][0]).toMatchObject({ errorCode: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' });
    });
  });

  describe('authRefreshToken', () => {
    beforeEach(() => {
      // Automocked modules resolve undefined; the real getRotatedAt answers null for a never-rotated token.
      (tokenBlacklist.getRotatedAt as jest.Mock).mockResolvedValue(null);
    });

    it('should refresh token successfully', async () => {
      const req = mockRequest({}, { authorization: 'Bearer refresh_token' });
      const res = mockResponse();

      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue('refresh_token');
      (tokenBlacklist.isBlacklisted as jest.Mock).mockResolvedValue(false);
      (jwt.jwtVerify as jest.Mock).mockReturnValue({ _id: 'user_id' });
      (tokenBlacklist.claimRotation as jest.Mock).mockResolvedValue(true);
      (jwt.jwtSign as jest.Mock).mockReturnValueOnce('new_access').mockReturnValueOnce('new_refresh');

      await authRefreshToken(req, res, mockNext);

      expect(helperAuth.extractTokenFromRequest).toHaveBeenCalledWith(req, 'refreshToken');
      expect((jwt as any).setAuthCookies).toHaveBeenCalledWith(res, { token: 'new_access', tokenRefresh: 'new_refresh' });
      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: StatusCodes.OK,
          data: { token: 'new_access', tokenRefresh: 'new_refresh' },
        }),
      );
    });

    it('should fail if no refresh token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue(null);

      await authRefreshToken(req, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: 'Không có refresh token',
        }),
      );
    });

    it('should fail if blacklisted token', async () => {
      const req = mockRequest({}, { authorization: 'Bearer blacklisted_token' });
      const res = mockResponse();

      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue('blacklisted_token');
      (tokenBlacklist.isBlacklisted as jest.Mock).mockResolvedValue(true);

      const next = jest.fn();
      await authRefreshToken(req, res, next);

      expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401, errorCode: 'TOKEN_REVOKED', message: 'Refresh token đã bị thu hồi' });
    });

    // issue #159 — both error branches call t() directly (not via a
    // `|| t(...)` fallback), so this proves req.lang drives them too.
    it('localizes the no-refresh-token and revoked-token messages to English when req.lang is en', async () => {
      const req: any = mockRequest({}, {});
      req.lang = 'en';
      const res = mockResponse();

      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue(null);

      await authRefreshToken(req, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ message: 'No refresh token provided' }),
      );

      jest.clearAllMocks();
      (sessionRevocation.getSessionsInvalidatedAt as jest.Mock).mockResolvedValue(null);
      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue('blacklisted_token');
      (tokenBlacklist.isBlacklisted as jest.Mock).mockResolvedValue(true);

      const next = jest.fn();
      await authRefreshToken(req, res, next);

      expect(next.mock.calls[0][0]).toMatchObject({ errorCode: 'TOKEN_REVOKED', message: 'Refresh token revoked' });
    });
  });

  describe('authLogout', () => {
    it('should logout successfully', async () => {
      const req = mockRequest({}, { authorization: 'Bearer access_token' });
      const res = mockResponse();

      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue('access_token');
      (tokenBlacklist.addToBlacklist as jest.Mock).mockResolvedValue(undefined);

      await authLogout(req, res, mockNext);

      expect(tokenBlacklist.addToBlacklist).toHaveBeenCalledWith('access_token');
      expect((jwt as any).clearAuthCookies).toHaveBeenCalledWith(res);
      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Đăng xuất thành công',
        }),
      );
    });

    it('should fail if no token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue(null);

      await authLogout(req, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'Không có token để đăng xuất',
        }),
      );
    });

    // issue #159 — proves both the error and success paths localize.
    it('localizes the no-token and success messages to English when req.lang is en', async () => {
      const req: any = mockRequest({}, { authorization: 'Bearer access_token' });
      req.lang = 'en';
      const res = mockResponse();

      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue('access_token');
      (tokenBlacklist.addToBlacklist as jest.Mock).mockResolvedValue(undefined);

      await authLogout(req, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ success: true, message: 'Logged out successfully' }),
      );

      jest.clearAllMocks();
      const reqNoToken: any = mockRequest();
      reqNoToken.lang = 'en';
      (helperAuth.extractTokenFromRequest as jest.Mock).mockReturnValue(null);

      await authLogout(reqNoToken, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ message: 'No token provided to logout' }),
      );
    });
  });

  describe('authLogoutAll', () => {
    it('invalidates all sessions for the authenticated candidate', async () => {
      const req: any = mockRequest();
      req.user = { _id: 'user_id' };
      const res = mockResponse();

      (sessionRevocation.invalidateAllSessions as jest.Mock).mockResolvedValue(true);

      await authLogoutAll(req, res, mockNext);

      expect(sessionRevocation.invalidateAllSessions).toHaveBeenCalledWith('user_id');
      expect((jwt as any).clearAuthCookies).toHaveBeenCalledWith(res);
      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Đã đăng xuất khỏi tất cả thiết bị',
        }),
      );
    });

    // issue #159
    it('localizes the success message to English when req.lang is en', async () => {
      const req: any = mockRequest();
      req.lang = 'en';
      req.user = { _id: 'user_id' };
      const res = mockResponse();

      (sessionRevocation.invalidateAllSessions as jest.Mock).mockResolvedValue(true);

      await authLogoutAll(req, res, mockNext);

      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ success: true, message: 'Logged out of all devices successfully' }),
      );
    });

    it('fails when there is no authenticated user on the request', async () => {
      const req: any = mockRequest();
      const res = mockResponse();

      await authLogoutAll(req, res, mockNext);

      expect(sessionRevocation.invalidateAllSessions).not.toHaveBeenCalled();
      expect(formatReturn.formatReturn).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
      );
    });
  });

  describe('authCreateRefreshToken', () => {
    it('should be placeholder', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await authCreateRefreshToken(req, res);

      // Currently empty, expect no calls
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
