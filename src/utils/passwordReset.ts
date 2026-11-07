/**
 * Single-use, short-lived password reset tokens. Same
 * Redis-with-in-memory-fallback TTL pattern as utils/tokenBlacklist.ts.
 *
 * NOTE: no email-sending infra exists in this project yet. The reset
 * link is logged instead of emailed — a stand-in until a mail provider
 * is chosen. See auth.service.ts's handlerForgotPassword.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import crypto from 'crypto';
import { isRedisAvailable, getRedisClient } from '@/services/redis';
import { logger } from '@/logger';

type Entry = { candidateId: string; expiresAt: number };

const RESET_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes, single-use

// In-Memory fallback (used when Redis unavailable)
const memoryStore = new Map<string, Entry>();

// cleanup expired entries periodically (in-memory only)
const _cleanup = setInterval(() => {
  const now = Date.now() / 1000;
  for (const [token, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(token);
  }
}, 60 * 1000);
// do not keep node process alive for tests
_cleanup.unref();

/**
 * Generate a single-use reset token for a candidate and store it
 * (Redis if available, else in-memory). Returns the raw token.
 */
export const createResetToken = async (candidateId: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + RESET_TOKEN_TTL_SECONDS;

  if (isRedisAvailable()) {
    const redis = getRedisClient();
    if (redis) {
      await redis.setEx(`password-reset:${token}`, RESET_TOKEN_TTL_SECONDS, candidateId);
      return token;
    }
  }

  // Fallback: in-memory
  memoryStore.set(token, { candidateId, expiresAt });
  return token;
};

/**
 * Verify a reset token and consume it in the same step — deleted whether
 * valid or not, so a token can never be replayed. Returns the candidateId
 * it was issued for, or null if missing/invalid/expired.
 */
export const consumeResetToken = async (token: string): Promise<string | null> => {
  if (!token) return null;

  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        // One atomic GETDEL: a separate GET then DEL lets two concurrent requests both read the token.
        return await redis.getDel(`password-reset:${token}`);
      }
    }

    // Fallback: in-memory
    const entry = memoryStore.get(token);
    memoryStore.delete(token);
    if (!entry) return null;
    const now = Date.now() / 1000;
    if (entry.expiresAt <= now) return null;
    return entry.candidateId;
  } catch (err) {
    logger.error('[passwordReset] Error consuming reset token', { err: (err as Error).message, stack: (err as Error).stack });
    return null;
  }
};

export default { createResetToken, consumeResetToken };
