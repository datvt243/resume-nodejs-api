/**
 * Tests for authCookies.ts (issue #119, updated for issue #134) — real,
 * unmocked implementation.
 */

import { Response } from 'express';
import { setAuthCookies, clearAuthCookies } from '@/utils/authCookies';
import { CSRF_COOKIE_NAME } from '@/utils/csrf';

const mockResponse = () => {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as Response;
};

const EXPECTED_OPTIONS = { httpOnly: true, secure: true, sameSite: 'none', path: '/' };
const EXPECTED_CSRF_OPTIONS = { httpOnly: false, secure: true, sameSite: 'none', path: '/' };

describe('authCookies', () => {
  describe('setAuthCookies', () => {
    it('sets both token and refreshToken cookies with httpOnly options', () => {
      const res = mockResponse();

      setAuthCookies(res, { token: 'access123', tokenRefresh: 'refresh456' });

      expect(res.cookie).toHaveBeenCalledWith('token', 'access123', EXPECTED_OPTIONS);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh456', EXPECTED_OPTIONS);
    });

    it('only sets the auth cookie for whichever value is provided', () => {
      const res = mockResponse();

      setAuthCookies(res, { token: 'access123' });

      expect(res.cookie).toHaveBeenCalledWith('token', 'access123', EXPECTED_OPTIONS);
      expect(res.cookie).not.toHaveBeenCalledWith('refreshToken', expect.anything(), expect.anything());
    });

    it('also issues a non-httpOnly CSRF cookie whenever an auth cookie is set (issue #134)', () => {
      const res = mockResponse();

      setAuthCookies(res, { token: 'access123', tokenRefresh: 'refresh456' });

      expect(res.cookie).toHaveBeenCalledTimes(3);
      const csrfCall = (res.cookie as jest.Mock).mock.calls.find((call) => call[0] === CSRF_COOKIE_NAME);
      expect(csrfCall).toBeDefined();
      expect(csrfCall?.[2]).toEqual(EXPECTED_CSRF_OPTIONS);
      expect(typeof csrfCall?.[1]).toBe('string');
      expect((csrfCall?.[1] as string).length).toBeGreaterThan(0);
    });

    it('does not set any cookie when neither token is provided', () => {
      const res = mockResponse();

      setAuthCookies(res, {});

      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('clearAuthCookies', () => {
    it('clears token, refreshToken, and the CSRF cookie', () => {
      const res = mockResponse();

      clearAuthCookies(res);

      expect(res.clearCookie).toHaveBeenCalledWith('token', EXPECTED_OPTIONS);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', EXPECTED_OPTIONS);
      expect(res.clearCookie).toHaveBeenCalledWith(CSRF_COOKIE_NAME, EXPECTED_CSRF_OPTIONS);
      expect(res.clearCookie).toHaveBeenCalledTimes(3);
    });
  });
});
