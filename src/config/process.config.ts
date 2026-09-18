/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = ['MONGOBD_USER', 'MONGOBD_PASSWORD', 'TOKEN_SECRET', 'TOKEN_REFRESH', 'SESSION_SECRET'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  const keyList = missingVars.map((key) => `- ${key}`).join('\n');
  console.warn('⚠️  Missing required environment variables:\n' + keyList);
  console.warn('Please set these variables in your .env file or environment before running the application.');
}

const {
  NODE_ENV,
  LOCAL_PORT,
  MONGOBD_USER,
  MONGOBD_PASSWORD,
  SESSION_SECRET,
  TOKEN_SECRET,
  TOKEN_REFRESH,
  TOKEN_EXP_IN,
  MONGO_URI,
  REDIS_URL,
  MONGO_MAX_POOL_SIZE,
  MONGO_MIN_POOL_SIZE,
  CORS_ORIGIN,
} = process.env;

// No dedicated env var for refresh-token lifetime; default it to
// meaningfully outlive the access token (TOKEN_EXP_IN) so the refresh
// flow (get a new access token once the old one expires) stays usable.
const TOKEN_REFRESH_EXP_IN = process.env.TOKEN_REFRESH_EXP_IN || '7d';

export {
  NODE_ENV,
  LOCAL_PORT,
  MONGO_URI,
  MONGOBD_USER,
  MONGOBD_PASSWORD,
  SESSION_SECRET,
  TOKEN_SECRET,
  TOKEN_REFRESH,
  TOKEN_EXP_IN,
  TOKEN_REFRESH_EXP_IN,
  REDIS_URL,
  MONGO_MAX_POOL_SIZE,
  MONGO_MIN_POOL_SIZE,
  CORS_ORIGIN,
};
