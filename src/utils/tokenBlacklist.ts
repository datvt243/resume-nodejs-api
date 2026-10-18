/**
 * Token blacklist with Redis support or In-Memory fallback
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import jwt from 'jsonwebtoken';
import { isRedisAvailable, getRedisClient } from '@/services/redis';
import { logger } from '@/logger';

type Entry = { expiresAt: number; rotatedAt?: number };

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
 * `rotatedAt` (unix seconds) marks a refresh token blacklisted because it
 * was rotated, not logged out — getRotatedAt() reads it back so a later
 * reuse of that token can be told apart from a logged-out one.
 */
export const addToBlacklist = async (token: string, rotatedAt?: number): Promise<boolean> => {
  try {
    const decoded = jwt.decode(token);
    const exp = decoded && typeof decoded === 'object' ? decoded.exp : undefined;
    const expiresAt = exp || Math.floor(Date.now() / 1000) + 60 * 60; // default 1h
    const ttl = Math.max(expiresAt - Math.floor(Date.now() / 1000), 0);

    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        // SETEX: set with expiration (in seconds)
        await redis.setEx(`blacklist:${token}`, ttl, rotatedAt === undefined ? 'revoked' : `rotated:${rotatedAt}`);
        return true;
      }
    }

    // Fallback: in-memory
    memoryStore.set(token, rotatedAt === undefined ? { expiresAt } : { expiresAt, rotatedAt });
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Atomically marks a refresh token as rotated at `rotatedAt`, only if it
 * has no live blacklist entry yet. Returns true for the single caller that
 * won; two concurrent refreshes with the same token can't both mint a new
 * pair. Errors return false so a failed write never lets the token rotate twice.
 */
export const claimRotation = async (token: string, rotatedAt: number): Promise<boolean> => {
  try {
    const decoded = jwt.decode(token);
    const exp = decoded && typeof decoded === 'object' ? decoded.exp : undefined;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = exp || now + 60 * 60; // default 1h

    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        // Redis rejects EX 0, so a token expiring this very second still gets a 1s entry.
        const result = await redis.set(`blacklist:${token}`, `rotated:${rotatedAt}`, { EX: Math.max(expiresAt - now, 1), NX: true });
        return result === 'OK';
      }
    }

    // No await between the check and the set, so this is atomic within the process.
    const entry = memoryStore.get(token);
    if (entry && entry.expiresAt > Date.now() / 1000) return false;
    memoryStore.set(token, { expiresAt, rotatedAt });
    return true;
  } catch (err) {
    logger.error('[tokenBlacklist] Error claiming refresh token rotation', { err: (err as Error).message, stack: (err as Error).stack });
    return false;
  }
};

export const isBlacklisted = async (token: string): Promise<boolean> => {
  if (!token) return false;

  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        const result = await redis.get(`blacklist:${token}`);
        return result !== null;
      }
    }

    // Fallback: in-memory
    const entry = memoryStore.get(token);
    if (!entry) return false;
    const now = Date.now() / 1000;
    if (entry.expiresAt <= now) {
      memoryStore.delete(token);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('[tokenBlacklist] Error checking blacklist', { err: (err as Error).message, stack: (err as Error).stack });
    return false;
  }
};

/** When this token was rotated away (unix seconds), or null if it never was or its entry expired. */
export const getRotatedAt = async (token: string): Promise<number | null> => {
  if (!token) return null;

  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        const result = await redis.get(`blacklist:${token}`);
        return result?.startsWith('rotated:') ? parseInt(result.slice('rotated:'.length), 10) : null;
      }
    }

    const entry = memoryStore.get(token);
    if (!entry || entry.expiresAt <= Date.now() / 1000) return null;
    return entry.rotatedAt ?? null;
  } catch (err) {
    logger.error('[tokenBlacklist] Error reading rotation marker', { err: (err as Error).message, stack: (err as Error).stack });
    return null;
  }
};

export default { addToBlacklist, claimRotation, isBlacklisted, getRotatedAt };
