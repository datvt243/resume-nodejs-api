/**
 * Standalone CSRF check for auth routes that don't go through
 * `verifyToken` (which already embeds the same check) — `/auth/refresh`
 * (reads the refresh token, not the access token) and `/auth/logout`
 * (reads the about-to-be-blacklisted token directly).
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { Request, Response, NextFunction } from 'express';
import { extractTokenWithSource } from '@/utils/helper-auth';
import { requiresCsrfCheck, isCsrfTokenValid } from '@/utils/csrf';
import { ErrorCode, AuthorizationError } from '@/errors';
import { t } from '@/utils/i18n';

export const verifyCsrf = (fieldName = 'token') => (req: Request, _res: Response, next: NextFunction) => {
  const { source } = extractTokenWithSource(req, fieldName);

  if (requiresCsrfCheck(req, source) && !isCsrfTokenValid(req)) {
    return next(new AuthorizationError(t('auth.csrfInvalid', req.lang), ErrorCode.CSRF_TOKEN_INVALID));
  }

  return next();
};
