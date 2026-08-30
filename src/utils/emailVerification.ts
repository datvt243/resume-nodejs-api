/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Single-use, TTL email-verification tokens. Same
 * Redis-with-in-memory-fallback pattern as utils/passwordReset.ts /
 * utils/tokenBlacklist.ts.
 *
 * NOTE (issue #71): no email-sending infra exists in this project yet —
 * same gap as issue #70. The verification link is logged instead of
 * emailed, a stand-in until a mail provider is chosen. See
 * auth.service.ts's handlerRegister.
 */

import crypto from 'crypto';
import { isRedisAvailable, getRedisClient } from '@/services/redis';
import { logger } from '@/logger';

type Entry = { candidateId: string; expiresAt: number };

// Longer-lived than the 15-minute password-reset token — verifying an
// email is lower-stakes than resetting a password, and users need more
// realistic time to check their inbox.
const VERIFICATION_TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours, single-use

const memoryStore = new Map<string, Entry>();

const _cleanup = setInterval(() => {
  const now = Date.now() / 1000;
  for (const [token, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(token);
  }
}, 60 * 1000);
if (typeof (_cleanup as any).unref === 'function') (_cleanup as any).unref();

/**
 * Generate a single-use email-verification token for a candidate and
 * store it (Redis if available, else in-memory). Returns the raw token.
 */
export const createVerificationToken = async (candidateId: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + VERIFICATION_TOKEN_TTL_SECONDS;

  if (isRedisAvailable()) {
    const redis = getRedisClient();
    if (redis) {
      await redis.setEx(`email-verify:${token}`, VERIFICATION_TOKEN_TTL_SECONDS, candidateId);
      return token;
    }
  }

  memoryStore.set(token, { candidateId, expiresAt });
  return token;
};

/**
 * Verify a token and consume it in the same step — deleted whether valid
 * or not, so it can never be replayed. Returns the candidateId it was
 * issued for, or null if missing/invalid/expired.
 */
export const consumeVerificationToken = async (token: string): Promise<string | null> => {
  if (!token) return null;

  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        const candidateId = await redis.get(`email-verify:${token}`);
        if (candidateId !== null) await redis.del(`email-verify:${token}`);
        return candidateId;
      }
    }

    const entry = memoryStore.get(token);
    memoryStore.delete(token);
    if (!entry) return null;
    const now = Date.now() / 1000;
    if (entry.expiresAt <= now) return null;
    return entry.candidateId;
  } catch (err) {
    logger.error('[emailVerification] Error consuming verification token', { err: (err as Error).message, stack: (err as Error).stack });
    return null;
  }
};

export default { createVerificationToken, consumeVerificationToken };
