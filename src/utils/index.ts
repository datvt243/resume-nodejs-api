/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Request } from 'express';

export * from './bcrypt';
export * from './helper';
export * from './response';
export * from './jwt';
export * from './valid';
export * from './authCookies';
export * from './csrf';

import { jwtVerify } from './jwt';
import { TOKEN_SECRET } from '@/config/process.config';
import { _log as winstonLog, logCatchError as winstonLogCatchError } from '@/logger';

export const _log = winstonLog;
export const logCatchError = winstonLogCatchError;

export const getDataUserIdFromToken = (req: Request): { success: boolean; _id: string | null | '' } => {
  let success = false,
    _id = null;

  const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return { success: false, _id: '' };

  try {
    const { _id: id } = jwtVerify(token, TOKEN_SECRET);
    _id = id;
    success = true;
  } catch (err) {
    success = false;
  }

  return {
    success,
    _id,
  };
};
