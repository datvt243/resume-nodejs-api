import { authRefreshToken } from '@/auth/auth.controller';
import * as tokenBlacklist from '@/utils/tokenBlacklist';
import * as jwtUtils from '@/utils/jwt';
import * as sessionRevocation from '@/utils/sessionRevocation';

jest.mock('@/utils/tokenBlacklist');
jest.mock('@/utils/jwt');
jest.mock('@/utils/sessionRevocation');

const mockedIsBlacklisted = tokenBlacklist.isBlacklisted as jest.MockedFunction<typeof tokenBlacklist.isBlacklisted>;
const mockedAddToBlacklist = tokenBlacklist.addToBlacklist as jest.MockedFunction<typeof tokenBlacklist.addToBlacklist>;
const mockedGetRotatedAt = tokenBlacklist.getRotatedAt as jest.MockedFunction<typeof tokenBlacklist.getRotatedAt>;
const mockedInvalidateAllSessions = sessionRevocation.invalidateAllSessions as jest.MockedFunction<typeof sessionRevocation.invalidateAllSessions>;
const mockedJwtVerify = jwtUtils.jwtVerify as jest.MockedFunction<typeof jwtUtils.jwtVerify>;
const mockedJwtSign = jwtUtils.jwtSign as jest.MockedFunction<typeof jwtUtils.jwtSign>;
const mockedGetSessionsInvalidatedAt = sessionRevocation.getSessionsInvalidatedAt as jest.MockedFunction<typeof sessionRevocation.getSessionsInvalidatedAt>;
const actualSessionRevocation = jest.requireActual('@/utils/sessionRevocation');

function createMocks(body?: any, headers?: Record<string, string>) {
  const req: any = {
    header: (name: string) => headers?.[name.toLowerCase()] || headers?.[name] || undefined,
    body: body || {},
    query: {},
  };
  const json = jest.fn();
  const res: any = { status: jest.fn().mockReturnValue({ json }), json, cookie: jest.fn() };
  const next = jest.fn();
  return { req, res, next, json };
}

describe('authRefreshToken controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sessionRevocation.isSessionRevoked as jest.Mock).mockImplementation(actualSessionRevocation.isSessionRevoked);
    mockedGetSessionsInvalidatedAt.mockResolvedValue(null); // no logout-all in effect by default
    mockedGetRotatedAt.mockResolvedValue(null); // not a rotated-away token by default
  });

  it('returns 401 when missing refresh token', async () => {
    const { req, res, next } = createMocks();
    await authRefreshToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 when refresh token is blacklisted', async () => {
    mockedIsBlacklisted.mockResolvedValue(true);
    const { req, res, next } = createMocks({}, { authorization: 'Bearer old' });
    await authRefreshToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 200 and rotates tokens on valid refresh', async () => {
    mockedIsBlacklisted.mockResolvedValue(false);
    mockedJwtVerify.mockReturnValue({ _id: 'user1' } as any);
    mockedAddToBlacklist.mockResolvedValue(true);
    mockedJwtSign.mockReturnValueOnce('newAccess').mockReturnValueOnce('newRefresh');

    const { req, res, next } = createMocks({}, { authorization: 'Bearer oldRefresh' });
    await authRefreshToken(req, res, next);

    expect(mockedAddToBlacklist).toHaveBeenCalledWith('oldRefresh', expect.any(Number));
    expect(mockedJwtSign).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: { _id: 'user1', jti: expect.any(String) } }));
    expect(mockedInvalidateAllSessions).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 403 when the refresh token predates the last logout-all (issue #74)', async () => {
    mockedIsBlacklisted.mockResolvedValue(false);
    mockedJwtVerify.mockReturnValue({ _id: 'user1', iat: 1000 } as any);
    mockedGetSessionsInvalidatedAt.mockResolvedValue(2000);

    const { req, res, next } = createMocks({}, { authorization: 'Bearer oldRefresh' });
    await authRefreshToken(req, res, next);

    expect(mockedAddToBlacklist).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  describe('reuse of a rotated-away refresh token', () => {
    const nowSeconds = () => Math.floor(Date.now() / 1000);

    const expectRejectedWithoutMinting = (res: any) => {
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockedJwtSign).not.toHaveBeenCalled();
      expect(mockedAddToBlacklist).not.toHaveBeenCalled();
    };

    it('revokes every session of the candidate once past the grace window', async () => {
      mockedGetRotatedAt.mockResolvedValue(nowSeconds() - 60);
      mockedJwtVerify.mockReturnValue({ _id: 'user1', iat: nowSeconds() - 120 } as any);

      const { req, res, next } = createMocks({}, { authorization: 'Bearer stolen' });
      await authRefreshToken(req, res, next);

      expect(mockedInvalidateAllSessions).toHaveBeenCalledWith('user1');
      expectRejectedWithoutMinting(res);
    });

    it('only rejects inside the grace window (concurrent refresh), without verifying or revoking', async () => {
      mockedGetRotatedAt.mockResolvedValue(nowSeconds() - 5);

      const { req, res, next } = createMocks({}, { authorization: 'Bearer raced' });
      await authRefreshToken(req, res, next);

      expect(mockedJwtVerify).not.toHaveBeenCalled();
      expect(mockedInvalidateAllSessions).not.toHaveBeenCalled();
      expectRejectedWithoutMinting(res);
    });

    it('does not revoke when the reused token fails verification', async () => {
      mockedGetRotatedAt.mockResolvedValue(nowSeconds() - 60);
      mockedJwtVerify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const { req, res, next } = createMocks({}, { authorization: 'Bearer stolen' });
      await authRefreshToken(req, res, next);

      expect(mockedInvalidateAllSessions).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expectRejectedWithoutMinting(res);
    });

    it('does not revoke again for a token that already predates the last revocation', async () => {
      mockedGetRotatedAt.mockResolvedValue(nowSeconds() - 60);
      mockedJwtVerify.mockReturnValue({ _id: 'user1', iat: 1000 } as any);
      mockedGetSessionsInvalidatedAt.mockResolvedValue(2000);

      const { req, res, next } = createMocks({}, { authorization: 'Bearer stolen' });
      await authRefreshToken(req, res, next);

      expect(mockedInvalidateAllSessions).not.toHaveBeenCalled();
      expectRejectedWithoutMinting(res);
    });

    it('answers a reused token exactly like a logged-out one', async () => {
      mockedGetRotatedAt.mockResolvedValue(nowSeconds() - 60);
      mockedJwtVerify.mockReturnValue({ _id: 'user1', iat: nowSeconds() - 120 } as any);
      const reused = createMocks({}, { authorization: 'Bearer stolen' });
      await authRefreshToken(reused.req, reused.res, reused.next);

      mockedGetRotatedAt.mockResolvedValue(null);
      mockedIsBlacklisted.mockResolvedValue(true);
      const loggedOut = createMocks({}, { authorization: 'Bearer loggedOut' });
      await authRefreshToken(loggedOut.req, loggedOut.res, loggedOut.next);

      expect(reused.res.status.mock.calls).toEqual(loggedOut.res.status.mock.calls);
      expect(reused.json.mock.calls).toEqual(loggedOut.json.mock.calls);
    });
  });
});
