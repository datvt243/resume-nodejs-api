/**
 * Success responses: `{ success:true, message, data, meta? }`. Errors are
 * thrown as `AppError` and written only by `sendError`.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export type ListMeta = { page: number; limit: number; total: number; totalPages: number };

export const ok = (res: Response, data: unknown = null, message = '', meta?: ListMeta) =>
  res.status(StatusCodes.OK).json({ success: true, message, data, ...(meta && { meta }) });

export const created = (res: Response, data: unknown = null, message = '') =>
  res.status(StatusCodes.CREATED).json({ success: true, message, data });
