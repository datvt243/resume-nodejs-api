import { authRefreshToken } from '@/auth/auth.controller';
import * as tokenBlacklist from '@/utils/tokenBlacklist';
import * as jwtUtils from '@/utils/jwt';
import * as sessionRevocation from '@/utils/sessionRevocation';

jest.mock('@/utils/tokenBlacklist');
jest.mock('@/utils/jwt');
jest.mock('@/utils/sessionRevocation');

const mockedIsBlacklisted = tokenBlacklist.isBlacklisted as jest.MockedFunction<typeof tokenBlacklist.isBlacklisted>;
const mockedAddToBlacklist = tokenBlacklist.addToBlacklist as jest.MockedFunction<typeof tokenBlacklist.addToBlacklist>;
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
  const res: any = { status: jest.fn().mockReturnValue({ json }), json };
  const next = jest.fn();
  return { req, res, next, json };
}

describe('authRefreshToken controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sessionRevocation.isSessionRevoked as jest.Mock).mockImplementation(actualSessionRevocation.isSessionRevoked);
    mockedGetSessionsInvalidatedAt.mockResolvedValue(null); // no logout-all in effect by default
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

    expect(mockedAddToBlacklist).toHaveBeenCalledWith('oldRefresh');
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
});
