/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Forwards a rejected handler promise to `next(err)` — Express 4 doesn't, and Node exits on an unhandled rejection. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
