/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: httpOnly cookie helpers for JWT auth (issue #119) — lets the
 * frontend stop storing the JWT in localStorage (XSS risk). Cookie names
 * ('token' / 'refreshToken') match the field names `extractTokenFromRequest`
 * (`@/utils/helper-auth`) already reads as a fallback.
 */

import { Response, CookieOptions } from 'express';

const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
};

export const setAuthCookies = (res: Response, { token, tokenRefresh }: { token?: string; tokenRefresh?: string }) => {
  if (token) res.cookie('token', token, AUTH_COOKIE_OPTIONS);
  if (tokenRefresh) res.cookie('refreshToken', tokenRefresh, AUTH_COOKIE_OPTIONS);
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('token', AUTH_COOKIE_OPTIONS);
  res.clearCookie('refreshToken', AUTH_COOKIE_OPTIONS);
};
