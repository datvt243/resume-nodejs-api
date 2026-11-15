/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import 'dotenv/config';
import Joi from 'joi';

const secret = Joi.string().min(32).required();
const mongoCredential = Joi.string().when('MONGO_URI', { not: Joi.exist(), then: Joi.required() });

const envSchema = Joi.object({
  TOKEN_SECRET: secret,
  TOKEN_REFRESH: secret,
  SESSION_SECRET: secret,
  MONGO_URI: Joi.string(),
  MONGOBD_USER: mongoCredential,
  MONGOBD_PASSWORD: mongoCredential,
  LOCAL_PORT: Joi.number(),
  MONGO_MAX_POOL_SIZE: Joi.number(),
  MONGO_MIN_POOL_SIZE: Joi.number(),
  TRUST_PROXY_HOPS: Joi.number(),
}).unknown(true);

/**
 * Production refuses to boot on any invalid env var (thrown at import, before
 * the server listens); elsewhere only missing vars are warned about, so the
 * short test/dev secrets in `jest.setup.ts` keep working.
 */
export const checkEnv = (env: NodeJS.ProcessEnv = process.env): void => {
  // `KEY=` (as in the .env templates) means unset everywhere else in the app.
  const setVars = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== ''));
  const { error } = envSchema.validate(setVars, { abortEarly: false });
  if (!error) return;

  if (env['NODE_ENV'] === 'production') {
    throw new Error('Invalid environment variables:\n' + error.details.map((d) => `- ${d.message}`).join('\n'));
  }

  const missing = error.details.filter((d) => d.type === 'any.required');
  if (missing.length > 0) {
    console.warn('⚠️  Missing required environment variables:\n' + missing.map((d) => `- ${d.message}`).join('\n'));
  }
};

checkEnv();

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

/**
 * No dedicated env var for refresh-token lifetime; default it to
 * meaningfully outlive the access token (TOKEN_EXP_IN) so the refresh
 * flow (get a new access token once the old one expires) stays usable.
 */
const TOKEN_REFRESH_EXP_IN = process.env['TOKEN_REFRESH_EXP_IN'] || '7d';

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
