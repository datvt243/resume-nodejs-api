/**
 * Global error handling middleware
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '@/errors/AppError';
import { sendError } from '@/utils/helper';
import { t } from '@/utils/i18n';

export const errorsMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  sendError(res, err, req.lang, req.originalUrl);
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const message = t('errors.routeNotFound', req.lang).replace('{{route}}', `${req.method} ${req.originalUrl}`);
  next(new AppError({ message, errorCode: ErrorCode.ROUTE_NOT_FOUND }));
};
