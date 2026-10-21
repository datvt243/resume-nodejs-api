/**
 * Success responses. Errors are thrown as `AppError` and written only by
 * `errorsMiddleware`. `errors: null` keeps today's success body keys until
 * the envelope itself changes.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const ok = (res: Response, data: unknown = null, message = '') =>
  res.status(StatusCodes.OK).json({ success: true, message, errors: null, data });

export const created = (res: Response, data: unknown = null, message = '') =>
  res.status(StatusCodes.CREATED).json({ success: true, message, errors: null, data });
