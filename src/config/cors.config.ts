/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { CORS_ORIGIN, NODE_ENV } from '@/config/process.config';

const allowedOrigins = (CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * `origin: '*'` cannot be combined with `credentials: true` (browsers
 * refuse to expose the response / store the Set-Cookie header), so once
 * cookie-based auth needs credentialed requests we must reflect an
 * explicit allow-list instead (issue #119). With no `CORS_ORIGIN`
 * configured: reflect the caller's origin in development (so local
 * frontends keep working with zero setup) but fail closed (`false`) in
 * production rather than silently falling back to a wildcard-equivalent.
 */
export const corsConfig = () => ({
  origin: allowedOrigins.length > 0 ? allowedOrigins : NODE_ENV !== 'production',
  credentials: true,
  optionsSuccessStatus: 200,
});
