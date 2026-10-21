/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { getRedisClient, isRedisAvailable } from '@/services/redis';

type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
  skipPaths?: string[];
};

import { logger } from '@/logger';
import { AppError, ErrorCode } from '@/errors';
import { sendError } from '@/utils/helper';
import { t } from '@/utils/i18n';

const DEFAULT_WINDOW = parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10); // 15 minutes
const DEFAULT_MAX = parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10);

type MemEntry = { count: number; reset: number };
const memStore: Map<string, MemEntry> = new Map();
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start periodic cleanup of expired entries in the in-memory store.
 * @param intervalMs how often to run cleanup (default 60s)
 */
export const startMemStoreCleanup = (intervalMs = 60 * 1000) => {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of memStore.entries()) {
      if (entry.reset <= now) {
        memStore.delete(key);
        removed += 1;
      }
    }
    if (removed > 0) logger.debug(`[RateLimit] cleaned ${removed} expired memStore entries`);
  }, intervalMs);
};

export const stopMemStoreCleanup = () => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
};

export const createRateLimiter = (opts: RateLimitOptions = {}): RequestHandler => {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW;
  const max = opts.max ?? DEFAULT_MAX;
  const prefix = opts.keyPrefix ?? 'rl';
  const skipPaths = opts.skipPaths ?? [];

  return async (req: Request, res: Response, next: NextFunction) => {
    if (skipPaths.some((path) => req.path === path || req.path.startsWith(path + '/'))) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    // Must be `._id`, not `.id` — `Express.Request.user` only ever carries `_id`;
    // the wrong key would silently fall back to 'anon' and make rate limiting IP-only.
    const userId = req.user?._id || 'anon';
    const now = Date.now();

    if (isRedisAvailable()) {
      const client = getRedisClient();
      if (!client) return next();

      const key = `${prefix}:${userId}:${ip}`;

      try {
        const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
          let lastError: unknown = new Error('withRetry: exhausted retries without a successful attempt');
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              return await fn();
            } catch (err: unknown) {
              lastError = err;
              if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 100)); // Backoff
              }
            }
          }
          throw lastError;
        };

        const current = (await withRetry(() => client.incr(key))) as number;
        if (current === 1) {
          await withRetry(() => client.pExpire(key, windowMs));
        }

        const remaining = Math.max(0, max - current);
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(remaining));

        if (current > max) {
          logger.warn(`[RateLimit] Blocked ${ip} (${userId}) on ${req.path} - quota exceeded`);
          res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
          return sendError(res, new AppError({ message: t('errors.rateLimited', req.lang), errorCode: ErrorCode.RATE_LIMITED }), req.lang);
        }

        return next();
      } catch (err) {
        logger.error('[RateLimit] Redis error after retries', { err: (err as Error).message, stack: (err as Error).stack });
        return next();
      }
    }

    // In-memory fallback
    const key = `${prefix}:${userId}:${ip}`;
    const entry = memStore.get(key) || { count: 0, reset: now + windowMs };
    if (now > entry.reset) {
      entry.count = 1;
      entry.reset = now + windowMs;
    } else {
      entry.count += 1;
    }

    memStore.set(key, entry);

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > max) {
      logger.warn(`[RateLimit] Blocked ${ip} (${userId}) on ${req.path} - quota exceeded`);
      res.setHeader('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return sendError(res, new AppError({ message: t('errors.rateLimited', req.lang), errorCode: ErrorCode.RATE_LIMITED }), req.lang);
    }

    return next();
  };
};

const rateLimitMiddleware = createRateLimiter();

export { memStore, rateLimitMiddleware };
