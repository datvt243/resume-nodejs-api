/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: JWT Token verification middleware
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TOKEN_SECRET } from '@/config/process.config';
import { jwtVerify } from '@/utils/jwt';
import { isBlacklisted } from '@/utils/tokenBlacklist';
import { getSessionsInvalidatedAt, isSessionRevoked } from '@/utils/sessionRevocation';
import { ErrorCode, TokenExpiredError, TokenRevokedError, InvalidTokenError, AuthenticationError } from '@/errors';

import { extractTokenFromRequest } from '@/utils/helper-auth';

// note: `fieldName` defaults to 'token', so middleware does not need to pass it
const extractToken = (req: any): string | null => extractTokenFromRequest(req);

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return next(new AuthenticationError('Access denied. No token provided.', ErrorCode.NO_TOKEN));
  }

  try {
    // check revoked tokens
    if (await isBlacklisted(token)) {
      return next(new TokenRevokedError('Token has been revoked.'));
    }

    const decoded = jwtVerify(token, TOKEN_SECRET);
    const { _id, iat } = (decoded as { _id?: string; iat?: number }) || {};

    if (!_id) {
      return next(new InvalidTokenError('Invalid token payload.'));
    }

    // "Log out of all devices" (issue #74): reject any token issued before
    // the candidate's last logout-all, even if it hasn't blacklisted-out or
    // expired on its own yet.
    const invalidatedAt = await getSessionsInvalidatedAt(_id);
    if (isSessionRevoked(iat, invalidatedAt)) {
      return next(new TokenRevokedError('Token has been revoked.'));
    }

    // Attach authenticated user info. Also force req.body.candidateId to the
    // authenticated user's own _id, overwriting whatever the client sent —
    // every candidate_profile handler (list/create/update/delete/export)
    // trusts req.body.candidateId as the acting user, so leaving it
    // client-controlled let any authenticated user read/write/delete any
    // other user's data by supplying a different candidateId in the body.
    (req as any).user = { _id };
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.candidateId = _id;
    return next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
      return next(new TokenExpiredError('Token expired.'));
    }
    return next(new InvalidTokenError(err?.message || 'Invalid token.'));
  }
};

export const verifyTokenByQuery = (req: Request, res: Response, next: NextFunction) => {
  // keep for compatibility; extractToken already supports query param
  return verifyToken(req, res, next);
};
