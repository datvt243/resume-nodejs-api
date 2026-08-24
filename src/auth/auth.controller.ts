/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validateSchema, formatReturn, handleError, throwBadRequestError } from '@/utils';

import { schemaAuthRegister, schemaAuthLogin, schemaForgotPassword, schemaResetPassword } from './auth.validate';
import { handlerRegister, handlerLogin, handlerForgotPassword, handlerResetPassword } from './auth.service';
import { addToBlacklist, isBlacklisted } from '@/utils/tokenBlacklist';
import { jwtSign, jwtVerify } from '@/utils';
import { extractTokenFromRequest } from '@/utils/helper-auth';
import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';
import { t } from '@/utils/i18n';

/**
 * Chức năng Đăng ký mới
 */
export const authRegister = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate dữ liệu đầu vào
   * { email, password, re-password } = req.body;
   */
  const { isValidated, value = {}, errors, message } = validateSchema({
    schema: schemaAuthRegister,
    item: { ...req.body },
    lang: (req as any).lang,
  });
  if (!isValidated) {
    return formatReturn(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message,
      errors,
    });
  }

  /**
   * save mới document
   */
  try {
    const { success, message } = await handlerRegister({ _id: null, ...value }, (req as any).lang);
    return formatReturn(res, {
      statusCode: StatusCodes[success ? 'OK' : 'UNAUTHORIZED'],
      success: success,
      message: message || t('auth.registerSuccess', (req as any).lang),
      errors: null,
      data: null,
    });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

/**
 * Chức năng Đăng nhập
 */
export const authLogin = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate date come from req
   */
  const { isValidated, value = {}, message, errors } = validateSchema({
    schema: schemaAuthLogin,
    item: { ...req.body },
    lang: (req as any).lang,
  });
  if (!isValidated) {
    return formatReturn(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message,
      errors,
    });
  }

  /**
   * tiến hành Login
   */
  try {
    const _result = await handlerLogin({ email: value.email, password: value.password }, (req as any).lang);

    return formatReturn(res, {
      statusCode: StatusCodes[_result?.success ? 'OK' : 'UNAUTHORIZED'],
      success: _result?.success || false,
      message: _result?.message || t('auth.loginFailed', (req as any).lang),
      errors: _result?.errors || [],
      data: _result?.data || null,
    });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

/**
 * Chức năng Refresh token
 */
export const authRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // pull from multiple locations using helper
    const refreshToken = extractTokenFromRequest(req, 'refreshToken');

    if (!refreshToken) {
      return formatReturn(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: t('auth.noRefreshToken', (req as any).lang),
      });
    }

    if (await isBlacklisted(refreshToken)) {
      return formatReturn(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: t('auth.refreshTokenRevoked', (req as any).lang),
      });
    }

    // verify refresh token
    const decoded = jwtVerify(refreshToken, TOKEN_REFRESH);
    const { _id } = (decoded as { _id?: string }) || {};
    if (!_id)
      return formatReturn(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: t('auth.invalidRefreshPayload', (req as any).lang),
      });

    // rotate: blacklist old refresh token
    await addToBlacklist(refreshToken);

    // create new tokens
    const newAccess = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
    const newRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });

    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: t('auth.tokenRefreshed', (req as any).lang),
      data: { token: newAccess, tokenRefresh: newRefresh },
    });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

/**
 * Chức năng Tạo mới refreshToken
 */
export const authCreateRefreshToken = async (req: Request, res: Response) => {
  // coming soon
};

/**
 * Chức năng Quên mật khẩu: tạo reset token và (stub) log link đặt lại
 */
export const authForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value = {}, errors, message } = validateSchema({
    schema: schemaForgotPassword,
    item: { ...req.body },
    lang: (req as any).lang,
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
    const { success, message } = await handlerForgotPassword(value.email, (req as any).lang);
    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success,
      message,
      data: null,
    });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

/**
 * Chức năng Đặt lại mật khẩu: xác thực reset token rồi cập nhật mật khẩu mới
 */
export const authResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { isValidated, value = {}, errors, message } = validateSchema({
    schema: schemaResetPassword,
    item: { ...req.body },
    lang: (req as any).lang,
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
    const { success, message } = await handlerResetPassword({ token: value.token, password: value.password }, (req as any).lang);
    return formatReturn(res, {
      statusCode: StatusCodes[success ? 'OK' : 'BAD_REQUEST'],
      success,
      message,
      data: null,
    });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

/**
 * Chức năng Logout: thu hồi access token hiện tại
 */
export const authLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // attempt to extract token from header/cookie/query
    const token = extractTokenFromRequest(req);

    if (!token) {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: t('auth.noTokenToLogout', (req as any).lang),
      });
    }

    await addToBlacklist(token);

    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: t('auth.logoutSuccess', (req as any).lang),
    });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};
