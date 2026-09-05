import { verifyToken } from '@/middlewares/verifyToken.middleware';
import * as jwtUtils from '@/utils/jwt';
import * as tokenBlacklist from '@/utils/tokenBlacklist';
import * as sessionRevocation from '@/utils/sessionRevocation';
import { AuthenticationError, TokenExpiredError, InvalidTokenError, TokenRevokedError } from '@/errors';

jest.mock('@/utils/jwt');
jest.mock('@/utils/tokenBlacklist');
jest.mock('@/utils/sessionRevocation');

const mockedJwtVerify = jwtUtils.jwtVerify as jest.MockedFunction<typeof jwtUtils.jwtVerify>;
const mockedIsBlacklisted = tokenBlacklist.isBlacklisted as jest.MockedFunction<typeof tokenBlacklist.isBlacklisted>;
const mockedGetSessionsInvalidatedAt = sessionRevocation.getSessionsInvalidatedAt as jest.MockedFunction<typeof sessionRevocation.getSessionsInvalidatedAt>;
// isSessionRevoked has real, simple logic — use the actual implementation instead of a mock
const actualSessionRevocation = jest.requireActual('@/utils/sessionRevocation');

function createMocks(headers?: Record<string, string>, query?: Record<string, any>) {
  const req: any = {
    header: (name: string) => headers?.[name.toLowerCase()] || headers?.[name] || undefined,
    query: query || {},
  };
  const json = jest.fn();
  const res: any = { status: jest.fn().mockReturnValue({ json }), json };
  const next = jest.fn();
  return { req, res, next, json };
}

describe('verifyToken middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sessionRevocation.isSessionRevoked as jest.Mock).mockImplementation(actualSessionRevocation.isSessionRevoked);
    mockedGetSessionsInvalidatedAt.mockResolvedValue(null); // no logout-all in effect by default
  });

  it('calls next with AuthenticationError when missing token', async () => {
    const { req, res, next } = createMocks();
    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    const error = (next as jest.Mock).mock.calls[0][0];
    expect(error.message).toBe('Access denied. No token provided.');
    expect(error.statusCode).toBe(401);
  });

  it('calls next with InvalidTokenError on invalid token', async () => {
    mockedIsBlacklisted.mockResolvedValue(false);
    mockedJwtVerify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const { req, res, next } = createMocks({ Authorization: 'Bearer invalid' });
    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(InvalidTokenError));
  });

  it('calls next with TokenExpiredError when jwtVerify throws TokenExpiredError', async () => {
    mockedIsBlacklisted.mockResolvedValue(false);
    const tokenExpiredError = new (require('jsonwebtoken').TokenExpiredError)('jwt expired', new Date());
    mockedJwtVerify.mockImplementation(() => {
      throw tokenExpiredError;
    });
    const { req, res, next } = createMocks({ Authorization: 'Bearer expired' });
    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(TokenExpiredError));
  });

  it('calls next with TokenRevokedError when token is blacklisted', async () => {
    mockedIsBlacklisted.mockResolvedValue(true);
    const { req, res, next } = createMocks({ Authorization: 'Bearer revoked' });
    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(TokenRevokedError));
    const error = (next as jest.Mock).mock.calls[0][0];
    expect(error.message).toBe('Token has been revoked.');
  });

  it('calls next and attaches req.user on valid token', async () => {
    mockedIsBlacklisted.mockResolvedValue(false);
    mockedJwtVerify.mockReturnValue({ _id: 'abc123' } as any);
    const { req, res, next } = createMocks({ Authorization: 'Bearer valid' });
    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ _id: 'abc123' });
  });

  it('calls next with InvalidTokenError when token payload is missing _id', async () => {
    mockedIsBlacklisted.mockResolvedValue(false);
    mockedJwtVerify.mockReturnValue({} as any);
    const { req, res, next } = createMocks({ Authorization: 'Bearer valid-no-id' });
    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(InvalidTokenError));
  });

  describe('logout-all (issue #74)', () => {
    it('calls next with TokenRevokedError when token was issued before the last logout-all', async () => {
      mockedIsBlacklisted.mockResolvedValue(false);
      mockedJwtVerify.mockReturnValue({ _id: 'abc123', iat: 1000 } as any);
      mockedGetSessionsInvalidatedAt.mockResolvedValue(2000); // logout-all happened after this token was issued
      const { req, res, next } = createMocks({ Authorization: 'Bearer stale' });
      await verifyToken(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(TokenRevokedError));
    });

    it('calls next and attaches req.user when token was issued after the last logout-all', async () => {
      mockedIsBlacklisted.mockResolvedValue(false);
      mockedJwtVerify.mockReturnValue({ _id: 'abc123', iat: 3000 } as any);
      mockedGetSessionsInvalidatedAt.mockResolvedValue(2000); // token minted after the logout-all
      const { req, res, next } = createMocks({ Authorization: 'Bearer fresh' });
      await verifyToken(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(TokenRevokedError));
      expect((req as any).user).toEqual({ _id: 'abc123' });
    });

    it('calls next with TokenRevokedError when a logout-all is in effect but the token has no iat', async () => {
      mockedIsBlacklisted.mockResolvedValue(false);
      mockedJwtVerify.mockReturnValue({ _id: 'abc123' } as any); // no iat
      mockedGetSessionsInvalidatedAt.mockResolvedValue(2000);
      const { req, res, next } = createMocks({ Authorization: 'Bearer no-iat' });
      await verifyToken(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(TokenRevokedError));
    });
  });
});
