/**
 * Tests for csrf.middleware.ts (issue #134) — real, unmocked implementation.
 */

import { verifyCsrf } from '@/middlewares/csrf.middleware';
import { AuthorizationError } from '@/errors';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/utils/csrf';

function createMocks(opts: { method?: string; headers?: Record<string, string>; body?: Record<string, any>; query?: Record<string, any>; cookies?: Record<string, string> }) {
  const { method = 'POST', headers, body, query, cookies } = opts;
  const req: any = {
    method,
    header: (name: string) => headers?.[name] || headers?.[name.toLowerCase()] || undefined,
    body,
    query: query || {},
    cookies,
  };
  const next = jest.fn();
  return { req, next };
}

describe('verifyCsrf middleware', () => {
  it('calls next() with no error when the token came from the Authorization header', () => {
    const middleware = verifyCsrf('token');
    const { req, next } = createMocks({ headers: { Authorization: 'Bearer abc' } });

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() with no error for a safe method (GET) even when cookie-sourced', () => {
    const middleware = verifyCsrf('token');
    const { req, next } = createMocks({ method: 'GET', cookies: { token: 't' } });

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects with AuthorizationError when the token is cookie-sourced and no CSRF header is sent', () => {
    const middleware = verifyCsrf('token');
    const { req, next } = createMocks({ cookies: { token: 't' } });

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    const error = (next as jest.Mock).mock.calls[0][0];
    expect(error.errorCode).toBe('CSRF_TOKEN_INVALID');
  });

  it('rejects with AuthorizationError when the CSRF header does not match the CSRF cookie', () => {
    const middleware = verifyCsrf('token');
    const { req, next } = createMocks({
      cookies: { token: 't', [CSRF_COOKIE_NAME]: 'expected' },
      headers: { [CSRF_HEADER_NAME]: 'wrong' },
    });

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
  });

  it('calls next() with no error when the CSRF header matches the CSRF cookie', () => {
    const middleware = verifyCsrf('token');
    const { req, next } = createMocks({
      cookies: { token: 't', [CSRF_COOKIE_NAME]: 'matching' },
      headers: { [CSRF_HEADER_NAME]: 'matching' },
    });

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('uses the given field name to resolve the token source (e.g. refreshToken for /auth/refresh)', () => {
    const middleware = verifyCsrf('refreshToken');
    const { req, next } = createMocks({ body: { refreshToken: 'r' } });

    middleware(req, {} as any, next);

    // body-sourced token, not cookie-sourced -> immune, no CSRF error
    expect(next).toHaveBeenCalledWith();
  });
});
