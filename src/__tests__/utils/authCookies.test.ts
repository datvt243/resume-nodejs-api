/**
 * Tests for authCookies.ts (issue #119) — real, unmocked implementation.
 */

import { Response } from 'express';
import { setAuthCookies, clearAuthCookies } from '@/utils/authCookies';

const mockResponse = () => {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as Response;
};

const EXPECTED_OPTIONS = { httpOnly: true, secure: true, sameSite: 'strict', path: '/' };

describe('authCookies', () => {
  describe('setAuthCookies', () => {
    it('sets both token and refreshToken cookies with httpOnly options', () => {
      const res = mockResponse();

      setAuthCookies(res, { token: 'access123', tokenRefresh: 'refresh456' });

      expect(res.cookie).toHaveBeenCalledWith('token', 'access123', EXPECTED_OPTIONS);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh456', EXPECTED_OPTIONS);
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });

    it('only sets the cookie for whichever value is provided', () => {
      const res = mockResponse();

      setAuthCookies(res, { token: 'access123' });

      expect(res.cookie).toHaveBeenCalledWith('token', 'access123', EXPECTED_OPTIONS);
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAuthCookies', () => {
    it('clears both token and refreshToken cookies with the same options', () => {
      const res = mockResponse();

      clearAuthCookies(res);

      expect(res.clearCookie).toHaveBeenCalledWith('token', EXPECTED_OPTIONS);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', EXPECTED_OPTIONS);
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
