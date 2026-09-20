/**
 * Tests for csrf.ts (issue #134) — real, unmocked implementation.
 */

import { Response } from 'express';
import { generateCsrfToken, setCsrfCookie, clearCsrfCookie, requiresCsrfCheck, isCsrfTokenValid, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/utils/csrf';

const mockResponse = () => {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as Response;
};

const EXPECTED_CSRF_OPTIONS = { httpOnly: false, secure: true, sameSite: 'none', path: '/' };

describe('csrf', () => {
  describe('generateCsrfToken', () => {
    it('generates a non-empty, high-entropy hex string that differs every call', () => {
      const a = generateCsrfToken();
      const b = generateCsrfToken();

      expect(a).toMatch(/^[0-9a-f]{64}$/);
      expect(b).toMatch(/^[0-9a-f]{64}$/);
      expect(a).not.toBe(b);
    });
  });

  describe('setCsrfCookie / clearCsrfCookie', () => {
    it('sets the CSRF cookie as non-httpOnly so the frontend can read and echo it back', () => {
      const res = mockResponse();

      setCsrfCookie(res, 'abc123');

      expect(res.cookie).toHaveBeenCalledWith(CSRF_COOKIE_NAME, 'abc123', EXPECTED_CSRF_OPTIONS);
    });

    it('clears the CSRF cookie with the same options', () => {
      const res = mockResponse();

      clearCsrfCookie(res);

      expect(res.clearCookie).toHaveBeenCalledWith(CSRF_COOKIE_NAME, EXPECTED_CSRF_OPTIONS);
    });
  });

  describe('requiresCsrfCheck', () => {
    const reqWithMethod = (method: string): any => ({ method });

    it('requires the check for a state-changing method authenticated purely via cookie', () => {
      expect(requiresCsrfCheck(reqWithMethod('POST'), 'cookie')).toBe(true);
      expect(requiresCsrfCheck(reqWithMethod('PUT'), 'cookie')).toBe(true);
      expect(requiresCsrfCheck(reqWithMethod('PATCH'), 'cookie')).toBe(true);
      expect(requiresCsrfCheck(reqWithMethod('DELETE'), 'cookie')).toBe(true);
    });

    it('does not require the check for safe methods, even when cookie-sourced', () => {
      expect(requiresCsrfCheck(reqWithMethod('GET'), 'cookie')).toBe(false);
      expect(requiresCsrfCheck(reqWithMethod('HEAD'), 'cookie')).toBe(false);
      expect(requiresCsrfCheck(reqWithMethod('OPTIONS'), 'cookie')).toBe(false);
    });

    it('does not require the check when the token came from the Authorization header, body, or query', () => {
      expect(requiresCsrfCheck(reqWithMethod('POST'), 'header')).toBe(false);
      expect(requiresCsrfCheck(reqWithMethod('POST'), 'body')).toBe(false);
      expect(requiresCsrfCheck(reqWithMethod('POST'), 'query')).toBe(false);
      expect(requiresCsrfCheck(reqWithMethod('POST'), null)).toBe(false);
    });
  });

  describe('isCsrfTokenValid', () => {
    const reqWith = (cookies: Record<string, string> | undefined, header: string | undefined): any => ({
      cookies,
      header: (name: string) => (name === CSRF_HEADER_NAME ? header : undefined),
    });

    it('is valid when the cookie and header carry the same non-empty value', () => {
      expect(isCsrfTokenValid(reqWith({ [CSRF_COOKIE_NAME]: 'match' }, 'match'))).toBe(true);
    });

    it('is invalid when the cookie and header differ', () => {
      expect(isCsrfTokenValid(reqWith({ [CSRF_COOKIE_NAME]: 'a' }, 'b'))).toBe(false);
    });

    it('is invalid when the header is missing', () => {
      expect(isCsrfTokenValid(reqWith({ [CSRF_COOKIE_NAME]: 'a' }, undefined))).toBe(false);
    });

    it('is invalid when the cookie is missing', () => {
      expect(isCsrfTokenValid(reqWith(undefined, 'a'))).toBe(false);
    });
  });
});
