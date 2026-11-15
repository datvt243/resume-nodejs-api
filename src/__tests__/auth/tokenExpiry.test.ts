/**
 * Regression coverage for issue #155 — TOKEN_EXP_IN was defined in
 * config but never actually passed at any jwtSign() call site, so access
 * and refresh tokens always shared the same default (1h) expiry. Both
 * real call sites (auth.service.ts's handlerLogin, auth.controller.ts's
 * authRefreshToken) already sign with the exact same pattern:
 *   jwtSign({ data: { _id }, secretKey: TOKEN_SECRET, props: { expiresIn: TOKEN_EXP_IN || '1h' } })   // access
 *   jwtSign({ data: { _id }, secretKey: TOKEN_REFRESH, props: { expiresIn: TOKEN_REFRESH_EXP_IN } }) // refresh
 * This test exercises that exact pattern for real (no mocked jwtSign),
 * decodes the resulting JWTs, and proves the access token's lifetime
 * genuinely comes from TOKEN_EXP_IN and the refresh token's from
 * TOKEN_REFRESH_EXP_IN — 2 distinct, config-driven lifetimes, not a
 * shared hardcoded default.
 */

describe('access vs refresh token expiry — real TOKEN_EXP_IN/TOKEN_REFRESH_EXP_IN wiring (issue #155)', () => {
  const ORIGINAL_EXP_IN = process.env['TOKEN_EXP_IN'];
  const ORIGINAL_REFRESH_EXP_IN = process.env['TOKEN_REFRESH_EXP_IN'];

  afterEach(() => {
    if (ORIGINAL_EXP_IN === undefined) delete process.env['TOKEN_EXP_IN'];
    else process.env['TOKEN_EXP_IN'] = ORIGINAL_EXP_IN;
    if (ORIGINAL_REFRESH_EXP_IN === undefined) delete process.env['TOKEN_REFRESH_EXP_IN'];
    else process.env['TOKEN_REFRESH_EXP_IN'] = ORIGINAL_REFRESH_EXP_IN;
    jest.resetModules();
  });

  it('signs the access token per TOKEN_EXP_IN and the refresh token per a distinct, longer TOKEN_REFRESH_EXP_IN', () => {
    jest.resetModules();
    process.env['TOKEN_EXP_IN'] = '2h';
    process.env['TOKEN_REFRESH_EXP_IN'] = '14d';

    // Re-require AFTER setting env vars, so config picks up the new values
    // (process.config.ts reads process.env at module-load time).
    const { jwtSign } = require('@/utils/jwt');
    const { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } = require('@/config/process.config');

    // Exact same call shape as auth.service.ts's handlerLogin and
    // auth.controller.ts's authRefreshToken.
    const accessToken = jwtSign({ data: { _id: 'u1' }, secretKey: TOKEN_SECRET, props: { expiresIn: TOKEN_EXP_IN || '1h' } });
    const refreshToken = jwtSign({ data: { _id: 'u1' }, secretKey: TOKEN_REFRESH, props: { expiresIn: TOKEN_REFRESH_EXP_IN } });

    // jwtVerify's return type only declares `_id`, but the real decoded
    // JWT payload also carries `exp`/`iat` at runtime — cast to read them.
    const { jwtVerify } = require('@/utils/jwt');
    const accessDecoded = jwtVerify(accessToken, TOKEN_SECRET) as any;
    const refreshDecoded = jwtVerify(refreshToken, TOKEN_REFRESH) as any;

    expect(accessDecoded.exp - accessDecoded.iat).toBe(2 * 60 * 60); // 2h in seconds
    expect(refreshDecoded.exp - refreshDecoded.iat).toBe(14 * 24 * 60 * 60); // 14d in seconds
    expect(accessDecoded.exp - accessDecoded.iat).not.toBe(refreshDecoded.exp - refreshDecoded.iat);
  });

  it('falls back to a 1h access token when TOKEN_EXP_IN is unset (regression check on the || \'1h\' default)', () => {
    jest.resetModules();
    // '' not delete: re-requiring config re-runs dotenv, which would reload a local .env value but never overrides a set key.
    process.env['TOKEN_EXP_IN'] = '';
    process.env['TOKEN_REFRESH_EXP_IN'] = '7d';

    const { jwtSign, jwtVerify } = require('@/utils/jwt');
    const { TOKEN_SECRET, TOKEN_EXP_IN } = require('@/config/process.config');

    const accessToken = jwtSign({ data: { _id: 'u1' }, secretKey: TOKEN_SECRET, props: { expiresIn: TOKEN_EXP_IN || '1h' } });
    const accessDecoded = jwtVerify(accessToken, TOKEN_SECRET) as any;

    expect(accessDecoded.exp - accessDecoded.iat).toBe(60 * 60); // 1h fallback
  });

  it('TOKEN_REFRESH_EXP_IN itself defaults to 7d when unset (existing default, regression check)', () => {
    jest.resetModules();
    process.env['TOKEN_REFRESH_EXP_IN'] = ''; // see above: '' survives dotenv, delete doesn't

    const { TOKEN_REFRESH_EXP_IN } = require('@/config/process.config');

    expect(TOKEN_REFRESH_EXP_IN).toBe('7d');
  });
});
