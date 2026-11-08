import { authLimiter, createRateLimiter, memStore, startMemStoreCleanup, stopMemStoreCleanup } from '@/middlewares/rateLimit.middleware';
import { Request, Response, NextFunction } from 'express';

jest.mock('@/services/redis', () => ({
  isRedisAvailable: jest.fn(() => false), // Force in-memory for most tests
  getRedisClient: jest.fn(() => null),
}));

describe('rateLimit middleware (in-memory)', () => {
  const makeReq = (ip: string = '1.2.3.4', path: string = '/test', user?: { _id: string }) =>
    ({
      ip,
      socket: { remoteAddress: ip },
      path,
      user,
      // `exactOptionalPropertyTypes` (issue #189): this mock's inferred
      // shape now carries an explicit `user: ... | undefined`, which no
      // longer "sufficiently overlaps" `Request` for a direct `as` cast
      // (TS's own suggested fix) — through `unknown` first, same as
      // every other fake-request mock in this test suite.
    }) as unknown as Request;

  const makeRes = () =>
    ({
      setHeader: jest.fn(),
      status: jest.fn().mockReturnValue({ json: jest.fn() }),
    }) as unknown as Response;

  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    memStore.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows requests up to max and blocks afterwards', async () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60 * 60 * 1000, keyPrefix: 'test-rl' });
    const res = makeRes();

    await limiter(makeReq(), res, next);
    expect(next).toHaveBeenCalledTimes(1);

    await limiter(makeReq(), res, next);
    expect(next).toHaveBeenCalledTimes(2);

    await limiter(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('authLimiter allows 10 requests per window and blocks the 11th (issue #387)', async () => {
    const limit = authLimiter as unknown as (req: Request, res: Response, next: NextFunction) => Promise<void>;
    const status = jest.fn().mockReturnValue({ json: jest.fn() });
    const res = { setHeader: jest.fn(), status } as unknown as Response;
    for (let i = 0; i < 10; i++) await limit(makeReq('9.9.9.9', '/login'), res, next);
    expect(next).toHaveBeenCalledTimes(10);

    await limit(makeReq('9.9.9.9', '/login'), res, next);
    expect(next).toHaveBeenCalledTimes(10);
    expect(status).toHaveBeenCalledWith(429);
  });

  it('separates limits by IP and userId', async () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60 * 60 * 1000, keyPrefix: 'test-rl' });
    const res = makeRes();

    const req1 = makeReq('a', undefined, { _id: 'user1' });
    await limiter(req1, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    const req2 = makeReq('a', undefined, { _id: 'user2' });
    await limiter(req2, res, next);
    expect(next).toHaveBeenCalledTimes(2); // Different userId

    const req3 = makeReq('b');
    await limiter(req3, res, next); // Different IP
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('skips rate limiting for exempt paths', async () => {
    const limiter = createRateLimiter({
      max: 0,
      skipPaths: ['/health', '/metrics'],
    });
    const res = makeRes();

    await limiter(makeReq(undefined, '/health'), res, next);
    expect(next).toHaveBeenCalledTimes(1); // Skipped

    await limiter(makeReq(undefined, '/health/sub'), res, next);
    expect(next).toHaveBeenCalledTimes(2); // Prefix match
  });

  it('sets correct rate limit headers', async () => {
    const limiter = createRateLimiter({ max: 5, windowMs: 1000 });
    const res = makeRes();

    await limiter(makeReq(), res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
  });
});

describe('memStore cleanup job', () => {
  afterEach(() => {
    try {
      stopMemStoreCleanup();
    } catch (e) {
      // ignore
    }
    memStore.clear();
    jest.useRealTimers();
  });

  it('removes expired entries when cleanup runs', async () => {
    jest.useFakeTimers();
    const key = 'cleanup-test:anon:1.2.3.5';
    const now = Date.now();
    memStore.set(key, { count: 1, reset: now - 1000 });

    startMemStoreCleanup(1000);

    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(memStore.has(key)).toBe(false);
  });
});
