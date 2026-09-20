/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Double-submit CSRF token helpers (issue #134), paired with
 * the httpOnly auth cookies (issue #119). Moving those cookies' `sameSite`
 * from 'strict' to 'none' (required for the real cross-site GitHub Pages ->
 * Render deployment) removes the incidental CSRF protection 'strict' gave
 * for free — this replaces it with a real check.
 */
import crypto from 'crypto';
import { Request, Response, CookieOptions } from 'express';
import { TokenSource } from '@/utils/helper-auth';

export const CSRF_COOKIE_NAME = 'csrfToken';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Not httpOnly: the frontend must be able to read this value in JS to echo
// it back in the CSRF_HEADER_NAME header (the "double submit" half of the
// pattern) — unlike the auth token cookies, this one carries no auth power
// on its own, only proof the request wasn't submitted cross-site blind.
const CSRF_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: false,
  secure: true,
  sameSite: 'none',
  path: '/',
};

export const generateCsrfToken = (): string => crypto.randomBytes(32).toString('hex');

export const setCsrfCookie = (res: Response, csrfToken: string) => {
  res.cookie(CSRF_COOKIE_NAME, csrfToken, CSRF_COOKIE_OPTIONS);
};

export const clearCsrfCookie = (res: Response) => {
  res.clearCookie(CSRF_COOKIE_NAME, CSRF_COOKIE_OPTIONS);
};

/**
 * True when this request's auth token came from the cookie alone (nothing
 * in the Authorization header/body/query) on a state-changing method —
 * exactly the shape a forged cross-site <form> submission produces, since
 * a header or an explicit body/query value can't be set on the victim's
 * browser the way the cookie auto-attaches itself.
 */
export const requiresCsrfCheck = (req: Request, tokenSource: TokenSource): boolean =>
  tokenSource === 'cookie' && !SAFE_METHODS.includes(req.method);

export const isCsrfTokenValid = (req: Request): boolean => {
  const cookieToken = (req as any).cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.header(CSRF_HEADER_NAME);
  return !!cookieToken && !!headerToken && cookieToken === headerToken;
};
