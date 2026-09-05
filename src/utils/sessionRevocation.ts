/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: "Log out of all devices" (issue #74) — revoke every token
 *   previously issued to a candidate at once, without enumerating or
 *   blacklisting them individually.
 *
 *   Design note: the issue proposal suggested a `tokenVersion` field on
 *   the Candidate model, checked via an extra Mongo lookup per request —
 *   but flagged that cost as worth avoiding if possible. This reuses the
 *   exact same Redis-with-in-memory-fallback shape as
 *   `tokenBlacklist.ts` instead: store a per-candidate
 *   "invalidated before" timestamp, and compare it against the JWT's
 *   standard `iat` claim in verifyToken.middleware.ts / authRefreshToken.
 *   No schema change, no new DB round trip — just one more Redis/mem
 *   lookup alongside the blacklist check that already runs on every
 *   authenticated request.
 */
import { isRedisAvailable, getRedisClient } from '@/services/redis';
import { logger } from '@/logger';

// Generous fixed TTL for the revocation marker — only needs to outlive
// the longest-lived token type (refresh token) so a stale marker doesn't
// linger forever, not tied precisely to TOKEN_REFRESH_EXP_IN.
const REVOCATION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// In-memory fallback (used when Redis unavailable), same shape as tokenBlacklist.ts
const memoryStore = new Map<string, number>(); // candidateId -> invalidated-before (unix seconds)

const _cleanup = setInterval(() => {
  const cutoff = Date.now() / 1000 - REVOCATION_TTL_SECONDS;
  for (const [candidateId, invalidatedAt] of memoryStore) {
    if (invalidatedAt <= cutoff) memoryStore.delete(candidateId);
  }
}, 60 * 1000);
// do not keep node process alive for tests
if (typeof (_cleanup as any).unref === 'function') (_cleanup as any).unref();

/**
 * Marks every token issued to this candidate up to now as revoked.
 * Any token (access or refresh) whose `iat` predates this call will be
 * rejected — including the token used to make this very request.
 */
export const invalidateAllSessions = async (candidateId: string): Promise<boolean> => {
  const now = Math.floor(Date.now() / 1000);
  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        await redis.setEx(`sessions-invalidated:${candidateId}`, REVOCATION_TTL_SECONDS, String(now));
        return true;
      }
    }

    memoryStore.set(candidateId, now);
    return true;
  } catch (err) {
    logger.error('[sessionRevocation] Error invalidating sessions', { err: (err as Error).message, stack: (err as Error).stack });
    return false;
  }
};

/**
 * Returns the unix timestamp (seconds) before which all of this
 * candidate's tokens are revoked, or null if `logout-all` was never
 * called (or the marker has expired).
 */
export const getSessionsInvalidatedAt = async (candidateId: string): Promise<number | null> => {
  if (!candidateId) return null;

  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        const result = await redis.get(`sessions-invalidated:${candidateId}`);
        return result !== null ? parseInt(result, 10) : null;
      }
    }

    return memoryStore.get(candidateId) ?? null;
  } catch (err) {
    logger.error('[sessionRevocation] Error reading invalidation marker', { err: (err as Error).message, stack: (err as Error).stack });
    return null;
  }
};

/** True if a token issued at `iat` (unix seconds) has been revoked by a prior logout-all. */
export const isSessionRevoked = (iat: number | undefined, invalidatedAt: number | null): boolean => {
  if (!invalidatedAt) return false;
  if (!iat) return true; // no iat to compare against a revocation marker — treat as revoked, not trusted
  return iat < invalidatedAt;
};

export default { invalidateAllSessions, getSessionsInvalidatedAt, isSessionRevoked };
