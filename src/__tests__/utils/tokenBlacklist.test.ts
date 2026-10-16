/**
 * Rotation markers on the token blacklist, through the Redis path (a
 * Map-backed fake client) and the in-memory fallback.
 */

import jwt from 'jsonwebtoken';
import { addToBlacklist, getRotatedAt, isBlacklisted } from '@/utils/tokenBlacklist';

const mockStore = new Map<string, string>();
let mockRedisUp = false;

jest.mock('@/services/redis', () => ({
  isRedisAvailable: () => mockRedisUp,
  getRedisClient: () => ({
    setEx: (key: string, _ttl: number, value: string) => Promise.resolve(void mockStore.set(key, value)),
    get: (key: string) => Promise.resolve(mockStore.get(key) ?? null),
  }),
}));

const tokenFor = (sub: string) => jwt.sign({ sub }, 'secret', { expiresIn: '1h' });

describe.each([
  ['redis', true],
  ['in-memory', false],
])('tokenBlacklist rotation markers (%s)', (label, redisUp) => {
  beforeEach(() => {
    mockRedisUp = redisUp;
    mockStore.clear();
  });

  it('reads back when a rotated token was rotated, and still reports it blacklisted', async () => {
    const token = tokenFor(`rotated-${label}`);
    await addToBlacklist(token, 1_760_000_000);

    expect(await getRotatedAt(token)).toBe(1_760_000_000);
    expect(await isBlacklisted(token)).toBe(true);
  });

  it('returns null for a token blacklisted by logout, and for an unknown token', async () => {
    const loggedOut = tokenFor(`logout-${label}`);
    await addToBlacklist(loggedOut);

    expect(await getRotatedAt(loggedOut)).toBeNull();
    expect(await isBlacklisted(loggedOut)).toBe(true);
    expect(await getRotatedAt(tokenFor(`unknown-${label}`))).toBeNull();
  });
});
