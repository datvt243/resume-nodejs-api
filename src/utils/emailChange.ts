/**
 * Single-use, TTL change-email tokens bound to the new address. Same
 * Redis-with-in-memory-fallback pattern as utils/emailVerification.ts.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import crypto from 'crypto';
import { isRedisAvailable, getRedisClient } from '@/services/redis';
import { logger } from '@/logger';

export type EmailChange = { candidateId: string; newEmail: string };
// `issuedAt` (unix seconds) lets the confirm step drop a change requested before the candidate's sessions were revoked.
export type PendingEmailChange = EmailChange & { issuedAt: number };
type Entry = PendingEmailChange & { expiresAt: number };

const EMAIL_CHANGE_TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours, single-use

const memoryStore = new Map<string, Entry>();

const _cleanup = setInterval(() => {
  const now = Date.now() / 1000;
  for (const [token, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(token);
  }
}, 60 * 1000);
_cleanup.unref();

const isPendingEmailChange = (value: unknown): value is PendingEmailChange =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Record<string, unknown>)['candidateId'] === 'string' &&
  typeof (value as Record<string, unknown>)['newEmail'] === 'string' &&
  typeof (value as Record<string, unknown>)['issuedAt'] === 'number';

/** Store a pending email change (Redis if available, else in-memory) and return its raw token. */
export const createEmailChangeToken = async (change: EmailChange): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + EMAIL_CHANGE_TOKEN_TTL_SECONDS;

  if (isRedisAvailable()) {
    const redis = getRedisClient();
    if (redis) {
      await redis.setEx(`email-change:${token}`, EMAIL_CHANGE_TOKEN_TTL_SECONDS, JSON.stringify({ ...change, issuedAt }));
      return token;
    }
  }

  memoryStore.set(token, { ...change, issuedAt, expiresAt });
  return token;
};

/**
 * Verify a token and consume it in the same step — deleted whether valid
 * or not, so it can never be replayed. Returns the pending change, or null
 * if missing/invalid/expired.
 */
export const consumeEmailChangeToken = async (token: string): Promise<PendingEmailChange | null> => {
  if (!token) return null;

  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        // One atomic GETDEL: a separate GET then DEL lets two concurrent requests both read the token.
        const raw = await redis.getDel(`email-change:${token}`);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        return isPendingEmailChange(parsed) ? { candidateId: parsed.candidateId, newEmail: parsed.newEmail, issuedAt: parsed.issuedAt } : null;
      }
    }

    const entry = memoryStore.get(token);
    memoryStore.delete(token);
    if (!entry || entry.expiresAt <= Date.now() / 1000) return null;
    return { candidateId: entry.candidateId, newEmail: entry.newEmail, issuedAt: entry.issuedAt };
  } catch (err) {
    logger.error('[emailChange] Error consuming email-change token', { err: (err as Error).message, stack: (err as Error).stack });
    return null;
  }
};
