/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: httpOnly cookie helpers for JWT auth (issue #119) — lets the
 * frontend stop storing the JWT in localStorage (XSS risk). Cookie names
 * ('token' / 'refreshToken') match the field names `extractTokenFromRequest`
 * (`@/utils/helper-auth`) already reads as a fallback.
 *
 * `sameSite: 'none'` (issue #134, was 'strict') — this app's real
 * deployment is cross-site (GitHub Pages frontend, Render API), and
 * 'strict'/'lax' cookies are never attached to cross-site requests at all,
 * so the cookies this module sets would never reach the API in production.
 * 'none' removes that incidental CSRF protection, so a real double-submit
 * CSRF cookie (`@/utils/csrf`) is issued/cleared alongside these on the
 * same lifecycle.
 */

import { Response, CookieOptions } from 'express';
import { generateCsrfToken, setCsrfCookie, clearCsrfCookie } from '@/utils/csrf';

const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
};

export const setAuthCookies = (res: Response, { token, tokenRefresh }: { token?: string; tokenRefresh?: string }) => {
  if (token) res.cookie('token', token, AUTH_COOKIE_OPTIONS);
  if (tokenRefresh) res.cookie('refreshToken', tokenRefresh, AUTH_COOKIE_OPTIONS);
  if (token || tokenRefresh) setCsrfCookie(res, generateCsrfToken());
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('token', AUTH_COOKIE_OPTIONS);
  res.clearCookie('refreshToken', AUTH_COOKIE_OPTIONS);
  clearCsrfCookie(res);
};
