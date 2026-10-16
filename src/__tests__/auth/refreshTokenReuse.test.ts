/**
 * End-to-end reuse-after-rotation scenario for POST /auth/refresh, on the
 * real jwt sign/verify and the real in-memory blacklist + session
 * revocation stores (Redis is never initialised in tests). Only the
 * clock is faked, to step past the reuse grace window.
 */

import { authRefreshToken } from '@/auth/auth.controller';
import { jwtSign, jwtVerify } from '@/utils/jwt';
import { getSessionsInvalidatedAt, isSessionRevoked } from '@/utils/sessionRevocation';
import { TOKEN_REFRESH, TOKEN_SECRET } from '@/config/process.config';

const T0 = Date.UTC(2026, 9, 16, 9, 0, 0);

const loginRefreshToken = (candidateId: string) =>
  jwtSign({ data: { _id: candidateId, jti: `login-${Date.now()}` }, secretKey: TOKEN_REFRESH, props: { expiresIn: '7d' } });

const refresh = async (refreshToken: string) => {
  const json = jest.fn();
  const res: any = { status: jest.fn().mockReturnValue({ json }), cookie: jest.fn() };
  const req: any = { header: (name: string) => (name.toLowerCase() === 'authorization' ? `Bearer ${refreshToken}` : undefined), body: {}, query: {} };
  const next = jest.fn();
  await authRefreshToken(req, res, next);
  const body = json.mock.calls[0]?.[0];
  return { status: res.status.mock.calls[0]?.[0] as number, data: body?.data as { token: string; tokenRefresh: string } | undefined, next };
};

const accessTokenRevoked = async (candidateId: string, accessToken: string) => {
  const { iat } = jwtVerify(accessToken, TOKEN_SECRET) as { iat?: number };
  return isSessionRevoked(iat, await getSessionsInvalidatedAt(candidateId));
};

const advanceSeconds = (seconds: number) => jest.setSystemTime(Date.now() + seconds * 1000);

describe('refresh-token reuse after rotation (end-to-end, in-memory stores)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(T0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('revokes all of the candidate\'s sessions when a rotated token is replayed after the grace window', async () => {
    const original = loginRefreshToken('cand-theft');

    const owner = await refresh(original);
    expect(owner.status).toBe(200);
    const ownerPair = owner.data!;
    expect(ownerPair.tokenRefresh).not.toBe(original);

    advanceSeconds(30);
    const thief = await refresh(original);
    expect(thief.status).toBe(403);
    expect(thief.data).toBeNull();

    expect(await accessTokenRevoked('cand-theft', ownerPair.token)).toBe(true);
    expect((await refresh(ownerPair.tokenRefresh)).status).toBe(403);
  });

  it('lets the owner log in again, and a later replay of the old token does not revoke the new session', async () => {
    const original = loginRefreshToken('cand-relogin');
    await refresh(original);
    advanceSeconds(30);
    await refresh(original);
    const revokedAt = await getSessionsInvalidatedAt('cand-relogin');

    advanceSeconds(5);
    const relogin = await refresh(loginRefreshToken('cand-relogin'));
    expect(relogin.status).toBe(200);

    advanceSeconds(60);
    expect((await refresh(original)).status).toBe(403);
    expect(await getSessionsInvalidatedAt('cand-relogin')).toBe(revokedAt);
    expect((await refresh(relogin.data!.tokenRefresh)).status).toBe(200);
  });

  it('only rejects a replay inside the grace window — the newest pair keeps working', async () => {
    const original = loginRefreshToken('cand-tabs');
    const firstTab = await refresh(original);

    advanceSeconds(5);
    expect((await refresh(original)).status).toBe(403);

    expect(await getSessionsInvalidatedAt('cand-tabs')).toBeNull();
    expect((await refresh(firstTab.data!.tokenRefresh)).status).toBe(200);
  });

  it('issues a distinct refresh token on every rotation within the same second, so a later refresh is not taken for reuse', async () => {
    const first = await refresh(loginRefreshToken('cand-fast'));
    const second = await refresh(first.data!.tokenRefresh);
    expect(second.status).toBe(200);
    expect(second.data!.tokenRefresh).not.toBe(first.data!.tokenRefresh);

    advanceSeconds(30);
    const third = await refresh(second.data!.tokenRefresh);

    expect(third.status).toBe(200);
    expect(await getSessionsInvalidatedAt('cand-fast')).toBeNull();
  });
});
