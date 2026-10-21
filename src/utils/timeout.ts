/**
 * Timeout utilities for async operations
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { AppError, ErrorCode } from '@/errors/AppError';
import { t } from '@/utils/i18n';

const DB_TIMEOUT = 5000; // 5s for DB ops
const REDIS_TIMEOUT = 2000; // 2s for Redis
const CONNECT_TIMEOUT = 10000; // 10s for connections

/**
 * Promise timeout wrapper with AbortController
 */
export const withTimeout = <T>({ promise, ms, signal }: { promise: Promise<T>; ms: number; signal?: AbortSignal | undefined }): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        // shortcut: message is in DEFAULT_LANG (no request here), until timeouts carry the request lang.
        reject(new AppError({ message: t('errors.serviceUnavailable'), errorCode: ErrorCode.SERVICE_UNAVAILABLE }));
      }, ms);
      if (signal) {
        signal.addEventListener('abort', () => clearTimeout(timeoutId));
      }
    }),
  ]);
};

export const withDBTimeout = <T>(promise: Promise<T>, signal?: AbortSignal) => withTimeout({ promise, ms: DB_TIMEOUT, signal });
export const withRedisTimeout = <T>(promise: Promise<T>, signal?: AbortSignal) => withTimeout({ promise, ms: REDIS_TIMEOUT, signal });
export const withConnectTimeout = <T>(promise: Promise<T>, signal?: AbortSignal) => withTimeout({ promise, ms: CONNECT_TIMEOUT, signal });

export { DB_TIMEOUT, REDIS_TIMEOUT, CONNECT_TIMEOUT };
export default withTimeout;
