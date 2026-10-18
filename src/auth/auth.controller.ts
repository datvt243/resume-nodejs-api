/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validateSchema, formatReturn, handleError, setAuthCookies, clearAuthCookies } from '@/utils';

import { schemaAuthRegister, schemaAuthLogin, schemaForgotPassword, schemaResetPassword } from './auth.validate';
import { handlerRegister, handlerLogin, handlerForgotPassword, handlerResetPassword, handlerVerifyEmail } from './auth.service';
import { addToBlacklist, claimRotation, isBlacklisted, getRotatedAt } from '@/utils/tokenBlacklist';
import { invalidateAllSessions, getSessionsInvalidatedAt, isSessionRevoked } from '@/utils/sessionRevocation';
import { jwtSign, jwtVerify } from '@/utils';
import { extractTokenFromRequest } from '@/utils/helper-auth';
import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';
import { t } from '@/utils/i18n';
import { logger } from '@/logger';

/**
 * Chức năng Đăng ký mới
 */
export const authRegister = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value = {}, errors, message } = validateSchema({
    schema: schemaAuthRegister,
    item: { ...req.body },
    lang: req.lang,
  });
  if (!isValidated) {
    return formatReturn(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message,
      errors,
    });
  }

  try {
    const { success, message } = await handlerRegister({ _id: null, ...value }, req.lang);
    return formatReturn(res, {
      statusCode: StatusCodes[success ? 'OK' : 'UNAUTHORIZED'],
      success: success,
      message: message || t('auth.registerSuccess', req.lang),
      errors: null,
      data: null,
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

/**
 * Chức năng Đăng nhập
 */
export const authLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value = {}, message, errors } = validateSchema({
    schema: schemaAuthLogin,
    item: { ...req.body },
    lang: req.lang,
  });
  if (!isValidated) {
    return formatReturn(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message,
      errors,
    });
  }

  try {
    const _result = await handlerLogin({ email: value.email, password: value.password }, req.lang);

    // Also set httpOnly cookies so the frontend can migrate off
    // localStorage — kept alongside the existing response-body tokens
    // during the transition.
    if (_result?.success && _result?.data) {
      setAuthCookies(res, { token: _result.data.token, tokenRefresh: _result.data.tokenRefresh });
    }

    return formatReturn(res, {
      statusCode: StatusCodes[_result?.success ? 'OK' : 'UNAUTHORIZED'],
      success: _result?.success || false,
      message: _result?.message || t('auth.loginFailed', req.lang),
      errors: _result?.errors || [],
      data: _result?.data || null,
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

const REFRESH_REUSE_GRACE_SECONDS = 10;

/**
 * A refresh token presented again after it was rotated away means two
 * parties hold it, so every session of the candidate is revoked (same as
 * logout-all) — the thief's pair and the owner's pair both stop working.
 * Skipped within the grace window (two tabs refreshing at once), when the
 * token can't be verified (its candidate id can't be trusted), and when
 * the token already predates the candidate's last revocation, so an old
 * stolen token can't keep logging the owner out.
 */
const revokeOnRefreshTokenReuse = async (refreshToken: string, rotatedAt: number): Promise<void> => {
  if (Math.floor(Date.now() / 1000) - rotatedAt <= REFRESH_REUSE_GRACE_SECONDS) return;

  let decoded: { _id?: string; iat?: number };
  try {
    decoded = jwtVerify(refreshToken, TOKEN_REFRESH);
  } catch {
    return;
  }
  const { _id, iat } = decoded;
  if (!_id || isSessionRevoked(iat, await getSessionsInvalidatedAt(_id))) return;

  await invalidateAllSessions(_id);
  logger.warn('[auth] Rotated refresh token reused — all sessions revoked', { candidateId: _id });
};

/**
 * Chức năng Refresh token
 */
export const authRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = extractTokenFromRequest(req, 'refreshToken');

    if (!refreshToken) {
      return formatReturn(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: t('auth.noRefreshToken', req.lang),
      });
    }

    // Answered exactly like any other revoked token, so the detection isn't observable.
    const rotatedAt = await getRotatedAt(refreshToken);
    if (rotatedAt !== null) {
      await revokeOnRefreshTokenReuse(refreshToken, rotatedAt);
      return formatReturn(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: t('auth.refreshTokenRevoked', req.lang),
      });
    }

    if (await isBlacklisted(refreshToken)) {
      return formatReturn(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: t('auth.refreshTokenRevoked', req.lang),
      });
    }

    const decoded = jwtVerify(refreshToken, TOKEN_REFRESH);
    const { _id, iat } = (decoded as { _id?: string; iat?: number }) || {};
    if (!_id)
      return formatReturn(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: t('auth.invalidRefreshPayload', req.lang),
      });

    // "Log out of all devices": a refresh token issued before the
    // candidate's last logout-all must not be usable to mint new pairs.
    const invalidatedAt = await getSessionsInvalidatedAt(_id);
    if (isSessionRevoked(iat, invalidatedAt)) {
      return formatReturn(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: t('auth.refreshTokenRevoked', req.lang),
      });
    }

    // Claimed atomically before signing: a concurrent refresh that already passed the checks above loses here.
    if (!(await claimRotation(refreshToken, Math.floor(Date.now() / 1000)))) {
      return formatReturn(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: t('auth.refreshTokenRevoked', req.lang),
      });
    }

    const newAccess = jwtSign({ data: { _id }, secretKey: TOKEN_SECRET, props: { expiresIn: TOKEN_EXP_IN || '1h' } });
    // Unique `jti`, same reason as handlerLogin: a same-second copy of the rotated token would read as reuse.
    const newRefresh = jwtSign({ data: { _id, jti: crypto.randomUUID() }, secretKey: TOKEN_REFRESH, props: { expiresIn: TOKEN_REFRESH_EXP_IN } });

    // Rotate the httpOnly cookies to match the rotated tokens
    setAuthCookies(res, { token: newAccess, tokenRefresh: newRefresh });

    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: t('auth.tokenRefreshed', req.lang),
      data: { token: newAccess, tokenRefresh: newRefresh },
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

/**
 * Chức năng Tạo mới refreshToken
 */
export const authCreateRefreshToken = async (_req: Request, _res: Response) => {
  // coming soon
};

/**
 * Chức năng Xác thực email: xác thực verification token (single-use) rồi
 * đánh dấu emailVerified = true. Không chặn login.
 */
export const authVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  const token = typeof req.query['token'] === 'string' ? req.query['token'] : '';

  try {
    const { success, message } = await handlerVerifyEmail(token, req.lang);
    return formatReturn(res, {
      statusCode: StatusCodes[success ? 'OK' : 'BAD_REQUEST'],
      success,
      message,
      data: null,
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

/**
 * Chức năng Quên mật khẩu: tạo reset token và (stub) log link đặt lại
 */
export const authForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value = {}, errors, message } = validateSchema({
    schema: schemaForgotPassword,
    item: { ...req.body },
    lang: req.lang,
  });
  if (!isValidated) {
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message,
      errors,
    });
  }

  try {
    const { success, message } = await handlerForgotPassword(value.email, req.lang);
    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success,
      message,
      data: null,
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

/**
 * Chức năng Đặt lại mật khẩu: xác thực reset token rồi cập nhật mật khẩu mới
 */
export const authResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value = {}, errors, message } = validateSchema({
    schema: schemaResetPassword,
    item: { ...req.body },
    lang: req.lang,
  });
  if (!isValidated) {
    return formatReturn(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message,
      errors,
    });
  }

  try {
    const { success, message } = await handlerResetPassword({ token: value.token, password: value.password }, req.lang);
    return formatReturn(res, {
      statusCode: StatusCodes[success ? 'OK' : 'BAD_REQUEST'],
      success,
      message,
      data: null,
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

/**
 * Chức năng Logout: thu hồi access token hiện tại
 */
export const authLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('auth.noTokenToLogout', req.lang),
      });
    }

    await addToBlacklist(token);

    // Clear the httpOnly auth cookies on logout
    clearAuthCookies(res);

    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: t('auth.logoutSuccess', req.lang),
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};

/**
 * Chức năng "Log out of all devices": thu hồi mọi token đã
 * phát cho candidate này tính đến thời điểm hiện tại — không chỉ token
 * hiện tại như /logout. Yêu cầu route được gắn `verifyToken` trước, nên
 * `req.user._id` luôn tồn tại khi tới đây.
 */
export const authLogoutAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = req.user?._id;

    if (!candidateId) {
      return formatReturn(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: t('auth.noTokenToLogout', req.lang),
      });
    }

    await invalidateAllSessions(candidateId);

    // Also clear the caller's own httpOnly auth cookies
    clearAuthCookies(res);

    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: t('auth.logoutAllSuccess', req.lang),
    });
  } catch (err) {
    handleError({ err, next, lang: req.lang });
  }
};
