/**
 * JWT Token verification middleware
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '@/config/process.config';
import { jwtVerify } from '@/utils/jwt';
import { isBlacklisted } from '@/utils/tokenBlacklist';
import { getSessionsInvalidatedAt, isSessionRevoked } from '@/utils/sessionRevocation';
import { ErrorCode, TokenExpiredError, TokenRevokedError, InvalidTokenError, AuthenticationError, AuthorizationError } from '@/errors';

import { extractTokenWithSource } from '@/utils/helper-auth';
import { t } from '@/utils/i18n';
import { requiresCsrfCheck, isCsrfTokenValid } from '@/utils/csrf';

export const verifyToken = async (req: Request, _res: Response, next: NextFunction) => {
  const { token, source } = extractTokenWithSource(req);

  if (!token) {
    return next(new AuthenticationError('Access denied. No token provided.', ErrorCode.NO_TOKEN));
  }

  try {
    if (await isBlacklisted(token)) {
      return next(new TokenRevokedError('Token has been revoked.'));
    }

    const decoded = jwtVerify(token, TOKEN_SECRET);
    const { _id, iat } = (decoded as { _id?: string; iat?: number }) || {};

    if (!_id) {
      return next(new InvalidTokenError('Invalid token payload.'));
    }

    // "Log out of all devices": reject any token issued before the
    // candidate's last logout-all, even if not yet blacklisted or expired.
    const invalidatedAt = await getSessionsInvalidatedAt(_id);
    if (isSessionRevoked(iat, invalidatedAt)) {
      return next(new TokenRevokedError('Token has been revoked.'));
    }

    /**
     * With auth cookies on SameSite=None, a state-changing request that
     * authenticated purely off the cookie (no Authorization header) must
     * also prove intent via the matching double-submit CSRF token — a
     * request carrying a Bearer token instead is immune to classic CSRF
     * (a third-party page can't set that header on the victim's behalf).
     */
    if (requiresCsrfCheck(req, source) && !isCsrfTokenValid(req)) {
      return next(new AuthorizationError('Invalid or missing CSRF token.', ErrorCode.CSRF_TOKEN_INVALID));
    }

    /**
     * Attach authenticated user info. Also force req.body.candidateId to the
     * authenticated user's own _id, overwriting whatever the client sent —
     * every candidate_profile handler (list/create/update/delete/export)
     * trusts req.body.candidateId as the acting user, so leaving it
     * client-controlled let any authenticated user read/write/delete any
     * other user's data by supplying a different candidateId in the body.
     */
    req.user = { _id };
    if (!req.body || typeof req.body !== 'object') req.body = {};
    /**
     * Express's own `Request.body` type is `any` by design (its real
     * shape depends entirely on which body-parser ran) — narrow cast
     * justified here since this line is the one place establishing the
     * `candidateId` key on it for every downstream handler.
     */
    (req.body as Record<string, unknown>)['candidateId'] = _id;
    return next();
  } catch (err) {
    // jsonwebtoken's own real exported error classes, replacing a
    // duck-typed `err?.name === 'X'` check.
    // TokenExpiredError extends JsonWebTokenError, so it must be checked first.
    if (err instanceof jwt.TokenExpiredError) {
      return next(new TokenExpiredError(t('auth.tokenExpired', req.lang)));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new InvalidTokenError(t('auth.invalidToken', req.lang)));
    }
    return next(new InvalidTokenError(err instanceof Error ? err.message : 'Invalid token.'));
  }
};

export const verifyTokenByQuery = (req: Request, res: Response, next: NextFunction) => {
  // keep for compatibility; extractToken already supports query param
  return verifyToken(req, res, next);
};
