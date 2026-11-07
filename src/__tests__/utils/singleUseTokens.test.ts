/**
 * Reset and email-verify tokens must be single-use even when two requests
 * race. The fake Redis client only exposes an atomic `getDel`, so a GET then
 * DEL implementation can't pass.
 */
import { createResetToken, consumeResetToken } from '@/utils/passwordReset';
import { createVerificationToken, consumeVerificationToken } from '@/utils/emailVerification';

const mockStore = new Map<string, string>();

jest.mock('@/services/redis', () => ({
  isRedisAvailable: () => true,
  getRedisClient: () => ({
    setEx: (key: string, _ttl: number, value: string) => Promise.resolve(void mockStore.set(key, value)),
    getDel: (key: string) => {
      const value = mockStore.get(key) ?? null;
      mockStore.delete(key);
      return Promise.resolve(value);
    },
  }),
}));

describe.each([
  ['reset', createResetToken, consumeResetToken],
  ['email-verify', createVerificationToken, consumeVerificationToken],
])('%s token (redis)', (_label, create, consume) => {
  beforeEach(() => mockStore.clear());

  it('lets only one of two concurrent consumes succeed', async () => {
    const token = await create('cand1');

    const results = await Promise.all([consume(token), consume(token)]);

    expect(results.filter((r) => r === 'cand1')).toHaveLength(1);
    expect(results).toContain(null);
  });
});
