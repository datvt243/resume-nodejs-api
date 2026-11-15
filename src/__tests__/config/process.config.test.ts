import { checkEnv } from '@/config/process.config';

const SECRET = 'x'.repeat(32);
const validProd = {
  NODE_ENV: 'production',
  TOKEN_SECRET: SECRET,
  TOKEN_REFRESH: SECRET,
  SESSION_SECRET: SECRET,
  MONGOBD_USER: 'user',
  MONGOBD_PASSWORD: 'password',
};

describe('checkEnv', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  it('production: a valid config passes, numeric vars unset', () => {
    expect(() => checkEnv(validProd)).not.toThrow();
  });

  it('production: TOKEN_SECRET missing → throws naming it', () => {
    const { TOKEN_SECRET: _omit, ...env } = validProd;
    expect(() => checkEnv(env)).toThrow(/TOKEN_SECRET/);
  });

  it.each(['TOKEN_REFRESH', 'SESSION_SECRET'])('production: %s of 31 chars → throws', (key) => {
    expect(() => checkEnv({ ...validProd, [key]: 'x'.repeat(31) })).toThrow(new RegExp(key));
  });

  it('production: only MONGO_URI (no MONGOBD_*) passes', () => {
    const { MONGOBD_USER: _u, MONGOBD_PASSWORD: _p, ...env } = validProd;
    expect(() => checkEnv({ ...env, MONGO_URI: 'mongodb://localhost/test' })).not.toThrow();
  });

  it('production: blank vars count as unset (MONGO_URI + blank MONGOBD_*, blank numeric vars) → passes', () => {
    const env = { ...validProd, MONGO_URI: 'mongodb://localhost/test', MONGOBD_USER: '', MONGOBD_PASSWORD: '', LOCAL_PORT: '', TRUST_PROXY_HOPS: '' };
    expect(() => checkEnv(env)).not.toThrow();
  });

  it('production: blank MONGO_URI with valid MONGOBD_* → passes', () => {
    expect(() => checkEnv({ ...validProd, MONGO_URI: '' })).not.toThrow();
  });

  it('production: blank TOKEN_SECRET → throws naming it', () => {
    expect(() => checkEnv({ ...validProd, TOKEN_SECRET: '' })).toThrow(/TOKEN_SECRET/);
  });

  it('production: neither MONGO_URI nor both MONGOBD_* → throws', () => {
    const { MONGOBD_PASSWORD: _p, ...env } = validProd;
    expect(() => checkEnv(env)).toThrow(/MONGOBD_PASSWORD/);
  });

  it.each(['LOCAL_PORT', 'MONGO_MAX_POOL_SIZE', 'MONGO_MIN_POOL_SIZE', 'TRUST_PROXY_HOPS'])('production: %s=abc → throws', (key) => {
    expect(() => checkEnv({ ...validProd, [key]: 'abc' })).toThrow(new RegExp(key));
  });

  it('development: missing secret warns naming it, does not throw', () => {
    const { TOKEN_SECRET: _omit, ...env } = validProd;
    expect(() => checkEnv({ ...env, NODE_ENV: 'development' })).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('TOKEN_SECRET'));
  });

  it('development: MONGO_URI + blank MONGOBD_* does not warn', () => {
    expect(() => checkEnv({ ...validProd, NODE_ENV: 'development', MONGO_URI: 'mongodb://localhost/test', MONGOBD_USER: '', MONGOBD_PASSWORD: '' })).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
  });

  it('development: a short secret neither throws nor warns', () => {
    expect(() => checkEnv({ ...validProd, NODE_ENV: 'development', TOKEN_SECRET: 'short' })).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
  });
});
