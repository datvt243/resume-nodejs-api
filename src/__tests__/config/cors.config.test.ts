/**
 * Tests for cors.config.ts (issue #119) — `credentials: true` can never be
 * paired with a wildcard origin, so this locks in the allow-list behavior.
 */

describe('corsConfig', () => {
  // `exactOptionalPropertyTypes` (issue #189): these tests deliberately
  // pass `CORS_ORIGIN: undefined` to simulate the env var being unset —
  // a real, intentional value (not an accidental omission) — so the
  // param type needs `| undefined` added explicitly, not just `?:`.
  const loadWith = (env: { CORS_ORIGIN?: string | undefined; NODE_ENV?: string }) => {
    jest.resetModules();
    jest.doMock('@/config/process.config', () => env);
    return require('@/config/cors.config').corsConfig;
  };

  afterEach(() => {
    jest.dontMock('@/config/process.config');
  });

  it('always sets credentials: true and never a literal wildcard origin', () => {
    const corsConfig = loadWith({ CORS_ORIGIN: 'https://app.example.com', NODE_ENV: 'production' });
    const config = corsConfig();

    expect(config.credentials).toBe(true);
    expect(config.origin).not.toBe('*');
  });

  it('exposes Content-Disposition so a cross-origin client can read the download filename', () => {
    const corsConfig = loadWith({ CORS_ORIGIN: 'https://app.example.com', NODE_ENV: 'production' });

    expect(corsConfig().exposedHeaders).toEqual(['Content-Disposition']);
  });

  it('reflects an explicit comma-separated allow-list as an array', () => {
    const corsConfig = loadWith({ CORS_ORIGIN: 'https://app.example.com, https://admin.example.com', NODE_ENV: 'production' });
    const config = corsConfig();

    expect(config.origin).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('fails closed (false) in production when CORS_ORIGIN is unset', () => {
    const corsConfig = loadWith({ CORS_ORIGIN: undefined, NODE_ENV: 'production' });
    const config = corsConfig();

    expect(config.origin).toBe(false);
  });

  it('reflects the caller origin (true) in development when CORS_ORIGIN is unset', () => {
    const corsConfig = loadWith({ CORS_ORIGIN: undefined, NODE_ENV: 'development' });
    const config = corsConfig();

    expect(config.origin).toBe(true);
  });
});
