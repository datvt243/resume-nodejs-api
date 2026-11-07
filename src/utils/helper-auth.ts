/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Request } from 'express';

export type TokenSource = 'header' | 'body' | 'query' | 'cookie' | null;

/**
 * Same lookup as `extractTokenFromRequest`, but also reports WHERE the
 * token came from — a request authenticated purely off the cookie
 * (nothing in the Authorization header/body/query) is exactly the
 * shape a cross-site CSRF submission produces, since a header or an
 * explicit body/query value can't be forged onto the browser's behalf the
 * way an auto-attached cookie can.
 */
export const extractTokenWithSource = (req: Request, fieldName = 'token', allowQuery = true): { token: string | null; source: TokenSource } => {
  const authHeader = req.header('Authorization') || req.header('authorization') || '';
  if (authHeader) {
    const parts = authHeader.split(' ');
    const [scheme, value] = parts;
    if (parts.length === 2 && scheme !== undefined && value !== undefined && /bearer/i.test(scheme)) return { token: value.trim(), source: 'header' };
    return { token: authHeader.trim(), source: 'header' };
  }

  if (req.body && req.body[fieldName]) return { token: String(req.body[fieldName]), source: 'body' };
  if (allowQuery && req.query && req.query[fieldName]) return { token: String(req.query[fieldName]), source: 'query' };
  if (req.cookies && req.cookies[fieldName]) return { token: req.cookies[fieldName], source: 'cookie' };

  return { token: null, source: null };
};

/**
 * Extract a token out of various request locations.
 *
 * @param req Express request
 * @param fieldName field to look for in body/query/cookies (defaults to "token")
 */
export const extractTokenFromRequest = (req: Request, fieldName = 'token'): string | null => extractTokenWithSource(req, fieldName).token;
