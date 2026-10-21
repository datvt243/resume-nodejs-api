/**
 * Global error handling middleware
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NODE_ENV } from '@/config/process.config';
import { logger } from '@/logger';
import { AppError, ErrorCode } from '@/errors/AppError';
import { toAppError } from '@/utils/helper';
import { t } from '@/utils/i18n';

export const errorsMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const e = toAppError(err, req.lang);
  const isDev = NODE_ENV === 'development';

  logger.error(`ERROR [${e.errorCode}]: ${e.message}`, {
    errorCode: e.errorCode,
    message: e.message,
    errors: e.errors,
    stack: e.stack,
    ...(isDev && { reqUrl: req.originalUrl }),
  });

  res.status(e.statusCode).json({
    success: false,
    errorCode: e.errorCode,
    message: e.isOperational || isDev ? e.message : t('errors.internalServerError', req.lang),
    errors: e.errors,
    ...(isDev && { stack: e.stack }),
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, StatusCodes.NOT_FOUND, ErrorCode.NOT_FOUND);
  next(error);
};
